import { describe, expect, it } from 'vitest'
import { crc32, orientationSegment, readTiff, scrub, ScrubError, type Finding } from './metaScrub'

const bytes = (s: string) => Array.from(s, (c) => c.charCodeAt(0))
const be16 = (n: number) => [n >> 8, n & 0xff]
const be32 = (n: number) => [n >>> 24, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]

/**
 * A big-endian TIFF block: IFD0 with Make, Orientation and a GPS pointer, and
 * a GPS IFD at 34°03'36"N 118°14'24"W (Los Angeles).
 */
function tiff(orientation = 6): number[] {
  const make = bytes('Canon\0')
  // Layout: header 8 | IFD0 (2 + 3*12 + 4 = 42) at 8 | GPS IFD (2 + 4*12 + 4 = 54) at 50
  //         | make at 104 | lat rationals at 110 | lon rationals at 134
  const gpsAt = 50, makeAt = 104, latAt = 110, lonAt = 134
  const entry = (tag: number, type: number, count: number, value: number[]) => [...be16(tag), ...be16(type), ...be32(count), ...value]
  const ifd0 = [
    ...be16(3),
    ...entry(0x010f, 2, make.length, be32(makeAt)),
    ...entry(0x0112, 3, 1, [...be16(orientation), 0, 0]),
    ...entry(0x8825, 4, 1, be32(gpsAt)),
    ...be32(0),
  ]
  const gps = [
    ...be16(4),
    ...entry(1, 2, 2, [...bytes('N\0'), 0, 0]),
    ...entry(2, 5, 3, be32(latAt)),
    ...entry(3, 2, 2, [...bytes('W\0'), 0, 0]),
    ...entry(4, 5, 3, be32(lonAt)),
    ...be32(0),
  ]
  const rat = (a: number, b = 1) => [...be32(a), ...be32(b)]
  return [
    ...bytes('MM'), 0, 42, ...be32(8),
    ...ifd0, ...gps, ...make,
    ...rat(34), ...rat(3), ...rat(36),
    ...rat(118), ...rat(14), ...rat(24),
  ]
}

const segment = (marker: number, body: number[]) => [0xff, marker, ...be16(body.length + 2), ...body]

function jpeg({ orientation = 6, trailer = [] as number[] } = {}) {
  const app0 = segment(0xe0, [...bytes('JFIF\0'), 1, 1, 0, 0, 1, 0, 1, 0, 0])
  const exif = segment(0xe1, [...bytes('Exif\0\0'), ...tiff(orientation)])
  const xmp = segment(0xe1, bytes('http://ns.adobe.com/xap/1.0/\0<x:xmpmeta/>'))
  const icc = segment(0xe2, bytes('ICC_PROFILE\0\x01\x01profile'))
  const com = segment(0xfe, bytes('made with love'))
  const dqt = segment(0xdb, [0, ...new Array(64).fill(1)])
  const sos = [...segment(0xda, [1, 1, 0, 0, 63, 0]), 0x12, 0xff, 0x00, 0x34, 0xff, 0xd9]
  const all = [0xff, 0xd8, ...app0, ...exif, ...xmp, ...icc, ...com, ...dqt, ...sos, ...trailer]
  return { all: new Uint8Array(all), app0, icc, dqt, sos }
}

const kinds = (f: Finding[]) => f.map((x) => x.kind)

describe('readTiff', () => {
  it('reads the camera, orientation and GPS position', () => {
    const exif = readTiff(new Uint8Array(tiff()))
    expect(exif.make).toBe('Canon')
    expect(exif.orientation).toBe(6)
    expect(exif.gps?.lat).toBeCloseTo(34.06, 2)
    expect(exif.gps?.lon).toBeCloseTo(-118.24, 2)
  })

  it('returns nothing for a truncated block instead of throwing', () => {
    expect(readTiff(new Uint8Array(tiff().slice(0, 30)))).toEqual({})
  })
})

describe('scrub (JPEG)', () => {
  it('reports EXIF, XMP, the comment and a trailer', () => {
    const { all } = jpeg({ trailer: [1, 2, 3, 4] })
    const r = scrub(all)
    expect(r.format).toBe('jpeg')
    expect(kinds(r.findings)).toEqual(['exif', 'xmp', 'comment', 'trailer'])
    expect(r.findings.at(-1)).toEqual({ kind: 'trailer', bytes: 4 })
  })

  it('keeps the picture byte for byte and puts the orientation back alone', () => {
    const { all, app0, icc, dqt, sos } = jpeg({ trailer: [9, 9] })
    const expected = [0xff, 0xd8, ...app0, ...orientationSegment(6), ...icc, ...dqt, ...sos]
    expect(Array.from(scrub(all).cleaned)).toEqual(expected)
  })

  it('leaves the orientation out when it is the default', () => {
    const { all, app0, icc, dqt, sos } = jpeg({ orientation: 1 })
    expect(Array.from(scrub(all).cleaned)).toEqual([0xff, 0xd8, ...app0, ...icc, ...dqt, ...sos])
  })

  it('writes an orientation block that reads back', () => {
    const seg = orientationSegment(8)
    expect(readTiff(seg.subarray(10))).toEqual({ orientation: 8 })
  })

  it('finds nothing in a file it already cleaned', () => {
    const once = scrub(jpeg().all).cleaned
    const twice = scrub(once)
    // The orientation block it wrote reads as EXIF with only that tag.
    expect(twice.findings).toEqual([{ kind: 'exif', bytes: 36, exif: { orientation: 6 } }])
    expect(Array.from(twice.cleaned)).toEqual(Array.from(once))
  })
})

