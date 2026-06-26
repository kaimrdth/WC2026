// Serverless proxy for the AI daily digest.
// Keeps the Gemini API key server-side (set GEMINI_API_KEY in Netlify env vars).
// The browser POSTs { facts: "<plain-text tournament state>" } and gets back { text }.
//
// Rate-limit strategy (the whole point of this layer):
//   1. SHARED cache keyed by a content hash of the facts — so all visitors share ONE
//      generation per tournament-state instead of each browser calling Gemini. This is
//      what actually keeps us under Gemini's per-minute request limit when several
//      people open the app at once. Two tiers: in-process memory (instant) + Netlify
//      Blobs (durable, cross-instance).
//   2. Request coalescing — concurrent identical requests on one instance await a single
//      Gemini call rather than firing N of them.
//   3. Graceful degradation — on a rate limit (or any failure) we serve the last good
//      digest ("stale") instead of erroring, and pass Gemini's Retry-After back so the
//      client can back off.

import { getStore } from "@netlify/blobs";

const MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
// Retry rapidly only on server overload. 429 (rate limit) is NOT retried in a tight
// loop — hammering it just makes the rate limit worse; we fall through to the next
// model and surface the reason instead.
const RETRYABLE = new Set([500, 503]);

const MEM_TTL = 10 * 60 * 1000; // in-process cache freshness
const FORCE_FRESH_WINDOW_MS = 10 * 60 * 1000; // a forced refresh reuses a generation this new (shared across clients)
const mem = new Map();          // hash → { text, ts } (survives warm invocations)
const inflight = new Map();     // hash → Promise<result> (coalesce concurrent calls)
let lastGoodMem = null;         // most recent successful digest (memory fallback)

const SYSTEM = `You are the reader's most knowledgeable football friend giving them the quick word on the FIFA World Cup 2026. You know the players, the storylines, and the stakes cold.
Voice: enthusiastic but understated and cool — never breathless, hype-y, or clichéd. Drop the kind of offhand, knowing asides a real fan makes, e.g. "And Harry Kane, of course, scored twice today — how good is he." Dry wit is welcome; exclamation marks and stock phrases ("what a match!", "the beautiful game") are not.
Write 2-3 short paragraphs (about 90-150 words total), plain text only — no markdown, no headers, no bullet points, no emojis.
Do NOT open with a greeting or the time of day — the app prepends that. Start straight on the most interesting thing.
The facts include a "Focus:" line telling you the day's situation — follow it:
- If there are matches today, lead with the biggest storyline (a live game, a major result, or a standings swing), then what's still to come today and what's at stake.
- If there are no matches today, recap the most recent results (and what they did to the table), then nod to what's coming up next.
Use ONLY the facts provided. Never invent scores, scorers, results, or fixtures. If a fact isn't given, don't state it.`;

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const json = (obj, status = 200, headers = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...headers },
  });

// Stable hash of the facts. Normalizes away the live match clock ("44'" vs "45'") so
// two visitors a minute apart share the same cache entry as long as scores are equal.
function hashFacts(facts) {
  const stable = facts.replace(/\((?:\d+'|\d+\+\d+'|HT|Halftime)[^)]*,/g, "(LIVE,");
  let h = 5381;
  for (let i = 0; i < stable.length; i++) h = ((h << 5) + h + stable.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// Netlify Blobs is auto-configured in the Netlify runtime; guard so the function still
// works (memory-only) anywhere it isn't available.
function blobStore() {
  try { return getStore("digest"); } catch { return null; }
}
async function blobGet(store, key) {
  if (!store) return null;
  try { return await store.get(key, { type: "json" }); } catch { return null; }
}
async function blobSet(store, key, val) {
  if (!store) return;
  try { await store.setJSON(key, val); } catch { /* non-fatal */ }
}

// Pull a short human-readable reason + retry delay out of Gemini's error JSON.
function parseError(raw) {
  try {
    const j = JSON.parse(raw);
    const msg = j?.error?.message || "";
    const details = j?.error?.details || [];
    const quota = details.find((d) => /QuotaFailure/.test(d["@type"] || ""));
    const retry = details.find((d) => /RetryInfo/.test(d["@type"] || ""));
    const bits = [msg];
    if (quota?.violations?.[0]?.quotaId) bits.push(`quota: ${quota.violations[0].quotaId}`);
    if (retry?.retryDelay) bits.push(`retry in ${retry.retryDelay}`);
    const secs = retry?.retryDelay ? parseInt(retry.retryDelay, 10) : null;
    return { detail: bits.filter(Boolean).join(" — ").slice(0, 220), retryAfter: Number.isFinite(secs) ? secs : null };
  } catch {
    return { detail: String(raw).slice(0, 220), retryAfter: null };
  }
}

async function callModel(model, key, body) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  let last = null;
  for (let i = 0; i < 3; i++) {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) return { ok: true, data: await r.json() };
    const { detail, retryAfter } = parseError(await r.text());
    last = { ok: false, status: r.status, detail, retryAfter };
    if (!RETRYABLE.has(r.status)) break; // 429/4xx — don't tight-loop; fall through
    if (i < 2) await sleep(500 * Math.pow(2, i)); // 500ms, 1000ms
  }
  return last;
}

