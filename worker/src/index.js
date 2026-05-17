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

// Metrics that should be summed across the array (daily totals)
const CUMULATIVE = new Set([
  "step_count",
  "walking_running_distance",
  "flights_climbed",
  "active_energy",
  "basal_energy_burned",
  "apple_exercise_time",
  "apple_stand_time",
  "apple_stand_hour",
  "time_in_daylight",
  "dietary_water",
  "swimming_distance",
  "cycling_distance",
]);

function todayKey() {
  const d = new Date();
  const off = -d.getTimezoneOffset() / 60;
  const local = new Date(d.getTime() + off * 3600 * 1000);
  return local.toISOString().slice(0, 10);
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const t = Date.parse(dateStr);
  if (Number.isNaN(t)) return false;
  const day = new Date(t).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  return day === today;
}

function mergeMetrics(existing, payload) {
  const out = { ...existing, updatedAt: new Date().toISOString() };
  const metrics = (payload && payload.data && payload.data.metrics) || [];
  const today = todayKey();

  for (const m of metrics) {
    if (!m || !m.name || !Array.isArray(m.data) || !m.data.length) continue;

    if (CUMULATIVE.has(m.name)) {
      // Sum today's samples only, with a daily reset
      let total = 0;
      let count = 0;
      let latestDate = null;
      for (const entry of m.data) {
        if (typeof entry.qty !== "number") continue;
        if (!isToday(entry.date)) continue;
        total += entry.qty;
        count += 1;
        if (!latestDate || Date.parse(entry.date) > Date.parse(latestDate)) latestDate = entry.date;
      }
      // Merge with stored same-day total
      const prev = existing[m.name];
      const prevSameDay = prev && prev.day === today ? prev.qty || 0 : 0;
      const merged = prevSameDay + total;
      if (count === 0 && !prev) continue;
      out[m.name] = {
        qty: count > 0 ? merged : prev ? prev.qty : 0,
        day: today,
        date: latestDate || (prev && prev.date) || null,
        units: m.units || (prev && prev.units),
        samples: (prev && prev.day === today ? prev.samples || 0 : 0) + count,
      };
      continue;
    }

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
