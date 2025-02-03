#!/bin/bash

# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
export PATH="$PATH:$HOME/.foundry/bin"
foundryup

# Build contracts
forge build

# Build frontend
bun run build
