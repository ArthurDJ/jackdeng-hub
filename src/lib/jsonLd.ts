/**
 * Serialize structured data for a <script type="application/ld+json">.
 * JSON.stringify leaves `<` alone, so a value containing "</script>" would
 * close the tag early and the rest would be parsed as HTML. < is the
 * same character to a JSON parser and inert to the HTML one.
 */
export function toJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
