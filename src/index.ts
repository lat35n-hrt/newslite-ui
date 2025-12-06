export default {
  async fetch(request: Request, env: any) {
    const raw = await env.test_kv.get("latest_articles");
    console.log("RAW:", raw);

    let articles: any[] = [];
    try {
      articles = raw ? JSON.parse(raw) : [];
    } catch {
      articles = [];
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>NewsLite UI</title>
      </head>
      <body>
        <h1>📰 NewsLite UI (PoC)</h1>
        ${articles
          .map(
            (a) => `
            <div>
              <a href="${a.url}" target="_blank">${a.title}</a>
              <p>${a.summary}</p>
            </div>`
          )
          .join("")}
      </body>
      </html>
    `;

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=UTF-8" },
    });
  },
};