/**
 * Whether scripts/publish-drafts.ts may reuse a media row for a file in
 * DRAFTS_DIR. Rows are found by file name, so a new image that happens to share
 * a name with an older, different upload would otherwise be swapped for the old
 * one without a word.
 *
 * What Payload stores depends on the format. Checked in payload 3.92's
 * uploads/generateFileData.js: with no `resizeOptions`, `formatOptions`,
 * `trimOptions` or `constructorOptions` on the collection's `upload` (Media
 * sets none; its `formatOptions` belong to the derived imageSizes), the
 * original goes through sharp only when `isAnimatedImage(mimeType)` is true,
 * and that is decided by MIME type alone: every GIF, TIFF and WebP, animated
 * or not, is re-encoded (`sharp(file).rotate().toBuffer()`, metadata
 * stripped). JPEG, PNG and AVIF are stored byte for byte.
 *
 * - Stored as is: the row's `filesize` is the uploaded file's size, so a
 *   different local size means a different file.
 * - Re-encoded: the size never matches (media 54–57, static WebPs, are about 4%
 *   smaller than the files they came from), so the pixel dimensions are
 *   compared instead. Equal width and height count as the same image.
 *
 * Adding any of those four options to Media's `upload` would make Payload
 * re-encode JPEG, PNG and AVIF too, and TRANSCODED would need to grow.
 */

/** MIME types whose original Payload re-encodes on upload, for the Media config above. */
export const TRANSCODED = ['image/gif', 'image/tiff', 'image/webp']

/** Postgres numeric columns can come back as strings. */
type Num = number | string | null | undefined

export type MediaRow = {
  id: number | string
  filesize?: Num
  width?: Num
  height?: Num
  mimeType?: string | null
}

/** The file in DRAFTS_DIR. Dimensions and type are null when they could not be read. */
export type LocalFile = {
  size: number
  width?: number | null
  height?: number | null
  mimeType?: string | null
}

type Dims = { width: number; height: number }

export type MediaDecision =
  | { kind: 'reuse'; id: number | string; note?: string }
  | { kind: 'conflict'; id: number | string; basis: 'size'; rowSize: number; localSize: number }
  | { kind: 'conflict'; id: number | string; basis: 'dimensions'; rowDims: Dims; localDims: Dims }
  | { kind: 'upload' }
  | { kind: 'missing' }

const num = (v: Num) => (v == null || v === '' ? null : Number(v))

/**
 * `row`: the media row with this file name, or null. `local`: the file in
 * DRAFTS_DIR, or null when it is not there. A row is reused as is when there is
 * nothing to compare it with: no local file, or the size or dimensions missing
 * on either side (the last two with a note saying so).
 */
export function decideMedia(row: MediaRow | null, local: LocalFile | null): MediaDecision {
  if (!row) return local ? { kind: 'upload' } : { kind: 'missing' }
  if (!local) return { kind: 'reuse', id: row.id }

  const mimeType = row.mimeType || local.mimeType
  if (mimeType && TRANSCODED.includes(mimeType)) {
    const rowW = num(row.width)
    const rowH = num(row.height)
    const { width: localW, height: localH } = local
    if (rowW == null || rowH == null || localW == null || localH == null) {
      return { kind: 'reuse', id: row.id, note: `${mimeType} is re-encoded on upload and the dimensions are unknown, so it was not compared` }
    }
    if (rowW !== localW || rowH !== localH) {
      return { kind: 'conflict', id: row.id, basis: 'dimensions', rowDims: { width: rowW, height: rowH }, localDims: { width: localW, height: localH } }
    }
    return { kind: 'reuse', id: row.id }
  }

  const rowSize = num(row.filesize)
  if (rowSize == null) return { kind: 'reuse', id: row.id, note: 'the media row has no file size, so it was not compared' }
  if (rowSize !== local.size) return { kind: 'conflict', id: row.id, basis: 'size', rowSize, localSize: local.size }
  return { kind: 'reuse', id: row.id }
}

const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`
const px = (d: Dims) => `${d.width}×${d.height}`

export function describeConflict(filename: string, d: Extract<MediaDecision, { kind: 'conflict' }>) {
  const detail = d.basis === 'size'
    ? `${kb(d.rowSize)} there, ${kb(d.localSize)} here`
    : `${px(d.rowDims)} there, ${px(d.localDims)} here`
  return `media ${d.id} has the same name as ${filename} but a different file (${detail}); rename the image`
}
