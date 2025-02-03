# Install Foundry and build contracts
FROM ghcr.io/foundry-rs/foundry:latest AS foundry-builder

WORKDIR /app

# Copy Foundry configuration and contracts
COPY foundry.toml ./
COPY contracts/ contracts/

# Build contracts
RUN forge build

# Build frontend
FROM oven/bun:1 AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy source code and built contracts
COPY . .
COPY --from=foundry-builder /app/contracts/out ./contracts/out

# Build the app
RUN bun run build

# Production stage
FROM oven/bun:1 AS runner

WORKDIR /app

# Copy built assets from builders
COPY --from=frontend-builder /app/dist ./dist
COPY --from=frontend-builder /app/package*.json ./
COPY --from=foundry-builder /app/contracts/out ./contracts/out

# Install production dependencies only
RUN bun install --production

# Expose port
EXPOSE 3000

# Start the app
CMD ["bun", "start"]
