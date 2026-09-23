// Payload types a relationship as `number | Doc`: the id when the query ran at
// depth 0, the document when it was populated. Pages used to cast the whole
// result to `any` to read `.url` or `.name` off it, which also hid the case
// where it really was still an id.

/** The populated document, or null if the field is empty or only an id. */
export function populated<T extends object>(value: number | T | null | undefined): T | null {
  return value !== null && typeof value === 'object' ? value : null
}

/** The populated documents of a has-many relationship, dropping bare ids. */
export function populatedList<T extends object>(values: (number | T)[] | null | undefined): T[] {
  return Array.isArray(values) ? values.filter((v): v is T => v !== null && typeof v === 'object') : []
}
