#!/bin/bash

# Make the script executable
chmod +x scripts/dev-docker.sh

# Build and start the containers
echo "Starting development environment..."
docker-compose up --build -d

# Wait for anvil to be ready
echo "Waiting for Anvil to start..."
while ! nc -z localhost 8545; do   
  sleep 1
done

# Deploy contracts to anvil
echo "Deploying contracts to Anvil..."
docker-compose exec app bun run deploy:anvil

# Show logs
echo "Development environment is ready! Showing logs..."
docker-compose logs -f
