#!/bin/bash

# Verify script usage
if [ $# -ne 1 ]; then
  echo "Usage: $0 <env-file>"
  exit 1
fi

# Store root directory
ROOT_DIR=$(pwd)

# Check if .env exists
if [ ! -f "$ROOT_DIR/.env" ]; then
  echo "Error: .env file not found"
  exit 1
fi

# Source both env files
source "$ROOT_DIR/.env"
source "$ROOT_DIR/$1"

# Verify CHAIN_NAME is provided
if [ -z "$CHAIN_NAME" ]; then
  echo "Error: CHAIN_NAME is not set in the env file."
  exit 1
fi

# Verify PRIVATE_KEY is provided
if [ -z "$PRIVATE_KEY" ]; then
  echo "Error: PRIVATE_KEY is not set in .env"
  exit 1
fi

# Optional verification flag
if [ -n "$VERIFY" ]; then
  VERIFY_FLAG="--verify"
else
  VERIFY_FLAG=""
fi

# Deploy contract and capture address
OUTPUT=$(PRIVATE_KEY="$PRIVATE_KEY" forge script contracts/scripts/Deploy.s.sol \
    --rpc-url $RPC_URL \
    --broadcast \
    $VERIFY_FLAG \
    2>&1)

echo "$OUTPUT"

# Extract the address from the logs section
DEPLOYED_ADDRESS=$(echo "$OUTPUT" | grep -A 1 "== Logs ==" | tail -n 1 | tr -d ' ')

if [ -z "$DEPLOYED_ADDRESS" ]; then
  echo "Error: Failed to retrieve deployed address."
  exit 1
fi

# Change back to root directory
cd "$ROOT_DIR"

# Update or append to main .env file
grep -q "^CONTRACT_${CHAIN_NAME}=" .env \
  && sed -i'' -e "s/^CONTRACT_${CHAIN_NAME}=.*/CONTRACT_${CHAIN_NAME}=${DEPLOYED_ADDRESS}/" .env \
  || echo "CONTRACT_${CHAIN_NAME}=${DEPLOYED_ADDRESS}" >> .env

echo "Deployed THAINK to $CHAIN_NAME: $DEPLOYED_ADDRESS"