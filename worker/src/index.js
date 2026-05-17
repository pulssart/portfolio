/**
 * Cloudflare Worker — Apple Health relay
 *
 * Endpoints:
 *   POST /push    → receive Health Auto Export payload, store latest per metric
 *   GET  /health  → return latest values as JSON for the portfolio
 *
 * Optional auth: set a secret named PUSH_TOKEN
 *   wrangler secret put PUSH_TOKEN
 * Then in Health Auto Export, add header:
 *   Authorization: Bearer <token>
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    if (method === "OPTIONS") return new Response(null, { headers: cors() });

    if (url.pathname === "/push" && method === "POST") {
      const expected = env.PUSH_TOKEN;
      if (expected) {
        const auth = request.headers.get("Authorization") || "";
        if (auth !== "Bearer " + expected) {
          return json({ error: "unauthorized" }, 401);
        }
      }

      let body;
      try {
        body = await request.json();
      } catch (_) {
        return json({ error: "invalid_json" }, 400);
      }

      const existing = await readState(env);
      const merged = mergeMetrics(existing, body);
      await env.HEALTH_KV.put("health:latest", JSON.stringify(merged));

      return json({ ok: true, mergedKeys: Object.keys(merged).length });
    }

    if (url.pathname === "/health" && method === "GET") {
      const raw = await env.HEALTH_KV.get("health:latest");
      const data = raw ? JSON.parse(raw) : {};
      return json(data, 200, { "Cache-Control": "max-age=30" });
    }

    if (url.pathname === "/" && method === "GET") {
      return new Response(
        "Adrien Health Relay · POST /push · GET /health",
        { headers: { "Content-Type": "text/plain", ...cors() } }
      );
    }

    return json({ error: "not_found" }, 404);
  },
};

async function readState(env) {
  try {
    const raw = await env.HEALTH_KV.get("health:latest");
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

function mergeMetrics(existing, payload) {
  const out = { ...existing, updatedAt: new Date().toISOString() };
  const metrics = (payload && payload.data && payload.data.metrics) || [];

  for (const m of metrics) {
    if (!m || !m.name || !Array.isArray(m.data) || !m.data.length) continue;
    const latest = pickLatest(m.data, ["date", "sleepEnd", "sleepStart", "end", "start"]);
    if (!latest) continue;
    out[m.name] = { ...latest, units: m.units || undefined };
  }

  const workouts = (payload && payload.data && payload.data.workouts) || [];
  if (Array.isArray(workouts) && workouts.length) {
    const latest = pickLatest(workouts, ["end", "start", "date"]);
    if (latest) out.workout = latest;
  }

  return out;
}

function pickLatest(arr, dateFields) {
  let best = null;
  let bestTime = -Infinity;
  for (const entry of arr) {
    let t = -Infinity;
    for (const f of dateFields) {
      if (entry[f]) {
        const parsed = Date.parse(entry[f]);
        if (!Number.isNaN(parsed) && parsed > t) t = parsed;
      }
    }
    if (t > bestTime) {
      bestTime = t;
      best = entry;
    }
  }
  return best;
}

function cors(extra = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    ...extra,
  };
}

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...cors(extra) },
  });
}
