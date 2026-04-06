import { Navbar } from '@/components/Navbar'

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950">
      <Navbar />
      <div className="flex-1">{children}</div>
      <footer className="border-t border-zinc-100 dark:border-zinc-800 py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
          <span>© {new Date().getFullYear()} Jack Deng</span>
          <span>Built with Next.js + Payload CMS</span>
        </div>
      </footer>
    </div>
  )
}
