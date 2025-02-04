#!/bin/bash
# Foundry-based contract deployment script
# Usage: ./scripts/deploy.sh <env-file> (e.g. .env.anvil)

set -eo pipefail # Exit on error, pipeline failure

#######################################
# Dependency Checks
#######################################

# Verify Foundry is installed
command -v forge >/dev/null 2>&1 || { 
  echo >&2 "Error: forge not found. Install Foundry:"
  echo >&2 "curl -L https://foundry.paradigm.xyz | bash && foundryup"
  exit 1
}

# Verify JSON processor is available
command -v jq >/dev/null 2>&1 || {
  echo >&2 "Error: jq required. Install with:"
  echo >&2 "sudo apt-get install jq / brew install jq"
  exit 1
}

#######################################
# Configuration Loading
#######################################

# Validate input parameter
if [ $# -ne 1 ]; then
  echo "Usage: $0 <environment-file>"
  exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs) # Global config
source "$1" # Network-specific config

#######################################
# Chain-Specific Configuration
#######################################

if [ "$CHAIN_NAME" = "ANVIL" ]; then
  # Anvil-specific settings for Blacksmith verification
  VERIFIER="sourcify"
  VERIFIER_URL="http://localhost:3000/api/verify"
  RPC_URL="http://localhost:8545"
  
  DEPLOY_CMD=(
    forge script contracts/scripts/Deploy.s.sol
    --verify
    --unlocked
    --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
    --fork-url "$RPC_URL"
    --verifier-url "$VERIFIER_URL"
    --verifier "$VERIFIER"
    --broadcast
    -vvvv
  )
else
  # Live network settings
  VERIFIER="etherscan"
  VERIFIER_URL="${ETHERSCAN_API_URL}"
  RPC_URL="${RPC_URL}"
  
  DEPLOY_CMD=(
    forge script contracts/scripts/Deploy.s.sol
    --rpc-url "$RPC_URL"
    --account "$FORGE_KEY"
    --sender "$FORGE_SENDER"
    --broadcast
    --verifier-url "$VERIFIER_URL"
    --etherscan-api-key "$ETHERSCAN_API_KEY"
    --verifier "$VERIFIER"
    -vvvv
  )
  
  # Add conditional verify flag for live networks
  if [ -n "$VERIFY" ]; then
    DEPLOY_CMD+=(--verify)
  fi
fi

#######################################
# Environment Validation
#######################################

# Validate required environment variables
required_vars=("RPC_URL" "CHAIN_NAME")
[ "$CHAIN_NAME" != "ANVIL" ] && required_vars+=("FORGE_KEY" "FORGE_SENDER")

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "Error: $var not set in environment"
    exit 1
  fi
done

#######################################
# Deployment Execution
#######################################

echo "🚀 Deploying to ${CHAIN_NAME} network..."
DEPLOY_LOG_FILE="deploy-${CHAIN_NAME}.log"

# Execute deployment with real-time logging
"${DEPLOY_CMD[@]}" | tee "$DEPLOY_LOG_FILE"

#######################################
# Post-Deployment Processing
#######################################

# Extract deployed address from logs or broadcast files
DEPLOY_JSON=$(grep '^{' "$DEPLOY_LOG_FILE" || true)

if [ -z "$DEPLOY_JSON" ]; then
  echo "⚠️  JSON output not found in logs, using broadcast files"
  BROADCAST_FILE=$(ls -t contracts/broadcast/Deploy.s.sol/*/run-latest.json | head -1)
  DEPLOYED_ADDRESS=$(jq -r '.transactions[0].contractAddress' "$BROADCAST_FILE")
else
  DEPLOYED_ADDRESS=$(echo "$DEPLOY_JSON" | jq -r '.returns.contractAddress')
fi

# Validate Ethereum address format
if [[ ! "$DEPLOYED_ADDRESS" =~ ^0x[a-fA-F0-9]{40}$ ]]; then
  echo "❌ Invalid contract address: ${DEPLOYED_ADDRESS}"
  exit 1
fi

#######################################
# Environment Configuration
#######################################

# Update .env file atomically
echo "🔧 Updating environment configuration..."
sed -i'' "/^CONTRACT_${CHAIN_NAME}=/d" .env
echo "CONTRACT_${CHAIN_NAME}=${DEPLOYED_ADDRESS}" >> .env

echo "✅ Successfully deployed to: ${DEPLOYED_ADDRESS}"