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
  {
    slug: 'dev-day',
    icon: '⌨️',
    en: {
      name: 'Dev Day',
      description: 'A programmer simulator. From 9 to 6, decide what each hour goes to: an incident, a feature, a meeting, coffee or tech debt. The end of the day tells you how it went.',
    },
    zh: {
      name: '程序员的一天',
      description: '早上九点到下午六点，每小时决定干什么：修事故、赶需求、开会、喝咖啡，还是还技术债。下班时看看你是哪种结局。',
    },
  },
  {
    slug: 'epoch-converter',
    icon: '⏱️',
    en: {
      name: 'Epoch Converter',
      description: 'Paste a Unix timestamp in seconds, milliseconds, microseconds or nanoseconds, or a date, and read it in every unit and in UTC, Los Angeles, New York and Shanghai.',
    },
    zh: {
      name: '时间戳转换',
      description: '粘贴 Unix 时间戳（秒、毫秒、微秒、纳秒都行）或者一个日期，换算成各种单位，以及 UTC、洛杉矶、纽约、上海的当地时间。',
    },
  },
  {
    slug: 'cron-explainer',
    icon: '🗓️',
    en: {
      name: 'Cron Explainer',
      description: 'Type a cron expression and see what each field means and the next ten times it runs, in UTC or your own time zone.',
    },
    zh: {
      name: 'Cron 解读',
      description: '输入一条 cron 表达式，看每个字段是什么意思，以及接下来十次在什么时候跑。UTC 和本地时区都能看。',
    },
  },
  {
    slug: 'meta-scrub',
    icon: '🧽',
    en: {
      name: 'Metadata Scrubber',
      description: 'See what a JPEG or PNG carries besides the picture (camera, GPS, the prompt an image generator wrote into it) and download a copy without it. The file never leaves your browser.',
    },
    zh: {
      name: '图片元数据清除',
      description: '看看一张 JPEG 或 PNG 除了画面还带着什么（相机型号、GPS 位置、AI 出图时写进去的提示词），再下载一份去掉这些的副本。文件不会离开你的浏览器。',
    },
  },
]
