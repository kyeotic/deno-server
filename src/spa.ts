/**
 * This module auto-runs the SPA server in the root directory
 * @module
 */
import { serveStatic } from '../src/serve.ts'

const rootDir = Deno.env.get('SPA_ROOT')

// deno-lint-ignore require-await
Deno.serve(async (req: Request) => {
  return serveStatic(req, { rootDir })
})