describe('scrub (JPEG headers)', () => {
  const sos = [...segment(0xda, [1, 1, 0, 0, 63, 0]), 0x12, 0x34, 0xff, 0xd9]
  const jfif = (thumb: number[]) => segment(0xe0, [...bytes('JFIF\0'), 1, 1, 0, 0, 1, 0, 1, thumb.length ? 1 : 0, thumb.length ? 1 : 0, ...thumb])

  it('keeps the JFIF header and drops its thumbnail', () => {
    const r = scrub(new Uint8Array([0xff, 0xd8, ...jfif([255, 0, 0]), ...sos]))
    expect(r.findings).toEqual([{ kind: 'thumbnail', bytes: 3 }])
    expect(Array.from(r.cleaned)).toEqual([0xff, 0xd8, ...jfif([]), ...sos])
  })

  it('drops a JFXX thumbnail segment and names it', () => {
    const jfxx = segment(0xe0, [...bytes('JFXX\0'), 0x10, 1, 2, 3])
    const r = scrub(new Uint8Array([0xff, 0xd8, ...jfif([]), ...jfxx, ...sos]))
    expect(r.findings).toEqual([{ kind: 'other', bytes: jfxx.length, name: 'APP0 JFXX' }])
    expect(Array.from(r.cleaned)).toEqual([0xff, 0xd8, ...jfif([]), ...sos])
  })

  it('steps over markers that have no length', () => {
    const r = scrub(new Uint8Array([0xff, 0xd8, 0xff, 0x01, 0xff, 0xd0, ...jfif([]), ...sos]))
    expect(r.findings).toEqual([])
    expect(Array.from(r.cleaned)).toEqual([0xff, 0xd8, 0xff, 0x01, 0xff, 0xd0, ...jfif([]), ...sos])
  })
})

describe('crc32', () => {
  it('matches the PNG reference value', () => {
    expect(crc32(bytes('IEND'))).toBe(0xae426082)
  })
})

describe('scrub (PNG)', () => {
  const crc = [0, 0, 0, 0] // not checked by the scrubber; it copies chunks whole
  const chunk = (type: string, data: number[]) => [...be32(data.length), ...bytes(type), ...data, ...crc]
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  const ihdr = chunk('IHDR', new Array(13).fill(0))
  const idat = chunk('IDAT', [1, 2, 3])
  const iend = chunk('IEND', [])

  it('drops text, time and EXIF chunks and keeps the image', () => {
    const png = new Uint8Array([
      ...sig, ...ihdr,
      ...chunk('tEXt', bytes('prompt\0{"1":{"class_type":"KSampler"}}')),
      ...chunk('tIME', [7, 234, 10, 31, 9, 0, 0]),
      ...chunk('eXIf', tiff(1)),
      ...idat, ...iend,
    ])
    const r = scrub(png)
    expect(kinds(r.findings)).toEqual(['text', 'time', 'exif'])
    expect(r.findings[0]).toMatchObject({ key: 'prompt', preview: '{"1":{"class_type":"KSampler"}}' })
    expect(Array.from(r.cleaned)).toEqual([...sig, ...ihdr, ...idat, ...iend])
  })

  it('writes the orientation back as a valid eXIf chunk', () => {
    const r = scrub(new Uint8Array([...sig, ...ihdr, ...chunk('eXIf', tiff(6)), ...idat, ...iend]))
    const out = r.cleaned
    const at = 8 + ihdr.length
    const len = (out[at] << 24) | (out[at + 1] << 16) | (out[at + 2] << 8) | out[at + 3]
    expect(String.fromCharCode(...out.subarray(at + 4, at + 8))).toBe('eXIf')
    expect(readTiff(out.subarray(at + 8, at + 8 + len))).toEqual({ orientation: 6 })
    const stored = new DataView(out.buffer, out.byteOffset).getUint32(at + 8 + len)
    expect(stored).toBe(crc32(out.subarray(at + 4, at + 8 + len)))
  })

  it('keeps only chunks it knows to be part of the picture', () => {
    const png = new Uint8Array([
      ...sig, ...ihdr,
      ...chunk('acTL', [0, 0, 0, 1, 0, 0, 0, 0]), // APNG: kept
      ...chunk('iCCP', [1, 2]), // colour profile: kept
      ...chunk('caBX', [9, 9, 9]), // C2PA manifest: dropped
      ...chunk('vpAg', [1]), // unknown ancillary: dropped
      ...chunk('ABCD', [1]), // unknown critical: kept, a decoder needs it
      ...idat, ...iend,
    ])
    const r = scrub(png)
    expect(r.findings).toEqual([
      { kind: 'other', bytes: 15, name: 'caBX' },
      { kind: 'other', bytes: 13, name: 'vpAg' },
    ])
    expect(Array.from(r.cleaned)).toEqual([
      ...sig, ...ihdr, ...chunk('acTL', [0, 0, 0, 1, 0, 0, 0, 0]), ...chunk('iCCP', [1, 2]), ...chunk('ABCD', [1]), ...idat, ...iend,
    ])
  })
})

describe('scrub (other)', () => {
  it('rejects formats it does not know and broken files', () => {
    const code = (b: number[]) => { try { scrub(new Uint8Array(b)); return 'ok' } catch (e) { return (e as ScrubError).code } }
    expect(code(bytes('GIF89a'))).toBe('unsupported')
    expect(code([0xff, 0xd8, 0xff, 0xe1, 0x10, 0x00, 1, 2])).toBe('corrupt')
  })
})
