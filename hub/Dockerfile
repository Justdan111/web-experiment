# Build context is the REPO ROOT:
#   docker build -f hub/Dockerfile -t hub .
FROM node:22-alpine AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

COPY hub/package.json hub/pnpm-lock.yaml hub/pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY hub/ ./
RUN pnpm build

FROM nginx:alpine
COPY --from=build /app/out /usr/share/nginx/html
COPY hub/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
