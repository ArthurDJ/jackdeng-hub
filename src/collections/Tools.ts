import type { CollectionConfig } from 'payload'

export const Tools: CollectionConfig = {
  slug: 'tools',
  labels: {
    singular: { en: 'Tool', zh: '工具' },
    plural: { en: 'Tools', zh: '工具' },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'toolType', 'status', 'accessControl'],
  },
  access: {
    read: ({ req }) => {
      if (req.user) return true
      return {
        and: [
          { status: { equals: 'online' } },
          { accessControl: { equals: 'public' } },
        ],
      }
    },
  },
  fields: [
    // ── Identity ──────────────────────────────────────────────────
    {
      name: 'name',
      type: 'text',
      label: { en: 'Name', zh: '名称' },
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: { en: 'Slug', zh: '别名' },
      required: true,
      unique: true,
      admin: { position: 'sidebar' },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.name) {
              return (data.name as string)
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'icon',
      type: 'text',
      label: { en: 'Icon (emoji)', zh: '图标（emoji）' },
      admin: {
        position: 'sidebar',
        description: { en: 'e.g. 🛠️ 🔍 📊', zh: '例如 🛠️ 🔍 📊' },
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: { en: 'Description', zh: '描述' },
    },

    // ── Type & Access ─────────────────────────────────────────────
    {
      name: 'toolType',
      type: 'select',
      label: { en: 'Tool Type', zh: '工具类型' },
      required: true,
      defaultValue: 'interactive',
      options: [
        { label: { en: 'Interactive (public embed)', zh: '交互工具（公开嵌入）' }, value: 'interactive' },
        { label: { en: 'Automation (private backend)', zh: '自动化（私有后台）' }, value: 'automation' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'accessControl',
      type: 'select',
      label: { en: 'Access', zh: '访问权限' },
      defaultValue: 'public',
      options: [
        { label: { en: 'Public', zh: '公开' }, value: 'public' },
        { label: { en: 'Private', zh: '私有' }, value: 'private' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      label: { en: 'Status', zh: '状态' },
      defaultValue: 'online',
      options: [
        { label: { en: 'Online',      zh: '在线' },  value: 'online'      },
        { label: { en: 'Offline',     zh: '离线' },  value: 'offline'     },
        { label: { en: 'Maintenance', zh: '维护中' }, value: 'maintenance' },
      ],
      admin: { position: 'sidebar' },
    },

    // ── Interactive tool fields ───────────────────────────────────
    {
      name: 'embedUrl',
      type: 'text',
      label: { en: 'Embed URL', zh: '嵌入地址' },
      admin: {
        condition: (data) => data?.toolType === 'interactive',
        description: {
          en: 'External URL of the standalone tool (e.g. https://tool.jackdeng.cc)',
          zh: '独立工具的外部地址，留空则使用内置页面',
        },
      },
    },
    {
      name: 'embedType',
      type: 'select',
      label: { en: 'Embed Type', zh: '嵌入方式' },
      defaultValue: 'iframe',
      options: [
        { label: 'iframe',        value: 'iframe'    },
        { label: 'Script / Web Component', value: 'script' },
        { label: { en: 'Built-in page', zh: '内置页面' }, value: 'builtin' },
      ],
      admin: {
        condition: (data) => data?.toolType === 'interactive',
        position: 'sidebar',
      },
    },

    // ── Automation tool fields ────────────────────────────────────
    {
      name: 'cronSchedule',
      type: 'text',
      label: { en: 'Cron Schedule', zh: 'Cron 表达式' },
      admin: {
        condition: (data) => data?.toolType === 'automation',
        description: { en: 'e.g. 0 */6 * * * (every 6h)', zh: '例如 0 */6 * * *（每6小时）' },
        position: 'sidebar',
      },
    },
    {
      name: 'config',
      type: 'json',
      label: { en: 'Config', zh: '配置参数' },
      admin: {
        condition: (data) => data?.toolType === 'automation',
        description: {
          en: 'Tool-specific configuration (stored as JSON, visible only to admins)',
          zh: '工具专属配置，以 JSON 存储，仅管理员可见',
        },
      },
    },
    {
      name: 'lastRunAt',
      type: 'date',
      label: { en: 'Last Run At', zh: '最后运行时间' },
      admin: {
        condition: (data) => data?.toolType === 'automation',
        readOnly: true,
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'lastRunStatus',
      type: 'select',
      label: { en: 'Last Run Status', zh: '最后运行状态' },
      options: [
        { label: { en: 'Running',   zh: '运行中' }, value: 'running'   },
        { label: { en: 'Found',     zh: '找到名额' }, value: 'found'     },
        { label: { en: 'Booked',    zh: '已改签' },  value: 'booked'    },
        { label: { en: 'Heartbeat', zh: '心跳' },   value: 'heartbeat' },
        { label: { en: 'Error',     zh: '错误' },    value: 'error'     },
        { label: { en: 'Exited',    zh: '已退出' },  value: 'exited'    },
      ],
      admin: {
        condition: (data) => data?.toolType === 'automation',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'notifyWebhook',
      type: 'text',
      label: { en: 'Notify Webhook', zh: '通知 Webhook' },
      admin: {
        condition: (data) => data?.toolType === 'automation',
        description: {
          en: 'POST to this URL when a notable event occurs (e.g. slot found)',
          zh: '发现目标事件时推送到此地址（如微信机器人、Telegram）',
        },
      },
    },
  ],
}