function bodyFor(model, facts, fresh = false) {
  // Generous output budget so the digest is never truncated. On 2.5 "thinking" models,
  // internal reasoning tokens are billed against maxOutputTokens — so we disable
  // thinking (thinkingBudget: 0) to hand the whole budget to the text.
  // On a manual refresh (`fresh`), nudge for a different angle + higher temperature so the
  // re-roll is noticeably different from the previous take (the facts are identical).
  const generationConfig = { temperature: fresh ? 0.95 : 0.7, maxOutputTokens: 2048 };
  if (model.startsWith("gemini-2.5")) generationConfig.thinkingConfig = { thinkingBudget: 0 };
  const text = fresh
    ? `Tournament state:\n\n${facts}\n\nThis is a manual refresh — write a noticeably different take: open differently and vary the phrasing and which storyline you lead with, while keeping every fact accurate. (variation ${Math.random().toString(36).slice(2, 8)})`
    : `Tournament state:\n\n${facts}`;
  return {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [{ parts: [{ text }] }],
    generationConfig,
  };
}

// Try each model in turn. Returns { ok, text } or { ok:false, status, detail, retryAfter }.
async function generate(facts, key, fresh = false) {
  let lastErr = null;
  for (const model of MODELS) {
    const res = await callModel(model, key, bodyFor(model, facts, fresh));
    if (res?.ok) {
      const text = res.data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("").trim() ?? "";
      if (text) return { ok: true, text, model };
      lastErr = { ok: false, status: 502, detail: "empty completion", retryAfter: null };
    } else {
      lastErr = res;
      if ([400, 401, 403, 404].includes(res?.status)) break; // fatal — don't try next model
    }
  }
  return lastErr ?? { ok: false, status: 502, detail: "no response", retryAfter: null };
}

export default async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const key = process.env.GEMINI_API_KEY;
  if (!key) return json({ error: "GEMINI_API_KEY not configured" }, 500);

  let facts = "", force = false;
  try { ({ facts, force = false } = await req.json()); } catch { /* ignore */ }
  if (!facts || typeof facts !== "string") return json({ error: "missing facts" }, 400);

  const h = hashFacts(facts);
  const store = blobStore();

  // `force` (the manual refresh button) bypasses every cache and calls Gemini directly,
  // then overwrites the caches. Normal requests check L1/L2 and coalesce first.
  let r;
  if (force) {
    // Even a forced refresh reuses a very recent generation of THIS exact state, so several
    // clients refreshing in the same window share one Gemini call instead of each paying.
    const recent = mem.get(h) || (await blobGet(store, `d_${h}`));
    if (recent?.text && recent.ts && Date.now() - recent.ts < FORCE_FRESH_WINDOW_MS) {
      mem.set(h, recent);
      return json({ text: recent.text, cached: "recent" });
    }
    r = await generate(facts, key, true); // fresh re-roll
  } else {
    // L1 — in-process memory (instant, free, no Gemini call).
    const m = mem.get(h);
    if (m && Date.now() - m.ts < MEM_TTL) return json({ text: m.text, cached: "mem" });

    // L2 — shared Blobs cache (another instance/visitor already generated this state).
    const b = await blobGet(store, `d_${h}`);
    if (b?.text) {
      mem.set(h, { text: b.text, ts: Date.now() });
      return json({ text: b.text, cached: "blob" });
    }

    // Coalesce: if an identical request is already generating on this instance, await it.
    let p = inflight.get(h);
    if (!p) {
      p = generate(facts, key);
      inflight.set(h, p);
      p.finally(() => inflight.delete(h));
    }
    r = await p;
  }

  if (r.ok) {
    const entry = { text: r.text, ts: Date.now() };
    if (mem.size > 100) mem.clear(); // bound memory
    mem.set(h, entry);
    lastGoodMem = entry;
    await blobSet(store, `d_${h}`, entry);
    await blobSet(store, "latest", entry); // for stale-on-failure fallback
    return json({ text: r.text });
  }

  // Generation failed. Serve the last good digest (stale) rather than erroring/hiding.
  const latest = (await blobGet(store, "latest")) || lastGoodMem;
  if (latest?.text) return json({ text: latest.text, stale: true });

  // Nothing cached to fall back on — surface the error (client hides on 429).
  const headers = {};
  if (r.status === 429 && r.retryAfter) headers["retry-after"] = String(r.retryAfter);
  return json({ error: `gemini ${r.status ?? "error"}`, detail: r.detail ?? "" }, r.status === 429 ? 429 : 502, headers);
};
