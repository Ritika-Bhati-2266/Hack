# Previse — single-image demo deploy (beta)
# Frontend (.next standalone) + backend (Express :3001) behind one process.
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src ./src
COPY public ./public
COPY next.config.ts tsconfig.json postcss.config.mjs ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev
COPY backend ./backend
COPY --from=frontend-build /app/.next ./.next
COPY package*.json next.config.ts ./
RUN npm ci --omit=dev
EXPOSE 3000 3001
CMD ["sh", "-c", "node backend/server.js & npm start"]
