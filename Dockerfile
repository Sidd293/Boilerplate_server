
FROM node:22-alpine AS base
WORKDIR /app

# -------------------------
# Dependencies (ALL deps, incl dev)
# -------------------------
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# -------------------------
# Build (TypeScript, Prisma, etc.)
# -------------------------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma
COPY web ./web

RUN npm run build

# -------------------------
# Production runtime (LEAN)
# -------------------------
FROM node:22-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production

# Copy only what runtime needs
COPY package.json package-lock.json ./
COPY prisma ./prisma

# Install ONLY production deps
RUN npm ci --omit=dev

# Copy build output
COPY --from=build /app/dist ./dist
COPY --from=build /app/web ./web

EXPOSE 3000
CMD ["npm", "start"]
