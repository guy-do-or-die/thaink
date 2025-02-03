# Install Foundry and build contracts
FROM ghcr.io/foundry-rs/foundry:latest AS foundry-builder

WORKDIR /app

# Cache the lib directory for Foundry dependencies
COPY contracts/lib/ contracts/lib/
COPY foundry.toml ./

# Copy only the source contracts first to cache the compilation
COPY contracts/src/ contracts/src/
RUN forge build --sizes

# Copy the rest of the contracts directory
COPY contracts/ contracts/
RUN forge build

# Build frontend
FROM oven/bun:1 AS deps

WORKDIR /app

# Copy package files for dependency installation
COPY package.json bun.lockb ./

# Install dependencies with cache mount
RUN --mount=type=cache,target=/root/.bun \
    bun install --frozen-lockfile

# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy deps from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json /app/bun.lockb ./

# Copy source code
COPY . .
COPY --from=foundry-builder /app/contracts/out ./contracts/out

# Build with cache mount
RUN --mount=type=cache,target=/root/.bun \
    --mount=type=cache,target=/app/dist \
    bun run build

# Production stage
FROM oven/bun:1 AS runner

WORKDIR /app

# Copy only necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json /app/bun.lockb ./
COPY --from=builder /app/contracts/out ./contracts/out

# Install production dependencies with cache
RUN --mount=type=cache,target=/root/.bun \
    bun install --production --frozen-lockfile

# Expose port
EXPOSE 3000

# Start the app
CMD ["bun", "start"]
