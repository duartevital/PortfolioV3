FROM node:24-alpine AS build
WORKDIR /app

# .env is excluded from the build context (.dockerignore) - PUBLIC_SITE_URL is
# needed at build time for the sitemap/canonical URLs, since pages prerender here.
ARG PUBLIC_SITE_URL
ENV PUBLIC_SITE_URL=${PUBLIC_SITE_URL}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle

EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
