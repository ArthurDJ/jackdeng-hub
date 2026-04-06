# 基础镜像使用 Node.js 20 Alpine 版本（体积小巧）
FROM node:20-alpine AS base

# 1. 依赖安装阶段
FROM base AS deps
# 针对 Alpine 系统安装 libc6-compat (一些原生扩展可能需要)
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 复制 package.json 和 lock 文件
COPY package.json package-lock.json* ./
RUN npm ci

# 2. 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 禁用 Next.js 遥测
ENV NEXT_TELEMETRY_DISABLED=1

# 执行构建 (注意：如果构建时需要环境变量，可以在这里通过 ARG 传入，或者在 docker-compose 中传入)
RUN npm run build

# 3. 运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户以提升安全性
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 拷贝构建产物和必要文件
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# Payload CMS 在某些情况下可能需要读取源代码配置，为了稳妥起见，把源代码也复制过来（如果不采用 Next.js standalone 模式）
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/payload.config.ts ./

USER nextjs

EXPOSE 3000

ENV PORT=3000
# Node 监听全部网卡
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]