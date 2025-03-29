import { ulid as stdUlid } from '@std/ulid'

export function ulid(): string
export function ulid(date: string): string
export function ulid(date: Date): string
export function ulid(date?: string | Date): string {
  if (!date) return stdUlid()

  const val = (
    typeof (date as Date)?.getTime === 'function'
      ? (date as Date)
      : new Date(date)
  ).getTime()

  if (Number.isNaN(val)) {
    throw new Error('ulid requires a valid Date')
  }

  return stdUlid(val)
}
