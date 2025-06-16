# Thaink Tank

Thaink Tank is an onchain collaborative ideation platform that leverages AI evaluation, encryption, and decentralized rewards to facilitate structured idea development. Participants contribute anonymous, encrypted notes, which are evaluated by AI before being integrated into a collective digest. The system ensures that all contributions are fairly rewarded and verifiably stored onchain.

**Live on [thaink.in](https://thaink.in)**

## How It Works

- **Raising an Idea**: An initial concept is introduced, setting the foundation for discussion.
- **Submitting a Note**: Participants add anonymous contributions, without seeing the full history, ensuring fresh perspectives.
- **AI Evaluation**: Each note is scored for relevance, novelty, and impact before being accepted.
- **Digest Update**: Accepted notes are merged into a running digest, preserving all essential details while maintaining a compact summary.
- **Gated Prompting**: Users can query the digest, but AI responses remain strictly factual, based only on the provided notes.
- **Onchain Rewards**: Fees from minting, querying, and participation are distributed among contributors based on AI-evaluated impact.

## Core Features

- **Anonymous & Encrypted Contributions**: Notes are encrypted using Lit Protocol, ensuring privacy while keeping participation verifiable.
- **AI-Powered Evaluation**: Contributions are assessed for quality, originality, and relevance, preventing spam and maintaining discussion integrity.
- **Structured Digesting**: The system summarizes accepted contributions into a digest that grows over time, avoiding redundant or excessive information.
- **Gated AI Prompting**: Users can query the digest but receive only fact-based responses, eliminating hallucinations or off-topic content.
- **Fair & Transparent Rewards**: All participation is recorded onchain, with fees distributed automatically based on evaluated contribution value.

## Additional Components

### Smart Contract Architecture

Thaink uses a factory-proxy pattern implemented with OpenZeppelin's Clones library:

- **Thaink.sol (Factory)**: Creates and manages Tank instances using minimal proxy pattern

  - Implements ERC1155 for Tank ownership tokens
  - Stores the Tank implementation contract address as immutable
  - Maintains a registry of all created Tanks

- **Tank.sol (Implementation)**: The core contract that stores ideas, notes, and digests

  - Uses OpenZeppelin's Initializable pattern for proxy initialization
  - Stores the factory address as immutable for security
  - Implements access control to ensure only the factory can initialize new instances
  - Uses bytes for most data storage for gas efficiency

- **Config.sol**: Shared configuration contract that stores IPFS CIDs for Lit Actions and LLM URL

This architecture ensures that each Tank has its own independent storage while sharing the same implementation logic, significantly reducing deployment costs.

### Lit Protocol Integration

In Thaink, we use Lit Protocol to enable secure, trustless AI operations through:

#### 1. Tank-specific PKP Implementation

Our system mints a dedicated PKP for each Tank that:

- Acts as the Tank's autonomous agent, handling all AI operations
- Is authorized through our factory contract's address during initialization
- Has permissions to sign transactions that update the Tank's state
- Uses multiple authentication methods to ensure only our authorized Lit Actions can control it

#### 2. Custom Lit Actions with Specialized Prompts

We've built three specialized Lit Actions for our Tank operations, each with carefully crafted prompts:

- **Hint Action**: Analyzes the Tank's current state and generates helpful hints for contributors

  - Uses a prompt that guides the AI to suggest new angles not covered in the digest
  - Ensures hints are concise, single-sentence suggestions that spark exploration

- **Prompt Action**: Takes user queries about the Tank's idea and provides factual responses

  - Uses a strict factual prompt that limits responses to information in the idea/digest
  - Prevents speculation or invention beyond what's been contributed

- **Submit Action**: Evaluates new contributions using a multi-criteria framework
  - Evaluates notes on relevance, novelty, depth, clarity, and impact (0-10 scale)
  - Distinguishes between actual contributions vs. mere hints/suggestions
  - Generates updated digests that integrate accepted contributions

#### 3. Thaink-specific Encryption System

Our implementation uses Lit's encryption with Tank-specific access controls:

- User contributions are encrypted with conditions tied to the Tank's IPFS CIDs
- Only the Tank's authorized PKP can decrypt and process these contributions
- The encryption ensures contributions remain private and properly evaluated

#### Technical Implementation

**Our Lit Integration Flow**:

1. During Tank deployment, we generate and store IPFS CIDs for our Lit Actions
2. The Tank factory mints a PKP with these CIDs as authorized controllers
3. When users submit contributions, our frontend calls the Submit Lit Action
4. The action retrieves the Tank's current state, evaluates the contribution, and if accepted:
   - Encrypts the contribution and updated digest
   - Signs a transaction to update the Tank's state
5. For user queries, the Prompt action retrieves and processes the Tank's digest
6. All operations happen within Lit's secure execution environment

### Frontend Integration

The frontend is built with React and integrates several key technologies:

- **Wagmi**: Used to interact with the smart contracts, providing a seamless interface for blockchain operations
- **Privy**: Integrated for simplified wallet connection and authentication
- **Lit Protocol Browser SDK**: Enables frontend interaction with Lit Actions and PKPs
- **Tailwind CSS & Radix UI**: Provides a modern, responsive UI framework

## Project Structure

- **app/**: Frontend React application

  - **components/**: Reusable UI components including Tank-specific forms
  - **pages/**: Main application pages for Tank creation, engagement, and contribution
  - **hooks/**: Custom React hooks for blockchain interactions

- **contracts/**: Solidity smart contracts

  - **src/**: Contract source files (Thaink.sol, Tank.sol, Config.sol)
  - **scripts/**: Deployment scripts

- **lit/**: Lit Protocol integration

  - **actions/**: Custom Lit Actions for hint, prompt, and submit operations
  - **utils.ts**: Shared utilities for encryption, signing, and blockchain interactions

- **scripts/**: Utility scripts

  - **generateIpfsCids.ts**: Generates IPFS CIDs for Lit Actions
  - **mintPKP.ts**: Mints PKPs with specific permissions for Tank operations
  - **setLitConfig.ts**: Configures Lit Protocol settings

- **public/**: Static assets and images

## Dependencies

Key dependencies include:

- **Lit Protocol**: `@lit-protocol/auth-browser`, `@lit-protocol/contracts-sdk`, `@lit-protocol/lit-node-client`
- **Blockchain**: `ethers`, `wagmi`, `@privy-io/react-auth`
- **Frontend**: `react`, `vite`, `tailwindcss`, `@radix-ui` components
- **Development**: `foundry` for smart contract development and testing

For a full list, see `package.json`.

## Getting Started

1. **Clone the repository**: `git clone <repository-url>`
2. **Install dependencies**: `bun install`
3. **Run the development server**: `bun run dev`

## Scripts

- **Development**:

  - `bun run dev`: Generate contract types with wagmi and start the development server
  - `bun run build`: Build the application for production

- **Lit Protocol**:

  - `bun run lit-actions`: Generate IPFS CIDs for Lit Actions
  - `bun run lit-pkp`: Mint PKPs with specific permissions
  - `bun run lit-config`: Configure Lit Protocol settings
  - `bun run lit`: Run all Lit Protocol setup scripts in sequence

- **Deployment**:
  - `bun run deploy:anvil`: Deploy contracts to local Anvil environment
  - `bun run deploy:base`: Deploy contracts to Base mainnet
  - `bun run deploy:base-sepolia`: Deploy contracts to Base Sepolia testnet

For more detailed instructions, refer to the scripts section in `package.json`.
