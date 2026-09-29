/**
 * A cookie that only says "this browser is signed in to /admin", so the
 * footer can show an admin link to the editor and nobody else.
 *
 * Payload's own token cookie is HttpOnly, so page scripts cannot see it, and
 * reading it on the server would make every cached page render per request.
 * This one is readable by design and carries nothing: setting it by hand
 * shows a link to /admin, which still asks for a password. The Users
 * collection sets it on login and token refresh and clears it on logout
 * (src/collections/Users.ts).
 */
export const EDITOR_HINT_COOKIE = 'jd-editor'

/** Lives as long as the session it stands for. */
export function editorHintCookie(maxAgeSeconds: number): string {
  const maxAge = Math.max(0, Math.floor(maxAgeSeconds))
  return `${EDITOR_HINT_COOKIE}=1; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`
}

export function clearEditorHintCookie(): string {
  return editorHintCookie(0).replace(`${EDITOR_HINT_COOKIE}=1`, `${EDITOR_HINT_COOKIE}=`)
}

/** Whether a `document.cookie` string carries the hint. */
export function hasEditorHint(cookie: string): boolean {
  return cookie.split(';').some((part) => part.trim() === `${EDITOR_HINT_COOKIE}=1`)
}

/** Queue a Set-Cookie on the response Payload is about to send. */
export function appendSetCookie(req: { responseHeaders?: Headers }, value: string): void {
  req.responseHeaders ??= new Headers()
  req.responseHeaders.append('Set-Cookie', value)
}
