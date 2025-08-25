# Multi-stage Dockerfile for Next.js + Prisma (SQLite)
# - Builds dependencies
# - Generates Prisma client and runs migrations (if the DB is available)
# - Builds Next.js app
# - Runs the production server (next start)

FROM node:20-bullseye AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Install full dependencies (including devDeps) because the build needs tools like Tailwind/PostCSS
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM node:20-bullseye AS builder
WORKDIR /app
# copy installed deps from previous stage
COPY --from=deps /app/node_modules ./node_modules
# copy source files
COPY . .

# Try to run migrations (for production) or fallback to db push when migrations aren't applicable.
# If the DB file is mounted from the host this will initialize/migrate it.
RUN npx prisma migrate deploy || npx prisma db push || true

# Build Next.js app (uses installed deps and generated prisma client)
# Run the Next build directly (this avoids the package.json script's `--turbopack` flag)
RUN npm run build

FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only what's necessary from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json* ./
# Install only production dependencies in the runtime image
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --production; fi

# Copy build output and static files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated/prisma ./src/generated/prisma

EXPOSE 3000
CMD ["npm", "run", "start"]
