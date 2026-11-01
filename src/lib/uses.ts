/**
 * What's on /uses: the software I actually work with, grouped. Names are
 * brands and stay as they are; why each one is here is in messages
 * (`uses.items.<id>`), and group titles under `uses.groups.<id>`.
 * uses.test.ts fails when an id has no words in either language.
 *
 * Only things in daily use go here — the list was taken from what is
 * installed on my machine and in my browser, not from what is popular.
 */

export interface UsesItem {
  /** Key under uses.items in both message files. */
  id: string
  name: string
  href: string
}

export interface UsesGroup {
  /** Key under uses.groups in both message files. */
  id: string
  items: UsesItem[]
}

export const USES: UsesGroup[] = [
  {
    id: 'code',
    items: [
      { id: 'vscode', name: 'VS Code', href: 'https://code.visualstudio.com' },
      { id: 'claudeCode', name: 'Claude Code', href: 'https://claude.com/claude-code' },
      { id: 'pycharm', name: 'PyCharm', href: 'https://www.jetbrains.com/pycharm/' },
      { id: 'ghCli', name: 'GitHub CLI', href: 'https://cli.github.com' },
      { id: 'anaconda', name: 'Anaconda', href: 'https://www.anaconda.com' },
      { id: 'node', name: 'Node.js', href: 'https://nodejs.org' },
    ],
  },
  {
    id: 'data',
    items: [
      { id: 'databricks', name: 'Databricks', href: 'https://www.databricks.com' },
      { id: 'dbt', name: 'dbt', href: 'https://www.getdbt.com' },
      { id: 'powerBi', name: 'Power BI', href: 'https://www.microsoft.com/power-platform/products/power-bi' },
    ],
  },
  {
    id: 'site',
    items: [
      { id: 'nextjs', name: 'Next.js', href: 'https://nextjs.org' },
      { id: 'payload', name: 'Payload CMS', href: 'https://payloadcms.com' },
      { id: 'supabase', name: 'Supabase', href: 'https://supabase.com' },
      { id: 'vercel', name: 'Vercel', href: 'https://vercel.com' },
      { id: 'tailwind', name: 'Tailwind CSS', href: 'https://tailwindcss.com' },
    ],
  },
  {
    id: 'ai',
    items: [
      { id: 'claude', name: 'Claude', href: 'https://claude.ai' },
      { id: 'comfyui', name: 'ComfyUI', href: 'https://www.comfy.org' },
      { id: 'grammarly', name: 'Grammarly', href: 'https://www.grammarly.com' },
    ],
  },
  {
    id: 'browser',
    items: [
      { id: 'videoSpeed', name: 'Video Speed Controller', href: 'https://github.com/igrigorik/videospeed' },
      { id: 'keepa', name: 'Keepa', href: 'https://keepa.com' },
      { id: 'remoteDesktop', name: 'Chrome Remote Desktop', href: 'https://remotedesktop.google.com' },
    ],
  },
  {
    id: 'windows',
    items: [
      { id: 'ttime', name: 'TTime', href: 'https://github.com/InkTimeRecord/TTime' },
      { id: 'potplayer', name: 'PotPlayer', href: 'https://potplayer.tv' },
      { id: 'huorong', name: '火绒 Huorong', href: 'https://www.huorong.cn' },
      { id: 'hwinfo', name: 'HWiNFO', href: 'https://www.hwinfo.com' },
      { id: 'cpuz', name: 'CPU-Z', href: 'https://www.cpuid.com/softwares/cpu-z.html' },
      { id: 'wallpaperEngine', name: 'Wallpaper Engine', href: 'https://www.wallpaperengine.io' },
    ],
  },
]

/** Playground tools that are utilities rather than toys; /uses lists them as things I built. */
export const BUILT_HERE = ['epoch-converter', 'cron-explainer', 'meta-scrub']
