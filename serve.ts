import { fromFileUrl, dirname, join } from '@std/path'
import { serveDir } from '@std/http/file-server'

export function joinDir(root: string, ...parts: string[]): string {
  return join(dirname(fromFileUrl(root)), ...parts)
}

export async function serveStatic(
  request: Request,
  { rootDir }: { rootDir?: string }
): Promise<Response> {
  const url = new URL(request.url)
  let isIndex = url.pathname === '/' || url.pathname === '/index.html'

  let res = await serveDir(request, { fsRoot: rootDir })

  // if pathname has a dot it could be an old cache-busted file
  // don't redirect to index for these
  if (res.status == 404 && !url.pathname.includes('.')) {
    const index = new URL(request.url)
    index.pathname = 'index.html'
    isIndex = true
    res = await serveDir(new Request(index, request), { fsRoot: rootDir })
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
}

export function withCors(req: Request, res: Response): Response {
  res.headers.set('Access-Control-Allow-Origin', req.headers.get('origin')!)
  res.headers.set('Access-Control-Allow-Credentials', 'true')
  res.headers.set(
    'Access-Control-Allow-Headers',
    'Authorization, origin, content-type, accept, vary'
  )
  res.headers.set(
    'Access-Control-Allow-Methods',
    'POST, OPTIONS, GET, PUT, DELETE'
  )
  return res
}
