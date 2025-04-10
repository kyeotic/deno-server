import { isEqual, differenceWith } from 'lodash-es'

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

export function makeIndexer<
  Row,
  Ref,
  Prop extends Row[Prop] extends Array<infer I> ? keyof Row : never,
  Val extends Row[Prop] extends Array<infer I> ? I : never
>(
  prop: keyof Row,
  keyer: (item: Val) => Deno.KvKeyPart[],
  selector: (item: Row) => Ref,
  comparator: (a: Val, b: Val) => boolean = isEqual
): (
  txn: Deno.AtomicOperation,
  value: Row,
  existing: Row | null
) => Deno.AtomicOperation {
  return (txn: Deno.AtomicOperation, value: Row, existing: Row | null) =>
    syncIndex<Row, Prop, Val, Ref>(
      txn,
      value,
      existing,
      prop,
      keyer,
      comparator,
      selector
    )
}

function syncIndex<
  Row,
  Prop extends Row[Prop] extends Array<infer I> ? keyof Row : never,
  Val extends Row[Prop] extends Array<infer I> ? I : never,
  Ref
>(
  txn: Deno.AtomicOperation,
  value: Row,
  existing: Row | null,
  prop: keyof Row,
  keyer: (item: Val) => Deno.KvKeyPart[],
  comparator: (a: Val, b: Val) => boolean,
  selector: (item: Row) => Ref
): Deno.AtomicOperation {
  if (!Array.isArray(value[prop])) {
    throw new Error('index prop must be an array type')
  }

  const refs = (existing ? existing[prop] : []) as Val[]

  // create new
  differenceWith(value[prop], refs, comparator).forEach((e: Val) =>
    txn.set(keyer(e), selector(value))
  )

  // // delete old
  differenceWith(value[prop] ?? [], refs, comparator).forEach((e: Val) =>
    txn.delete(keyer(e))
  )

  return txn
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

export class BaseStore<Type, Key extends Deno.KvKeyPart> {
  constructor(
    protected readonly kv: Deno.Kv,
    protected readonly keyer: ReturnType<typeof makeSet>
  ) {}

  protected async get(id: Key): Promise<Type | null> {
    return (await this.kv.get<Type>(this.keyer(id))).value
  }

  protected async getAll(): Promise<Type[]> {
    return await listAllValues(this.kv, this.keyer())
  }
}
