FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --chown=node:node --from=build /app/.next/standalone ./
COPY --chown=node:node --from=build /app/.next/static ./.next/static
COPY --chown=node:node --from=build /app/public ./public
# per gli script di setup (db-init, crea-admin)
COPY --chown=node:node --from=build /app/db ./db
COPY --chown=node:node --from=build /app/scripts ./scripts
COPY --chown=node:node --from=build /app/src/lib/password.mjs ./src/lib/password.mjs
COPY --chown=node:node --from=build /app/node_modules/postgres ./node_modules/postgres
USER node
EXPOSE 3000
CMD ["node", "server.js"]
