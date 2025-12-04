/**
 * Cloudflare Pages Worker to handle SPA routing
 * Static files are excluded via _routes.json, so this only handles SPA routes
 * Serves index.html for all non-static routes to enable client-side routing
 */
export default {
  async fetch(request, env) {
    // Only handle GET/HEAD requests for SPA routing
    if (request.method === 'GET' || request.method === 'HEAD') {
      // Serve index.html - React Router will handle the client-side routing
      const indexRequest = new Request(new URL('/index.html', request.url), {
        method: request.method,
        headers: request.headers,
      });
      return env.ASSETS.fetch(indexRequest);
    }

    // For other methods, return 405 Method Not Allowed
    return new Response('Method Not Allowed', { status: 405 });
  }
};

