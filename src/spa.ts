/**
 * This module auto-runs the SPA server in the root directory
 * @module
 */
import { serveStatic } from '../src/serve.ts'

// deno-lint-ignore require-await
Deno.serve(async (req: Request) => {
  return serveStatic(req)
})
