FROM node:22-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* tsconfig.json ./

RUN pnpm install --frozen-lockfile

COPY src/lib ./src/lib
COPY bot ./bot

RUN mkdir -p /app/bot/data

ENV NODE_ENV=production

CMD ["pnpm", "bot"]
