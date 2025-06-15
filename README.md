# Thaink Tank

Thaink Tank is an onchain collaborative ideation platform that leverages AI evaluation, encryption, and decentralized rewards to facilitate structured idea development. Participants contribute anonymous, encrypted notes, which are evaluated by AI before being integrated into a collective digest. The system ensures that all contributions are fairly rewarded and verifiably stored onchain.

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

### Wagmi Wrapper

The `wagmi` library is used to interact with the smart contracts `Thaink.sol` and `Tank.sol`, providing a seamless interface for blockchain operations and ensuring efficient communication with the Base network.

### Agent and Prompts

The agent, implemented in `thainky.ts`, utilizes prompts to facilitate AI interactions. It leverages the capabilities of OpenAI's models to process and evaluate contributions, ensuring that the ideation process remains dynamic and effective.

### Lit Protocol

Lit Protocol is employed for encrypting contributions, ensuring that all notes remain private and secure. This protocol allows for anonymous participation while maintaining the verifiability of contributions.

### AgentKit and OnchainKit

AgentKit and OnchainKit from Coinbase are integrated to manage wallet operations and onchain interactions. These tools provide robust support for handling transactions, managing digital assets, and ensuring secure communication with blockchain networks.

## Project Structure

- **agent/**: Contains the main logic for AI evaluation and note processing.
- **app/**: Frontend application code, including components and pages.
- **contracts/**: Smart contracts and related scripts for onchain interactions.
- **dist/**: Distribution folder for built assets.
- **public/**: Public assets like images and icons.
- **scripts/**: Deployment and utility scripts.

## Dependencies

Key dependencies include:

- `@lit-protocol/auth-browser`
- `@lit-protocol/contracts-sdk`
- `react`
- `vite`

For a full list, see `package.json`.

## Getting Started

1. **Clone the repository**: `git clone <repository-url>`
2. **Install dependencies**: `npm install`
3. **Run the development server**: `npm run dev`

## Scripts

- **`npm run dev`**: Start the development server.
- **`npm run build`**: Build the application for production.
- **`npm run deploy:anvil`**: Deploy using the Anvil environment.
- **`npm run deploy:base`**: Deploy using the Base environment.

For more detailed instructions, refer to the scripts section in `package.json`.
