FROM node:22-bookworm-slim AS build

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
COPY hub/package.json hub/pnpm-lock.yaml hub/
COPY verso/package.json verso/pnpm-lock.yaml verso/
COPY fort/package.json fort/pnpm-lock.yaml fort/
COPY scripts ./scripts

RUN pnpm install --frozen-lockfile

COPY hub ./hub
COPY verso ./verso
COPY fort ./fort

RUN pnpm build

FROM nginx:1.27-alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
