// Serverless proxy for short team/match digests.
// Facts are built client-side from ESPN/local tournament state; this function only
// turns that compact payload into <=3 sentences and shares the result across users.

import { getStore } from "@netlify/blobs";

const MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];
const MEM_TTL = 30 * 60 * 1000;
const mem = new Map();
const inflight = new Map();

const SYSTEM = `You write tiny FIFA World Cup 2026 context blurbs inside a live scores app.
Use only the supplied facts. Do not invent injuries, transfers, scores, stakes, or tactical news.
Write at most 3 short sentences, plain text only. No markdown, no headers, no emojis.
Sound like a sharp football friend: specific, useful, calm. If facts are thin, stay brief.`;

const json = (obj, status = 200, headers = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...headers },
  });

function hashText(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function blobStore() {
  try { return getStore("micro-digest"); } catch { return null; }
}
async function blobGet(store, key) {
  if (!store) return null;
  try { return await store.get(key, { type: "json" }); } catch { return null; }
}
async function blobSet(store, key, val) {
  if (!store) return;
  try { await store.setJSON(key, val); } catch { /* non-fatal */ }
}

function parseError(raw) {
  try {
    const j = JSON.parse(raw);
    const msg = j?.error?.message || "";
    const retry = (j?.error?.details || []).find((d) => /RetryInfo/.test(d["@type"] || ""));
    const secs = retry?.retryDelay ? parseInt(retry.retryDelay, 10) : null;
    return { detail: msg.slice(0, 220), retryAfter: Number.isFinite(secs) ? secs : null };
  } catch {
    return { detail: String(raw).slice(0, 220), retryAfter: null };
  }
}

async function callModel(model, key, facts) {
  const generationConfig = { temperature: 0.45, maxOutputTokens: 220 };
  if (model.startsWith("gemini-2.5")) generationConfig.thinkingConfig = { thinkingBudget: 0 };
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [{ parts: [{ text: `Facts:\n\n${facts}` }] }],
    generationConfig,
  };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const { detail, retryAfter } = parseError(await r.text());
    return { ok: false, status: r.status, detail, retryAfter };
  }
  const data = await r.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("").trim() ?? "";
  return text ? { ok: true, text, model } : { ok: false, status: 502, detail: "empty completion" };
}

async function generate(facts, key) {
  let last = null;
  for (const model of MODELS) {
    const r = await callModel(model, key, facts);
    if (r.ok) return r;
    last = r;
    if ([400, 401, 403, 404].includes(r.status)) break;
  }
  return last ?? { ok: false, status: 502, detail: "no response" };
}

export default async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const key = process.env.GEMINI_API_KEY;
  if (!key) return json({ error: "GEMINI_API_KEY not configured" }, 500);

  let facts = "", cacheKey = "";
  try { ({ facts, cacheKey = "" } = await req.json()); } catch { /* ignore */ }
  if (!facts || typeof facts !== "string") return json({ error: "missing facts" }, 400);

  const h = hashText(`${cacheKey}\n${facts}`);
  const store = blobStore();
  const keyName = `m_${h}`;

  const m = mem.get(h);
  if (m && Date.now() - m.ts < MEM_TTL) return json({ text: m.text, cached: "mem" });

  const b = await blobGet(store, keyName);
  if (b?.text) {
    mem.set(h, { text: b.text, ts: Date.now() });
    return json({ text: b.text, cached: "blob" });
  }

  let p = inflight.get(h);
  if (!p) {
    p = generate(facts, key);
    inflight.set(h, p);
    p.finally(() => inflight.delete(h));
  }
  const r = await p;
  if (r.ok) {
    const entry = { text: r.text, ts: Date.now() };
    if (mem.size > 200) mem.clear();
    mem.set(h, entry);
    await blobSet(store, keyName, entry);
    return json({ text: r.text });
  }

  const headers = {};
  if (r.status === 429 && r.retryAfter) headers["retry-after"] = String(r.retryAfter);
  return json({ error: `gemini ${r.status ?? "error"}`, detail: r.detail ?? "" }, r.status === 429 ? 429 : 502, headers);
};
