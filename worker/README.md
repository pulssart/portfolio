# Adrien Health Relay — Cloudflare Worker

Relays Apple HealthKit data from the Health Auto Export iOS app to a public JSON endpoint consumed by the portfolio site.

## Setup (one-time, ~5 min)

```bash
cd worker
npm install
npx wrangler login              # opens browser, log in to Cloudflare
npx wrangler kv namespace create HEALTH_KV
```

The last command prints something like:

```
[[kv_namespaces]]
binding = "HEALTH_KV"
id = "abcdef1234567890..."
```

Copy that `id` value and paste it into `wrangler.toml` (replace `REPLACE_WITH_KV_ID`).

### Optional auth

To require an auth header on `/push`:

```bash
npx wrangler secret put PUSH_TOKEN
# paste a long random string, e.g. `openssl rand -hex 32`
```

Then in the Health Auto Export iPhone app, add an HTTP header:

| Key             | Value             |
| --------------- | ----------------- |
| `Authorization` | `Bearer <token>`  |

## Deploy

```bash
npx wrangler deploy
```

Output gives you a URL like `https://adrien-health.<your-account>.workers.dev`.

## Endpoints

- `POST /push` — Health Auto Export points here
- `GET  /health` — returns latest metrics as JSON (CORS allows `*`)
- `GET  /` — sanity check

## Health Auto Export config

In the iPhone app, set the automation URL to:

```
https://adrien-health.<your-account>.workers.dev/push
```

## Local dev

```bash
npx wrangler dev
# then `curl localhost:8787/health`
```
