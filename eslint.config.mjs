import next from 'eslint-config-next'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

// Flat config, added long after the code was written — 222 files predate it.
//
// `npm run lint` is `eslint . --max-warnings=0`, so a warning fails the build.
// That only holds up if every exception is written down: either a rule turned
// off here with the reason, or an `eslint-disable-next-line` at the exact line
// it applies to. A tolerated warning count rots within a month.
//
// Nothing stylistic. Prettier is deliberately absent — formatting arguments
// are not what this gate is for.
const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'backups/**',
      'public/**',
      'src/migrations/**', // hand-written, but the generated index is noisy
      'next-env.d.ts',
      '.claude/worktrees/**',
    ],
  },

  ...next,
  ...nextCoreWebVitals,
  ...nextTypescript,

  {
    rules: {
      // Off, not deferred-with-a-warning. tsconfig sets `strict: false`, so the
      // compiler already tolerates implicit any; lint shouting about the
      // explicit ones while the implicit ones pass is noise with no gate behind
      // it. Turning this on is gated on strict mode, not on willingness to
      // annotate. #40, #44 and #45 removed the `as any` casts that actually
      // mattered.
      '@typescript-eslint/no-explicit-any': 'off',

      // This rule is for the pages/ directory, which this project does not
      // have, and its advice contradicts CLAUDE.md: site links use `Link` from
      // @/i18n/navigation, never next/link. Both `<a>` elements it fires on
      // are plain `<a>` deliberately, and each already says so in a comment
      // above it. src/components/AdminLink.tsx points at /admin, which sits
      // outside the locale routes under the Payload root layout — the i18n
      // Link would prefix it and a client-side transition would hand the admin
      // a tree built by the public layout. src/app/not-found.tsx renders its
      // own <html> outside the locale tree. Following the rule would introduce
      // the bug, not remove one.
      '@next/next/no-html-link-for-pages': 'off',

      // Payload collection configs and Lexical node walkers legitimately
      // destructure fields they do not all use. Leading underscore opts out.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  {
    // Operational scripts run under tsx on a developer's machine, not in the
    // browser and not on Vercel. console is their entire user interface.
    files: ['scripts/**/*.{ts,mjs}', 'src/scripts/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
]

export default config
