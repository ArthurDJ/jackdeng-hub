/**
 * The Metadata Scrubber's rules: find what a JPEG or PNG carries besides the
 * picture — camera, time, GPS position, editing software, the prompt and
 * workflow an image generator wrote into it — and write a copy without it.
 * src/components/tools/MetaScrub.tsx only draws the report.
 *
 * Nothing is re-encoded: the copy keeps every byte of the image data, so
 * there is no quality loss and the pixels are identical. What it keeps on
 * purpose is what changes how the picture looks: the JFIF header, the ICC
 * colour profile, Adobe's colour-transform marker, and the EXIF orientation
 * (rewritten as a 34-byte EXIF block that holds nothing else), without which
 * a phone photo would come out sideways.
 */

export interface Gps { lat: number; lon: number }

export interface Exif {
  make?: string
  model?: string
  software?: string
  dateTime?: string
  dateTimeOriginal?: string
  orientation?: number
  gps?: Gps
}

export type Finding =
  | { kind: 'exif'; bytes: number; exif: Exif }
  | { kind: 'xmp'; bytes: number }
  | { kind: 'iptc'; bytes: number }
  | { kind: 'comment'; bytes: number; text: string }
  | { kind: 'text'; bytes: number; key: string; preview: string }
  | { kind: 'time'; bytes: number }
  | { kind: 'other'; bytes: number; name: string }
  | { kind: 'trailer'; bytes: number }

export interface Report {
  format: 'jpeg' | 'png'
  findings: Finding[]
  cleaned: Uint8Array
}

export class ScrubError extends Error {
  constructor(public code: 'unsupported' | 'corrupt') {
    super(code)
  }
}

const ascii = (b: Uint8Array, start = 0, end = b.length) => {
  let s = ''
  for (let i = start; i < end; i++) s += String.fromCharCode(b[i])
  return s
}
const startsWith = (b: Uint8Array, at: number, text: string) => ascii(b, at, at + text.length) === text

// ── EXIF (TIFF) ───────────────────────────────────────────────────────────

/** Read the tags worth showing from a TIFF block (EXIF without its "Exif\0\0"). */
export function readTiff(t: Uint8Array): Exif {
  if (t.length < 8) return {}
  const view = new DataView(t.buffer, t.byteOffset, t.byteLength)
  const le = t[0] === 0x49 // "II"
  const u16 = (o: number) => view.getUint16(o, le)
  const u32 = (o: number) => view.getUint32(o, le)
  const SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 }

  type Entry = { type: number; count: number; at: number }
  const readIfd = (offset: number): Map<number, Entry> => {
    const out = new Map<number, Entry>()
    if (offset <= 0 || offset + 2 > t.length) return out
    const n = u16(offset)
    for (let i = 0; i < n; i++) {
      const e = offset + 2 + i * 12
      if (e + 12 > t.length) break
      const type = u16(e + 2)
      const count = u32(e + 4)
      const size = (SIZE[type] ?? 1) * count
      const at = size <= 4 ? e + 8 : u32(e + 8)
      if (at + size <= t.length) out.set(u16(e), { type, count, at })
    }
    return out
  }
  const str = (e?: Entry) => {
    if (!e || e.type !== 2) return undefined
    const s = ascii(t, e.at, e.at + e.count).replace(/\0+$/, '').trim()
    return s || undefined
  }
  const num = (e?: Entry) => (!e ? undefined : e.type === 3 ? u16(e.at) : e.type === 4 ? u32(e.at) : undefined)
  const rationals = (e?: Entry) => {
    if (!e || e.type !== 5) return undefined
    return Array.from({ length: e.count }, (_, i) => u32(e.at + i * 8) / (u32(e.at + i * 8 + 4) || 1))
  }

  const ifd0 = readIfd(u32(4))
  const sub = readIfd(num(ifd0.get(0x8769)) ?? 0)
  const gpsIfd = readIfd(num(ifd0.get(0x8825)) ?? 0)

  const exif: Exif = {
    make: str(ifd0.get(0x010f)),
    model: str(ifd0.get(0x0110)),
    software: str(ifd0.get(0x0131)),
    dateTime: str(ifd0.get(0x0132)),
    dateTimeOriginal: str(sub.get(0x9003)),
    orientation: num(ifd0.get(0x0112)),
  }
  const lat = rationals(gpsIfd.get(2))
  const lon = rationals(gpsIfd.get(4))
  if (lat?.length === 3 && lon?.length === 3) {
    const deg = ([d, m, s]: number[]) => d + m / 60 + s / 3600
    const sign = (ref: string | undefined, neg: string) => (ref === neg ? -1 : 1)
    const g = {
      lat: sign(str(gpsIfd.get(1)), 'S') * deg(lat),
      lon: sign(str(gpsIfd.get(3)), 'W') * deg(lon),
    }
    // A GPS block of zeros is a camera that had no fix, not a place.
    if (g.lat !== 0 || g.lon !== 0) exif.gps = g
  }
  for (const k of Object.keys(exif) as (keyof Exif)[]) if (exif[k] === undefined) delete exif[k]
  return exif
}

