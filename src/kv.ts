export function makeSet(
  name: Deno.KvKeyPart
): (...parts: Deno.KvKeyPart[]) => Deno.KvKeyPart[] {
  return (...parts: Deno.KvKeyPart[]) => [name, ...parts]
}

export async function listAllValues<T>(
  kv: Deno.Kv,
  prefix: Deno.KvKeyPart[],
  { reverse = false }: { reverse?: boolean } = {}
): Promise<T[]> {
  const entries = await Array.fromAsync(kv.list({ prefix }, { reverse }))
  return entries.map((e) => e.value as T)
}

export async function create<T>(
  kv: Deno.Kv,
  key: Deno.KvKeyPart[],
  item: T
): Promise<T> {
  const existing = await kv.get(key)

  if (existing?.versionstamp) {
    throw new Error('Item already exists')
  }

  await kv.set(key, item)

  return item
}

export async function update<T>(
  kv: Deno.Kv,
  key: Deno.KvKeyPart[],
  item: T
): Promise<T> {
  const existing = await kv.get(key)

  if (!existing) {
    throw new Error('Subscription not found')
  }

  await kv.set(key, item)

  return item
}

export async function put<T>(
  kv: Deno.Kv,
  key: Deno.KvKeyPart[],
  item: T
): Promise<T> {
  await kv.set(key, item)

  return item
}

export async function upsert<T>(
  kv: Deno.Kv,
  key: Deno.KvKeyPart[],
  merge: (existing: T | null) => T
): Promise<T> {
  const existing = await kv.get(key)
  const item = merge((existing?.value as T) ?? null)

  await kv.atomic().check(existing).set(key, item).commit()
  return item
}

/**
 * Delete all records from the Deno.kv store
 *
 * DANGER: this will DELETE EVERYTHING
 *
 * Use options.prefix to delete only the prefixed items
 */
export async function deleteEntireDb(
  kv: Deno.Kv,
  {
    debug = false,
    prefix = [],
  }: { debug?: boolean; prefix?: Deno.KvKeyPart[] } = {}
): Promise<void> {
  const keys = kv.list({ prefix })
  let count = 0
  if (debug) console.log('starting delete')
  for await (const entry of keys) {
    if (debug) console.log(`deleting ${entry.key}`)
    await kv.delete(entry.key)
    count++
  }
  if (debug) console.log(`${count} records deleted`)
}
