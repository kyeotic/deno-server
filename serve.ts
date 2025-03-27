import { fromFileUrl, dirname, join } from '@std/path'
import { serveDir } from '@std/http/file-server'

/**
 * Create a file path by joining the first parameter to the remaining ones
 *
 * @example
 * const distDir = joinDir(import.meta.url, './dist')
 * // => /home/you/dev/project/dist
 */
export function joinDir(root: string, ...parts: string[]): string {
  return join(dirname(fromFileUrl(root)), ...parts)
}

/**
 * Handler that wrap `@std/http/file-server` `serveDir`
 * with a fallback to `index.html` in the case of a 404.
 *
 * Useful for serving static files for a compiled SPA that uses deep-linking
 */
export async function serveStatic(
  request: Request,
  { rootDir }: { rootDir?: string } = {}
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

/** Creates a CORS handler with sane defaults */
export function withCors(
  req: Request,
  res: Response,
  {
    origin,
    headers,
    methods,
  }: {
    /**
     * A specific origin to allowlist for CORS
     *
     * If this is omitted all origins will be allowed by reflecting the `req.origin`
     * */
    origin?: string

    /** `Access-Control-Allow-Headers`. If omitted a default list will be used */
    headers?: string

    /** `Access-Control-Allow-Methods`. If omitted a default list will be used */
    methods?: string
  } = {}
): Response {
  res.headers.set(
    'Access-Control-Allow-Origin',
    origin ?? req.headers.get('origin')!
  )
  res.headers.set('Access-Control-Allow-Credentials', 'true')
  res.headers.set(
    'Access-Control-Allow-Headers',
    headers ?? 'Authorization, origin, content-type, accept, vary'
  )
  res.headers.set(
    'Access-Control-Allow-Methods',
    methods ?? 'POST, OPTIONS, GET, PUT, DELETE'
  )
  return res
}
