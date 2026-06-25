// Serverless proxy for the AI daily digest.
// Keeps the Gemini API key server-side (set GEMINI_API_KEY in Netlify env vars).
// The browser POSTs { facts: "<plain-text tournament state>" }; we prompt Gemini
// and return { text }. Retries transient 429/500/503 (model overloaded) and falls
// back to a second model.

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];
// Retry rapidly only on server overload. 429 (rate limit) is NOT retried in a tight
// loop — hammering it just makes the rate limit worse; we fall through to the next
// model and surface the reason instead.
const RETRYABLE = new Set([500, 503]);

const SYSTEM = `You are a sports writer producing a short daily briefing for a FIFA World Cup 2026 live tracker.
Write 2-3 tight paragraphs (about 90-150 words total), plain text only — no markdown, no headers, no bullet points, no emojis.
The facts include a "Focus:" line telling you the day's situation — follow it:
- If there are matches today, lead with the biggest storyline (a live game, a major result, or a standings shake-up), then note games still to come today and what's at stake.
- If there are no matches today, open by recapping the most recent results (the headline outcomes and what they did to the standings), then preview the next fixtures to come.
Use ONLY the facts provided. Never invent scores, scorers, results, or fixtures. If a fact isn't given, don't state it.
Tone: lively and knowledgeable, like a TV anchor's cold open. Refer to "today", "yesterday", or "next up" naturally based on the Focus line.`;

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// Pull a short human-readable reason out of Gemini's error JSON.
function shortReason(raw) {
  try {
    const j = JSON.parse(raw);
    const msg = j?.error?.message || "";
    const quota = (j?.error?.details || []).find((d) => /QuotaFailure/.test(d["@type"] || ""));
    const retry = (j?.error?.details || []).find((d) => /RetryInfo/.test(d["@type"] || ""));
    const bits = [msg];
    if (quota?.violations?.[0]?.quotaId) bits.push(`quota: ${quota.violations[0].quotaId}`);
    if (retry?.retryDelay) bits.push(`retry in ${retry.retryDelay}`);
    return bits.filter(Boolean).join(" — ").slice(0, 220);
  } catch {
    return String(raw).slice(0, 220);
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
    last = { status: r.status, detail: shortReason(await r.text()) };
    if (!RETRYABLE.has(r.status)) break; // 429/4xx — don't tight-loop; fall through
    if (i < 2) await sleep(500 * Math.pow(2, i)); // 500ms, 1000ms
  }
  return { ok: false, ...last };
}

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), { status: 405 });
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), { status: 500 });
  }
  let facts = "";
  try { ({ facts } = await req.json()); } catch { /* ignore */ }
  if (!facts || typeof facts !== "string") {
    return new Response(JSON.stringify({ error: "missing facts" }), { status: 400 });
  }

  // Generous output budget so the digest is never truncated. On 2.5 "thinking"
  // models, internal reasoning tokens are billed against maxOutputTokens — so we
  // also disable thinking (thinkingBudget: 0) to hand the whole budget to the text.
  const bodyFor = (model) => {
    const generationConfig = { temperature: 0.7, maxOutputTokens: 2048 };
    if (model.startsWith("gemini-2.5")) generationConfig.thinkingConfig = { thinkingBudget: 0 };
    return {
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ parts: [{ text: `Tournament state:\n\n${facts}` }] }],
      generationConfig,
    };
  };

  try {
    let lastErr = null;
    for (const model of MODELS) {
      const res = await callModel(model, key, bodyFor(model));
      if (res.ok) {
        const text = res.data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("").trim() ?? "";
        if (text) {
          return new Response(JSON.stringify({ text, model }), {
            headers: { "content-type": "application/json", "cache-control": "no-store" },
          });
        }
        lastErr = { status: 502, detail: "empty completion" };
      } else {
        lastErr = res;
        // stop on fatal client errors (bad key/model); for 429/5xx try the next model
        if ([400, 401, 403, 404].includes(res.status)) break;
      }
    }
    return new Response(
      JSON.stringify({ error: `gemini ${lastErr?.status ?? "error"}`, detail: lastErr?.detail ?? "" }),
      { status: lastErr?.status === 429 ? 429 : 502 }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 502 });
  }
};
