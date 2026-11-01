/**
 * Whether scripts/publish-drafts.ts may reuse a media row for a file in
 * DRAFTS_DIR. Rows are found by file name, so a new image that happens to share
 * a name with an older, different upload would otherwise be swapped for the old
 * one without a word. The original is stored unchanged (Media sets no resize,
 * format or trim options), so the row's `filesize` is the uploaded file's size
 * and a different local size means a different file. Animated GIF and WebP are
 * the exception: Payload re-encodes those, so they always look different and
 * need a fresh name to be updated anyway.
 */

export type MediaRow = { id: number | string; filesize?: number | null }

export type MediaDecision =
  | { kind: 'reuse'; id: number | string }
  | { kind: 'conflict'; id: number | string; rowSize: number; localSize: number }
  | { kind: 'upload' }
  | { kind: 'missing' }

/**
 * `row`: the media row with this file name, or null. `localSize`: the size of
 * the file in DRAFTS_DIR, or null when it is not there. A row is reused as is
 * when there is no local file to compare it with.
 */
export function decideMedia(row: MediaRow | null, localSize: number | null): MediaDecision {
  if (row) {
    const rowSize = row.filesize == null ? null : Number(row.filesize)
    if (localSize != null && rowSize != null && rowSize !== localSize) {
      return { kind: 'conflict', id: row.id, rowSize, localSize }
    }
    return { kind: 'reuse', id: row.id }
  }
  return localSize == null ? { kind: 'missing' } : { kind: 'upload' }
}

const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`

export function describeConflict(filename: string, d: Extract<MediaDecision, { kind: 'conflict' }>) {
  return `media ${d.id} has the same name as ${filename} but a different file `
    + `(${kb(d.rowSize)} there, ${kb(d.localSize)} here); rename the image`
}
