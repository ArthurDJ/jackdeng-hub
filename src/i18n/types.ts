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

type Messages = typeof messages

declare global {
  // next-intl reads this interface to type all useTranslations() / getTranslations() calls.
  // It has to be `interface extends`, not `type IntlMessages = Messages` —
  // merging a declaration into the global scope only works for interfaces, so
  // the empty body is the point. (The disable was pinned to the line above,
  // where the rule never fired.)
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface IntlMessages extends Messages {}
}
