import { Navbar } from '@/components/Navbar'

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white dark:bg-zinc-950">{children}</div>
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 text-center text-xs text-zinc-400 dark:text-zinc-600">
        © {new Date().getFullYear()} Jack Deng
      </footer>
    </>
  )
}
