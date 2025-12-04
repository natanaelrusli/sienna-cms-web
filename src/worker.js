export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Try to serve static asset (index.html, JS, CSS, images)
    let response = await env.ASSETS.fetch(request);

    // 2. If not found and it's likely an SPA route, fall back to index.html
    const isGet = request.method === "GET";
    const looksLikeSpaRoute =
      !url.pathname.includes(".") && // no file extension like .js/.css/.png
      !url.pathname.startsWith("/api"); // let API routes 404 or be handled differently

    if (response.status === 404 && isGet && looksLikeSpaRoute) {
      const indexRequest = new Request(`${url.origin}/index.html`, request);
      return env.ASSETS.fetch(indexRequest);
    }

    // 3. Return whatever we got
    return response;
  },
};
