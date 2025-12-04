export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      
      // For Cloudflare Pages, ASSETS should be automatically available
      // Check if ASSETS is available, with fallback for debugging
      if (!env) {
        return new Response('env not available', { status: 500 });
      }
      
      // Try to get ASSETS binding (may be env.ASSETS or accessed differently)
      const assets = env.ASSETS;
      if (!assets) {
        // Log available env keys for debugging
        const envKeys = Object.keys(env).join(', ');
        return new Response(`ASSETS not available. Env keys: ${envKeys || 'none'}`, { 
          status: 500,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      // Only handle GET/HEAD requests for SPA routing
      if (request.method === 'GET' || request.method === 'HEAD') {
        // Try to fetch the requested resource first
        const response = await assets.fetch(request);
        
        // If found (status < 400), return it
        if (response.status < 400) {
          return response;
        }
        
        // If not found and looks like an SPA route, serve index.html
        const hasFileExtension = url.pathname.includes('.');
        const isApiRoute = url.pathname.startsWith('/api');
        
        if (!hasFileExtension && !isApiRoute) {
          const indexRequest = new Request(new URL('/index.html', request.url), {
            method: request.method,
            headers: request.headers,
          });
          return assets.fetch(indexRequest);
        }
        
        // Return the 404 for other cases
        return response;
      }

      // For other methods, return 405 Method Not Allowed
      return new Response('Method Not Allowed', { status: 405 });
    } catch (error) {
      // Log error and return 500
      console.error('Worker error:', error);
      return new Response(`Worker error: ${error.message}`, { status: 500 });
    }
  },
};

