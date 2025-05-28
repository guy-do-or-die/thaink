# Build stage
FROM oven/bun:1 as builder

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN bun install

# Copy the rest of the application
COPY . .

# Build the Vite app
RUN bun run build

# Production stage
FROM oven/bun:1-slim

WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Install only production dependencies
RUN bun install --production

# Expose the port the app runs on
EXPOSE 4173

# Start the app with host binding
CMD ["bun", "run", "preview", "--host", "0.0.0.0"]
