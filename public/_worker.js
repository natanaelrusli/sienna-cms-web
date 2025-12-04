/**
 * Cloudflare Worker to handle SPA routing
 * Serves index.html for all routes that don't match static assets
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // List of static file extensions that should be served directly
    const staticExtensions = [
      '.js', '.css', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico',
      '.woff', '.woff2', '.ttf', '.eot', '.json', '.map', '.webp', '.avif'
    ];

    // Check if the request is for a static file
    const isStaticFile = staticExtensions.some(ext => pathname.endsWith(ext)) ||
                         pathname.startsWith('/assets/');

    // If it's a static file, let Cloudflare serve it normally
    if (isStaticFile) {
      return env.ASSETS.fetch(request);
    }

    // Only serve index.html for GET/HEAD requests (SPA fallback)
    // This allows API routes or other methods to work if needed
    if (request.method === 'GET' || request.method === 'HEAD') {
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

