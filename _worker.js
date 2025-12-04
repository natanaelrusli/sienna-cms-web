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
        // Since _routes.json excludes static files, this worker only receives SPA routes
        // First, try to fetch the requested resource (in case it's a real file)
        const response = await assets.fetch(request);
        
        // If the file exists, return it
        if (response.status < 400) {
          return response;
        }
        
        // For 404s, check if this looks like an SPA route (not /api)
        const isApiRoute = url.pathname.startsWith('/api');
        
        if (!isApiRoute) {
          // Serve index.html for all SPA routes
          // This allows React Router to handle client-side routing
          const indexRequest = new Request(new URL('/index.html', request.url), request);
          return assets.fetch(indexRequest);
        }
        
        // Return 404 for API routes
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
