// src/index.ts — Bootstrap Audio UI + Topic Grouping

export interface Env {
  newslite_kv: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      const date = url.searchParams.get("date");

      if (!date) {
        return new Response(
          htmlWrapper(`<h2>Please specify ?date=YYYY-MM-DD</h2>`),
          { headers: { "Content-Type": "text/html" } }
        );
      }

      const key = `articles/${date}`;
      const raw = await env.newslite_kv.get(key);

      if (!raw) {
        return new Response(
          htmlWrapper(`<h2>No data found for ${date}</h2>`),
          { headers: { "Content-Type": "text/html" } }
        );
      }

      const articles = JSON.parse(raw);
      const grouped = groupByTopic(articles);

      const body = renderGroupedArticles(date, grouped);

      return new Response(htmlWrapper(body), {
        headers: { "Content-Type": "text/html" },
      });
    } catch (err: any) {
      return new Response(`Error: ${err.message}`, { status: 500 });
    }
  },
};

/* --------------------------------------------------
   Group by topic
-------------------------------------------------- */
function groupByTopic(articles: any[]) {
  const map = new Map<string, any[]>();

  for (const a of articles) {
    const t = a.topic || "other";
    if (!map.has(t)) map.set(t, []);
    map.get(t)!.push(a);
  }

  return map;
}

/* --------------------------------------------------
   HTML Rendering
-------------------------------------------------- */

function renderGroupedArticles(date: string, grouped: Map<string, any[]>) {
  let html = `<h1 class="mb-4">NewsLite — ${date}</h1>`;

  for (const [topic, items] of grouped) {
    html += `
      <section class="mb-5">
        <h2 class="mb-3 text-primary text-capitalize">${topic}</h2>
        <div class="row g-4">
          ${items.map(renderArticleCard).join("")}
        </div>
      </section>
    `;
  }

  return html;
}

/* --------------------------------------------------
   Article Card with Bootstrap
-------------------------------------------------- */
function renderArticleCard(article: any) {
  return `
    <div class="col-12 col-md-6 col-lg-4">
      <div class="card shadow-sm h-100">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">
            <a href="${article.url}" target="_blank">
              ${article.title}
            </a>
          </h5>

          <p class="card-text flex-grow-1">${article.summary}</p>

          ${
            article.audio
              ? `<audio controls class="w-100 mt-2">
                   <source src="${article.audio}" type="audio/mpeg">
                 </audio>`
              : `<span class="text-muted">No audio available</span>`
          }
        </div>
      </div>
    </div>
  `;
}

/* --------------------------------------------------
   Bootstrap Layout Wrapper
-------------------------------------------------- */
function htmlWrapper(inner: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>NewsLite</title>

  <!-- Bootstrap CSS -->
  <link
    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
    rel="stylesheet"
  />

  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { padding: 20px; }
    a { text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    ${inner}
  </div>
</body>
</html>
`;
}
