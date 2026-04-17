# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies needed for Prisma/Alpine
RUN apk add --no-cache openssl

COPY package*.json ./
COPY . .
RUN npm install
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /usr/src/app

# Install runtime dependencies
RUN apk add --no-cache openssl

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
# We might need uploads directory
RUN mkdir -p uploads

EXPOSE 3000

CMD ["npm", "run", "start"]
