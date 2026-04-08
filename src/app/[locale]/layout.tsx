import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Inter } from 'next/font/google'
import { routing } from '@/i18n/routing'
import { ThemeProvider } from '@/components/ThemeProvider'
import { CommandPalette } from '@/components/CommandPalette'
import '../globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  axes: ['opsz'],
})

export const metadata: Metadata = {
  title: {
    default: 'Jack Deng',
    template: '%s — Jack Deng',
  },
  description: 'Senior Database & Integration Administrator. NetSuite · Boomi · Supabase · Next.js.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://jackdeng.cc'),
}

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  // Validate locale
  if (!routing.locales.includes(locale as 'en' | 'zh')) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning className={inter.variable}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            {children}
            <CommandPalette />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
