export default {
  async fetch(request, env) {
    return handleRequest(request, env);
  },
};

async function handleRequest(request: Request, env: Env): Promise<Response> {
  // ---- 1. Date（?date=YYYY-MM-DD） ----
  const url = new URL(request.url);
  const date = url.searchParams.get("date");

  // key
  const key = date
    ? `articles/${date}`
    : "latest_articles";

  // ---- 2. Fetch articles from KV ----
  const raw = await env.test_kv.get(key);
  console.log("RAW:", raw);

  let articles: any[] = [];
  try {
    articles = raw ? JSON.parse(raw) : [];
  } catch {
    articles = [];
  }

  // ---- 3. Group by topic ----
  const grouped = groupByTopic(articles);

  // ---- 4. HTML (with Bootstrap) ----
  const html = renderHTML(grouped, date);

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=UTF-8" },
  });
}

/**
 * Group by topic
 */
function groupByTopic(items: any[]): Map<string, any[]> {
  const groups = new Map<string, any[]>();

  for (const item of items) {
    const topic = item.topic ? String(item.topic) : "other";

    if (!groups.has(topic)) {
      groups.set(topic, []);
    }
    groups.get(topic)!.push(item);
  }

  return groups;
}

/**
 * HTML rendering (minimal Bootstrap)
 */
function renderHTML(groups: Map<string, any[]>, date: string | null): string {
  const pageTitle = date
    ? `NewsLite UI — ${date}`
    : "NewsLite UI (Latest Articles)";

  let sections = "";

  for (const [topic, items] of groups.entries()) {
    const itemsHTML = items
      .map(
        (a) => `
          <div class="mb-4">
            <h5><a href="${a.url}" target="_blank">${a.title}</a></h5>
            <p class="text-muted">${a.summary}</p>
          </div>
        `
      )
      .join("");

    sections += `
      <section class="mb-5">
        <h3 class="border-bottom pb-2 text-capitalize">${topic}</h3>
        ${itemsHTML || "<p>No articles.</p>"}
      </section>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${pageTitle}</title>

  <!-- Bootstrap CDN -->
  <link
    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
    rel="stylesheet"
  >
</head>
<body class="bg-light">

  <div class="container py-4">

    <h1 class="mb-4">📰 NewsLite UI</h1>

    <p class="text-secondary">
      ${date ? `Articles for <strong>${date}</strong>` : "Latest daily summary"}
    </p>

    ${sections}

  </div>

</body>
</html>
`;
}