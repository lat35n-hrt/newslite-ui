# README.md

Minimal, clean, and useful for external developers

# NewsLite UI — Cloudflare Workers + KV Prototype

This project is a minimal UI layer for NewsLite, implemented as a server-rendered Cloudflare Worker.
The Worker fetches article data stored in Cloudflare Workers KV and renders a simple HTML page.

The goal is to provide a lightweight, serverless UI suitable for global deployment on Cloudflare’s edge network.

## Features

⚡ Cloudflare Workers (TypeScript)

- Reads article JSON from Workers KV

- Zero-JS, server-rendered HTML template

-  Ready for production (KV binding separation: production / preview)

-  Fast deployment via wrangler publish

## Project Structure
```
newslite-ui/
├── src/
│   └── index.ts        # Worker entry point
├── data/
│   └── latest_articles.json.example
├── wrangler.toml       # Cloudflare Worker configuration
├── package.json
└── tsconfig.json
```

## Development Setup
1. Install Dependencies

```
npm install
```

2. Configure Cloudflare KV (required)

Cloudflare Workers uses two KV namespaces for each binding:

- `id`: the KV namespace used when the Worker is deployed (production mode)
- `preview_id`: the KV namespace used during `wrangler dev` (preview mode)

This project uses:

- test_kv (production namespace)
- test_kv_preview (preview namespace)

Example configuration inside wrangler.toml:

```toml
[[kv_namespaces]]
binding = "test_kv"
id = "<your-production-namespace-id>"
preview_id = "<your-preview-namespace-id>"
remote = true
```

remote = true ensures that wrangler dev always reads from remote preview KV.

## Running Locally

```
npx wrangler dev
```

Then open:

http://localhost:8787


The Worker will fetch articles from KV and render them as HTML.

## Deploying

```
npx wrangler publish
```

After publishing, the Worker automatically uses:

- preview_id in dev

- id in production

No additional changes are required.

## Adding Data to KV (Example)

Upload JSON:

```
npx wrangler kv key put latest_articles "$(cat ./data/latest_articles.json.example)" \
  --binding=test_kv --remote
```

Confirm:

```
npx wrangler kv key get latest_articles --binding=test_kv --remote
```

## Worker Logic (src/index.ts)

The Worker fetches data from KV and renders a minimal UI:

```ts
export default {
  async fetch(request, env) {
    const raw = await env.test_kv.get("latest_articles");
    const articles = raw ? JSON.parse(raw) : [];

    const html = `
      <html><body>
        <h1>📰 NewsLite UI</h1>
        ${articles.map(a => `
          <div>
            <a href="${a.url}">${a.title}</a>
            <p>${a.summary}</p>
          </div>
        `).join("")}
      </body></html>
    `;

    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  },
};
```

## Requirements
- Node.js 18+

- Cloudflare account

- Wrangler 4.x+

## License

MIT License.
Feel free to fork and adapt for your own Worker-based UI projects.