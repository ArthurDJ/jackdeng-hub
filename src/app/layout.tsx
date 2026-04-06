import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/ThemeProvider'
import { CommandPalette } from '@/components/CommandPalette'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Jack Deng',
    template: '%s — Jack Deng',
  },
  description: 'Software engineer. Building things at the intersection of AI, data, and systems.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://jackdeng.cc'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
            {children}
            <CommandPalette />
          </ThemeProvider>
      </body>
    </html>
  )
}
