# nloreee-failover

Reverse proxy and failover for nloreee.it, built on Cloudflare Workers.

The Worker acts as a proxy to the actual origin (Pangolin/Traefik running on the VPS). When the origin becomes unreachable — due to downtime, a timeout, or a gateway error — visitors see an "OFFLINE" page built with Next.js and served as a static asset by the same Worker, instead of a Cloudflare or browser error page.

```text
user ──► nloreee.it (Cloudflare) ──► Worker
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
               origin OK                    origin DOWN / timeout
                    │                                 │
           website response                  "OFFLINE" page (503, no-store)
           (original body + status)
```

## How it works

1. Every request to `nloreee.it` passes through the Worker (`run_worker_first = true`, see [`wrangler.toml`](wrangler.toml)).
2. The Worker reconstructs the URL using `ORIGIN_HOSTNAME`, forwards the method, body, and headers, and normalizes `Host` / `X-Forwarded-*` headers for Traefik.
3. If `fetch()` to the origin times out, throws an exception, or returns a failover status code, the Worker responds with the offline page.
4. Otherwise, it returns the origin response unchanged, without aggressive caching or modifying the body or status code.

### When failover is triggered

| Situation | Result |
| --- | --- |
| Timeout exceeding `ORIGIN_TIMEOUT_MS` | Offline page |
| Network / DNS / TLS error | Offline page |
| Redirect loop (`ERR_TOO_MANY_REDIRECTS`) | Offline page |
| `502`, `503`, `504` (gateway errors) | Offline page |
| `521`, `522`, `523`, `524`, `525`, `526`, `530` (Cloudflare errors generated when the origin is itself proxied) | Offline page |
| Application-level `404`, `410`, `4xx`, `5xx` responses | Displayed unchanged |

The last two cases are intentional: an application-level `404` or `500` is a genuine website response. Hiding it behind the offline page would make it harder to identify what is broken.

Cloudflare `5xx` errors must be handled explicitly because `fetch()` does not throw an exception in these cases. Instead, it returns a completed `Response` containing Cloudflare's HTML error page in the response body.

## Repository structure

```text
.
├── worker.js                 # Reverse proxy + failover logic
├── wrangler.toml             # Worker configuration and asset bindings
├── package.json              # Development and deployment scripts
└── fallback-app/             # Next.js app for the offline page
    ├── app/
    │   ├── fallback/         # /fallback route -> fallback.html
    │   ├── components/       # Header, footer, theme, sounds, animated text
    │   ├── hooks/            # useSounds
    │   ├── globals.css       # Light/dark color tokens
    │   └── layout.tsx
    ├── public/failover/       # Assets served under /failover/*
    └── next.config.ts        # output: "export" (static build)
```

The offline page is built using `output: "export"` into `fallback-app/out/`, the directory exposed through the `ASSETS` binding.

## Configuration

Variables can be configured in Cloudflare Dashboard → Worker → Settings → Variables and Secrets, or locally in `.dev.vars` (see [`.dev.vars.example`](.dev.vars.example)).

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `ORIGIN_HOSTNAME` | Yes | — | The actual VPS/Pangolin hostname contacted by `fetch()`. It must be different from `nloreee.it`; otherwise, the Worker will call itself and enter a loop. |
| `ORIGIN_HOST_HEADER` | No | `ORIGIN_HOSTNAME` | The value of the `Host` header sent to Traefik to route the request to the correct router. In most Pangolin setups, this matches the original public hostname. |
| `ORIGIN_TIMEOUT_MS` | No | `5000` | Timeout in milliseconds before the origin is considered unreachable. |

No secrets are required: no credentials are forwarded to the origin. If a token is needed in the future (e.g., a Pangolin authentication header), it should be added as a Secret and read from `env`, never hardcoded into the source code.

## Development

```bash
npm install                 # wrangler
npm run fallback:install    # fallback-app dependencies
npm run dev                 # Build the offline page + start wrangler dev
```

`npm run dev` builds `fallback-app` and then starts `wrangler dev` with a local origin. If `ORIGIN_HOSTNAME` is not set, the Worker returns a `500` response with an explicit error message. Once the origin is configured, you can test failover by pointing it to an unreachable hostname.

To work exclusively on the offline page with hot reload:

```bash
npm run fallback:dev        # http://localhost:3000/fallback
```

> `fallback-app` uses Bun for development (`packageManager` in `package.json`, with `bun.lock` committed to the repository). However, the root scripts use `npm`, as this is what Workers Builds runs; the project's `packageManager` setting is not honored there. For this reason, `fallback-app/package-lock.json` is included in `.gitignore`, and `bun.lock` remains the source of truth.

## Deployment

```bash
npm run deploy              # Build the offline page + deploy with Wrangler
```

Alternatively, use Cloudflare Workers Builds for automatic deployment on every push:

| Field | Value |
| --- | --- |
| Build command | `npm run fallback:build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |

`fallback:build` installs the `fallback-app` dependencies before building. Running `npm install` at the repository root alone is not sufficient, because `fallback-app` is not a workspace and `next build` will fail with `sh: 1: next: not found` if its dependencies are missing.

Variables can also be configured in the Builds settings. `keep_vars = true` in [`wrangler.toml`](wrangler.toml) prevents them from being removed during deployments.

## Important details

- **`run_worker_first = true` is essential.** Without it, Cloudflare serves matching static assets directly, bypassing the Worker.
- **Static assets are never proxied.** The `/_next/` paths (Next.js JS/CSS chunks) and `/failover/` paths (files in `fallback-app/public/failover/`) are always served through `ASSETS`. If they were proxied, every request would time out while the VPS was down and be replaced by the offline page instead of the actual file. This would break hydration (the "Retry" button would stop responding) and images would fail to load.
- **`redirect: "follow"` allows the Worker to follow redirects from the origin** instead of forwarding them to the browser. Legitimate redirects are resolved transparently. A redirect loop (e.g., Pangolin redirecting to the same public host when a resource is disabled) triggers the runtime's redirect limit, which is converted into the offline page instead of reaching the browser as `ERR_TOO_MANY_REDIRECTS`.
- **The offline page is never cached** (`Cache-Control: no-store`), preventing it from remaining visible after the VPS comes back online.
- **Automatic reloading uses `503` as a signal** (`useAutoReload`). The page retries `window.location.href` every 5 seconds, increasing the interval up to 30 seconds, and reloads when the response is no longer a `503`. The `503` status is a reliable signal because the Worker only returns it for the fallback page: any `503` returned by the origin is converted into the fallback page as well.
- Each probe generates an additional request to the origin (when the VPS is down, each one costs `ORIGIN_TIMEOUT_MS`). Therefore, probes are paused while the tab is in the background and resume as soon as it becomes visible again.