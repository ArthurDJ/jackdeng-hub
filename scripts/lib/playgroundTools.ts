/**
 * The Playground's built-in tools as records: slug, icon, and the name and
 * description in both locales. Each slug has a component registered in
 * src/components/tools/registry.tsx.
 *
 * scripts/seed.ts creates all of them in CI's throwaway database, so the build
 * prerenders every tool page. scripts/add-playground-tools.ts creates the
 * ones production is missing.
 */
export interface PlaygroundTool {
  slug: string
  icon: string
  en: { name: string; description: string }
  zh: { name: string; description: string }
}

export const PLAYGROUND_TOOLS: PlaygroundTool[] = [
  {
    slug: 'falling-sand',
    icon: '⏳',
    en: { name: 'Falling Sand', description: 'A cellular automaton that runs in the browser.' },
    zh: { name: '落沙', description: '在浏览器里运行的元胞自动机。' },
  },
  {
    slug: 'dbt-terminal',
    icon: '🖥️',
    en: {
      name: 'dbt Terminal',
      description: 'A CRT screen replaying dbt build on jaffle_shop, the dbt Labs demo project. Type commands, or break a test and watch what gets skipped.',
    },
    zh: {
      name: 'dbt 终端',
      description: '一块老式 CRT 屏幕，重放 dbt Labs 示例项目 jaffle_shop 的 dbt build。可以自己敲命令，也可以弄挂一个测试，看看哪些会被跳过。',
    },
  },
  {
    slug: 'text-vortex',
    icon: '🌀',
    en: {
      name: 'Text Vortex',
      description: 'Rings of text turning on a canvas. Scatter the letters with the pointer, or hold to pull them in.',
    },
    zh: { name: '文字漩涡', description: '一圈圈文字在画布上转。鼠标划过会把字冲散，按住就把字吸向中心。' },
  },
  {
    slug: 'blueprint-type',
    icon: '📐',
    en: { name: 'Blueprint Type', description: 'A wordmark on an 8px grid. Drag the letters and read off their coordinates.' },
    zh: { name: '蓝图字标', description: '8px 网格上的一行字，字母可以拖动，旁边标着坐标。' },
  },
  {
    slug: 'falling-skills',
    icon: '🧱',
    en: {
      name: 'Falling Skills',
      description: 'The skills from the About page, dropped into a box as physics bodies. Pick them up and throw them.',
    },
    zh: { name: '技能掉落', description: 'About 页上的技能做成有重量的标签，掉进盒子里，可以抓起来扔。' },
  },
]
