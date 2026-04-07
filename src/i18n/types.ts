/**
 * Augments next-intl's IntlMessages type with our message structure.
 * This gives compile-time type checking for all t() calls —
 * a typo like t('nav.bolg') will fail at build time, not runtime.
 *
 * HOW TO USE:
 * Import this file is NOT needed — it auto-augments via TypeScript's
 * global declaration merging. Just ensure tsconfig includes src/.
 *
 * RULE: en.json is the source of truth.
 * All keys in zh.json must mirror en.json exactly.
 */
import type messages from './messages/en.json'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type Messages = typeof messages

declare global {
  // next-intl reads this interface to type all useTranslations() / getTranslations() calls
  interface IntlMessages extends Messages {}
}
