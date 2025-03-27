import { serveDir } from '@std/http/file-server'

Deno.serve(async (req) => {
  const url = new URL(req.url)
  let isIndex = url.pathname === '/' || url.pathname === '/index.html'

  let res = await serveDir(req)

  if (res.status == 404) {
    const index = new URL(req.url)
    index.pathname = 'index.html'
    isIndex = true
    res = await serveDir(new Request(index, req))
  }

  if (isIndex) {
    res.headers.set(
      'cache-control',
      'max-age=0, no-cache, no-store, must-revalidate'
    )
    res.headers.set('pragma', 'no-cache')
    res.headers.set('expires', '0')
  }

  return res
})
