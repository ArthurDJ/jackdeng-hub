import type { CollectionConfig } from 'payload'

export const ToolRuns: CollectionConfig = {
  slug: 'tool-runs',
  labels: {
    singular: { en: 'Tool Run', zh: '运行记录' },
    plural: { en: 'Tool Runs', zh: '运行记录' },
  },
  admin: {
    useAsTitle: 'runAt',
    defaultColumns: ['tool', 'status', 'summary', 'runAt'],
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => true, // Allow API callback (authenticated via secret)
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'tool',
      type: 'relationship',
      relationTo: 'tools',
      label: { en: 'Tool', zh: '工具' },
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      label: { en: 'Status', zh: '状态' },
      required: true,
      defaultValue: 'running',
      options: [
        { label: { en: 'Running',  zh: '运行中' }, value: 'running'  },
        { label: { en: 'Found',    zh: '找到名额' }, value: 'found'    },
        { label: { en: 'Booked',   zh: '已改签' },  value: 'booked'   },
        { label: { en: 'Heartbeat',zh: '心跳' },   value: 'heartbeat'},
        { label: { en: 'Error',    zh: '错误' },    value: 'error'    },
        { label: { en: 'Exited',   zh: '已退出' },  value: 'exited'   },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'summary',
      type: 'text',
      label: { en: 'Summary', zh: '摘要' },
    },
    {
      name: 'detail',
      type: 'textarea',
      label: { en: 'Detail', zh: '详情' },
    },
    {
      name: 'metadata',
      type: 'json',
      label: { en: 'Metadata', zh: '元数据' },
      admin: {
        description: {
          en: 'Raw payload from the callback (dates found, current appointment, etc.)',
          zh: '来自回调的原始数据（找到的日期、当前预约等）',
        },
      },
    },
    {
      name: 'runAt',
      type: 'date',
      label: { en: 'Run At', zh: '运行时间' },
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
  ],
}
