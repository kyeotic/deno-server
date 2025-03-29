const LAZY_INIT: unique symbol = Symbol('LAZY_INIT')

export function lazy<T>(fn: () => T): () => T
export function lazy<T>(fn: () => Promise<T>): () => Promise<T>
export function lazy<T>(fn: () => Promise<T> | T) {
  let result: T | typeof LAZY_INIT = LAZY_INIT
  return () => {
    if (result !== LAZY_INIT) return result

    const r = fn()
    if (typeof (r as Promise<T>).then === 'function') {
      return (r as Promise<T>).then((r) => {
        return (result = r)
      })
    }

    return (result = r as T)
  }
}
