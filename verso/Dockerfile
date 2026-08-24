# Build context is the REPO ROOT, so that scripts/ is reachable:
#   docker build -f verso/Dockerfile -t verso .
FROM node:22-alpine AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

COPY verso/package.json verso/pnpm-lock.yaml verso/pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY verso/ ./
RUN pnpm build

# An image cannot exist with assets that escape the path prefix.
COPY scripts/audit-export.mjs /audit.mjs
RUN node /audit.mjs out /verso

FROM nginx:alpine
COPY --from=build /app/out /usr/share/nginx/html/verso
COPY verso/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
