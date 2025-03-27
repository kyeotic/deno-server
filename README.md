# Deno Server

Server utilities for SPAs and Dual front+back-end Servers.


## SPAs

If you are deploying a compiled front-end to Deno Deploy you can use remote entrypoints. Deno std library has a handy [file_server](https://deno.land/std@0.190.0/http/file_server.ts) that can be used by Deno Deploy for Static Sites *very easily*

```
deployctl deploy --prod --project=$PROJECT_NAME https://deno.land/std@0.171.0/http/file_server.ts
```

This fails if you are using deep links for dynamic pages. There is no file backing `http://example.com/users/whoever`; the SPA is expected to handle rendering.

Deno Server provides a handler that falls back to the `index.html` whenever a 404 is hit for a path without a period in it (since that's probably for a file that doesn't exist, like a cache-busted one)

```
deployctl deploy --prod --project=$PROJECT_NAME jsr:@kyeotic/server/spa
```

## Servers

For servers that host their own API as well as a compiled front-end, Deno Server provides a `serveStatic` handler that functions exactly like the SPA handler above (falling back to `index.html` for 404s).



```ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { serveStatic, withCors, joinDir } from '@kyeotic/server'

import './periods/cron.ts'

const appRouter = router({ /* your routes */})


Deno.serve(handler)

async function handler(request: Request) {
  const url = new URL(request.url)
  // Only used for start-server-and-test package that
  // expects a 200 OK to start testing the server
  if (request.method === 'HEAD') {
    return new Response()
  }

  if (url.pathname.startsWith('/api')) {
    if (request.method === 'OPTIONS') {
      return withCors(request, new Response())
    }

    return withCors(request, await fetchRequestHandler({
      endpoint: '/api',
      req: request,
      router: appRouter,
      createContext: createAppContext,
    }))
  } else {
    return serveStatic(request, joinDir(import.meta.url, './dist'))
  }
}
```