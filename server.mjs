import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "2mb" }));

// Basic per-IP protection for this training prototype. Use a shared rate limiter
// (for example Redis) before running multiple production instances.
const sessionHits = new Map();
app.use("/api/session", (req, res, next) => {
  const now = Date.now();
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
  const recent = (sessionHits.get(ip) || []).filter(t => now - t < 60_000);
  if (recent.length >= 8) return res.status(429).json({ error: "Too many call attempts. Wait one minute and try again." });
  recent.push(now); sessionHits.set(ip, recent); next();
});
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));

const allowedLanguages = new Set(["ar", "en", "it", "fr", "tr"]);
const languageNames = { ar: "Arabic", en: "English", it: "Italian", fr: "French", tr: "Turkish" };

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, apiKeyConfigured: Boolean(process.env.OPENAI_API_KEY), service: "AI Call Center Academy Realtime" });
});

app.post("/api/session", async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: "OPENAI_API_KEY is not configured on the server. Add it to the server environment, then restart." });
  }
  const { sdp, language = "ar", market = "Egypt", brand = "a service provider", campaign = "Billing support" } = req.body || {};
  if (typeof sdp !== "string" || sdp.length < 100) return res.status(400).json({ error: "A valid WebRTC SDP offer is required." });
  const lang = allowedLanguages.has(language) ? language : "ar";
  const safeText = (value, fallback, max = 120) => typeof value === "string" ? value.trim().slice(0, max) || fallback : fallback;
  const safeMarket = safeText(market, "Egypt", 80);
  const safeBrand = safeText(brand, "a service provider", 100);
  const safeCampaign = safeText(campaign, "Billing support", 120);
  const instructions = `You are the CUSTOMER in a call-center training simulation. The human is the TRAINEE AGENT. You must speak first and remain the customer for the entire call. Speak naturally in ${languageNames[lang]}. Scenario: ${safeCampaign} for ${safeBrand} in ${safeMarket}. You are upset because your latest bill is unexpectedly higher than usual. Reveal information gradually, respond realistically to the agent's questions, express emotion and objections naturally, and adapt to what the trainee says. Never switch into the agent or coach role. Never request passwords, PINs, or full card details. Keep turns concise.`;
  const session = {
    type: "realtime",
    model: "gpt-realtime-2.1",
    instructions,
    audio: { output: { voice: "marin" }, input: { turn_detection: { type: "semantic_vad" } } }
  };
  try {
    const form = new FormData();
    form.set("sdp", new Blob([sdp], { type: "application/sdp" }), "offer.sdp");
    form.set("session", new Blob([JSON.stringify(session)], { type: "application/json" }), "session.json");
    const upstream = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form
    });
    const answer = await upstream.text();
    if (!upstream.ok) {
      console.error("OpenAI Realtime error", upstream.status, answer.slice(0, 1500));
      return res.status(upstream.status).json({ error: `Realtime API rejected the call (${upstream.status}). Check API access, billing, and model availability.`, detail: answer.slice(0, 1200) });
    }
    res.set("Cache-Control", "no-store");
    res.json({ sdp: answer, sessionLocation: upstream.headers.get("Location") || null });
  } catch (error) {
    console.error("Realtime session error", error);
    res.status(502).json({ error: "Could not reach the Realtime API. Check server internet connectivity." });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`AI Call Center Academy ready at http://localhost:${PORT}`);
  console.log(`OpenAI API key configured: ${Boolean(process.env.OPENAI_API_KEY)}`);
});
