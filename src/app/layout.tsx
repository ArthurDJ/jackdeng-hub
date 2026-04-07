// Root layout — minimal shell for (payload) route group.
// All frontend pages use src/app/[locale]/layout.tsx instead.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