/** A JPEG APP1 segment holding a TIFF block with one tag: the orientation. */
export function orientationSegment(orientation: number): Uint8Array {
  const body = [
    ...[0x45, 0x78, 0x69, 0x66, 0, 0], // "Exif\0\0"
    0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, // "MM", 42, IFD0 at 8
    0, 1, // one entry
    0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, orientation, 0, 0, // Orientation, SHORT, 1
    0, 0, 0, 0, // no next IFD
  ]
  const len = body.length + 2
  return new Uint8Array([0xff, 0xe1, len >> 8, len & 0xff, ...body])
}

// ── JPEG ──────────────────────────────────────────────────────────────────

function scrubJpeg(b: Uint8Array): Report {
  const findings: Finding[] = []
  const keep: Uint8Array[] = [b.subarray(0, 2)]
  let orientation: number | undefined
  let afterApp0 = 1 // where the orientation block goes: after APP0 if there is one
  let i = 2

  while (i < b.length) {
    if (b[i] !== 0xff) throw new ScrubError('corrupt')
    const marker = b[i + 1]
    if (marker === 0xff) { i++; continue } // fill byte
    if (marker === 0xda) {
      // Start of scan: from here on it is image data. Copy through the end
      // of image, and drop whatever a camera appended after it.
      let j = i + 2
      while (j < b.length - 1 && !(b[j] === 0xff && b[j + 1] === 0xd9)) j++
      const end = Math.min(j + 2, b.length)
      keep.push(b.subarray(i, end))
      if (b.length > end) findings.push({ kind: 'trailer', bytes: b.length - end })
      break
    }
    if (i + 4 > b.length) throw new ScrubError('corrupt')
    const len = (b[i + 2] << 8) | b[i + 3]
    const seg = b.subarray(i, i + 2 + len)
    const data = b.subarray(i + 4, i + 2 + len)
    if (seg.length < 4 || i + 2 + len > b.length) throw new ScrubError('corrupt')

    if (marker === 0xe1 && startsWith(data, 0, 'Exif\0')) {
      const exif = readTiff(data.subarray(6))
      orientation = exif.orientation
      findings.push({ kind: 'exif', bytes: seg.length, exif })
    } else if (marker === 0xe1 && startsWith(data, 0, 'http://ns.adobe.com/')) {
      findings.push({ kind: 'xmp', bytes: seg.length })
    } else if (marker === 0xed) {
      findings.push({ kind: 'iptc', bytes: seg.length })
    } else if (marker === 0xfe) {
      findings.push({ kind: 'comment', bytes: seg.length, text: ascii(data).slice(0, 120) })
    } else if (
      marker === 0xe0 ||
      (marker === 0xe2 && startsWith(data, 0, 'ICC_PROFILE')) ||
      (marker === 0xee && startsWith(data, 0, 'Adobe')) ||
      marker < 0xe0 || marker > 0xef
    ) {
      // Picture-defining: JFIF, colour profile, Adobe transform, tables, frame.
      keep.push(seg)
      if (marker === 0xe0) afterApp0 = keep.length
    } else {
      findings.push({ kind: 'other', bytes: seg.length, name: `APP${marker - 0xe0}` })
    }
    i += 2 + len
  }

  if (orientation && orientation !== 1) keep.splice(afterApp0, 0, orientationSegment(orientation))
  return { format: 'jpeg', findings, cleaned: concat(keep) }
}

// ── PNG ───────────────────────────────────────────────────────────────────

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

function scrubPng(b: Uint8Array): Report {
  const findings: Finding[] = []
  const keep: Uint8Array[] = [b.subarray(0, 8)]
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength)
  let i = 8

  while (i + 12 <= b.length) {
    const len = view.getUint32(i)
    const type = ascii(b, i + 4, i + 8)
    const end = i + 12 + len
    if (end > b.length) throw new ScrubError('corrupt')
    const chunk = b.subarray(i, end)
    const data = b.subarray(i + 8, i + 8 + len)

    if (type === 'tEXt' || type === 'iTXt' || type === 'zTXt') {
      const nul = data.indexOf(0)
      const key = ascii(data, 0, nul < 0 ? Math.min(len, 79) : nul)
      // Only tEXt is plain text all the way; the others may be compressed.
      const preview = type === 'tEXt' && nul >= 0 ? new TextDecoder().decode(data.subarray(nul + 1)).slice(0, 160) : ''
      findings.push({ kind: 'text', bytes: chunk.length, key, preview })
    } else if (type === 'eXIf') {
      findings.push({ kind: 'exif', bytes: chunk.length, exif: readTiff(data) })
    } else if (type === 'tIME') {
      findings.push({ kind: 'time', bytes: chunk.length })
    } else {
      keep.push(chunk)
    }
    i = end
    if (type === 'IEND') {
      if (b.length > end) findings.push({ kind: 'trailer', bytes: b.length - end })
      break
    }
  }
  return { format: 'png', findings, cleaned: concat(keep) }
}

// ── Entry point ───────────────────────────────────────────────────────────

export function scrub(b: Uint8Array): Report {
  if (b[0] === 0xff && b[1] === 0xd8) return scrubJpeg(b)
  if (PNG_SIG.every((v, k) => b[k] === v)) return scrubPng(b)
  throw new ScrubError('unsupported')
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let at = 0
  for (const p of parts) { out.set(p, at); at += p.length }
  return out
}
