import { serveStatic } from './serve.ts'

// deno-lint-ignore require-await
Deno.serve(async (req: Request) => {
  return serveStatic(req)
})
