# The One Percent

A multiplayer blockchain elimination game where minority wins. Built on Celo blockchain with real-time indexing powered by Envio.

## Overview

The One Percent is an elimination-style prediction game where players compete in pools by making binary choices (Heads or Tails). The twist: players who choose the minority option advance to the next round, while the majority gets eliminated. The last player standing wins the entire prize pool.

## Game Mechanics

### Core Gameplay
- **Binary Choices**: Players choose between Heads or Tails each round
- **Minority Wins**: Players who pick the less popular choice advance
- **Elimination**: Majority players are eliminated each round
- **Winner Takes All**: Last remaining player wins the entire prize pool

### Pool Lifecycle
1. **Creation**: Verified creators stake CELO to create pools with entry fees
2. **Joining**: Players join by paying the entry fee
3. **Activation**: Pool starts when minimum players join or creator activates
4. **Rounds**: Players make choices, minorities advance, majorities eliminated
5. **Completion**: Game ends when one player remains or all choose the same option

### Special Scenarios
- **Tie Rounds**: When all remaining players choose the same option, the round repeats
- **Creator Rewards**: Pool creators earn 5% of the prize pool
- **Verification Bonus**: Verified creators using Self Protocol get extra pool allowances

## Project Structure

This monorepo contains the complete gaming ecosystem:

```
apps/
├── web/                 # Next.js web application and Farcaster frames
├── indexer-env/         # Envio real-time blockchain indexer
├── contracts/           # Solidity smart contracts
└── script/             # Deployment and utility scripts
```

### Core Applications

- **Web App** (`apps/web`): Full-featured web interface with dashboard, game arena, and pool management
- **Indexer** (`apps/indexer-env`): Real-time blockchain event indexing for 3-5x faster data loading
- **Smart Contract** (`apps/contracts`): CoinToss contract handling game logic, staking, and verification
- **Scripts** (`apps/script`): Deployment automation and contract interaction utilities

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query (TanStack Query)
- **Wallet Integration**: Wagmi v2 with ConnectKit

### Blockchain
- **Network**: Celo Mainnet (Chain ID: 42220)
- **Smart Contract**: Solidity 0.8.19 with OpenZeppelin
- **Indexing**: Envio HyperIndex for real-time data
- **Identity**: Self Protocol for creator verification

### Data & Performance
- **GraphQL**: Hasura-compatible queries via Envio
- **Real-time**: Sub-second data updates
- **Caching**: React Query with optimistic updates
- **Performance**: 3-5x faster than manual event parsing

## Quick Start

### Prerequisites
- Node.js 18+
- PNPM package manager
- Celo wallet with testnet/mainnet CELO

### Installation

1. Clone and install dependencies:
```bash
git clone <repository-url>
cd theonepercent
pnpm install
```

2. Set up environment variables:
```bash
# Copy environment template
cp apps/web/.env.example apps/web/.env

# Configure required variables:
NEXT_PUBLIC_ENVIO_GRAPHQL_URL=https://your-indexer-url/v1/graphql
NEXT_PUBLIC_COINTOSS_CONTRACT_ADDRESS=0xe5273E84634D9A81C09BEf46aA8980F1270b606A
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

3. Start development servers:
```bash
# Start all services
pnpm dev

# Or start individually:
pnpm --filter web dev          # Web app on :3000
pnpm --filter indexer-env dev  # Indexer on :8080
```

### Available Scripts

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all applications
- `pnpm lint` - Lint all packages
- `pnpm type-check` - TypeScript type checking
- `pnpm test` - Run test suites

## Development Guide

### Smart Contract Development
```bash
cd apps/contracts
forge build                 # Compile contracts
forge test                  # Run tests
forge script script/Deploy.s.sol # Deploy
```

### Indexer Development
```bash
cd apps/indexer-env
pnpm codegen                # Generate types
pnpm start                  # Start indexer
```

### Frontend Development
```bash
cd apps/web
pnpm dev                    # Start Next.js
pnpm build                  # Production build
```

## Game Economics

### Staking System
- **Base Stake**: 5 CELO minimum for pool creation
- **Pool Allowance**: 1 pool per 5 CELO staked (fair 1:1 ratio)
- **Maximum Stake**: 50 CELO cap
- **Early Withdrawal Penalty**: 30% of staked amount

### Revenue Distribution
- **Creator Reward**: 5% of prize pool to pool creator
- **Project Pool**: Collects penalties and abandoned pool funds
- **Winner Prize**: Remaining 95% to last standing player

### Verification Benefits
- Verified creators get bonus pool allowances
- Enhanced trust and discoverability
- Integrated with Self Protocol for identity verification

## Deployment

### Production Environment Variables
```bash
NEXT_PUBLIC_ENVIO_GRAPHQL_URL=https://indexer.dev.hyperindex.xyz/[hash]/v1/graphql
NEXT_PUBLIC_COINTOSS_CONTRACT_ADDRESS=0xe5273E84634D9A81C09BEf46aA8980F1270b606A
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### Vercel Deployment
1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Indexer Deployment
1. Deploy via Envio CLI: `pnpm envio deploy`
2. Update `NEXT_PUBLIC_ENVIO_GRAPHQL_URL` with deployed endpoint
3. Redeploy frontend to use production indexer

## Architecture Highlights

### Real-time Data Flow
1. Smart contract emits events on Celo
2. Envio indexer processes events in real-time
3. GraphQL API provides structured data
4. Frontend consumes via React Query hooks
5. UI updates automatically with new data

### Performance Optimizations
- Envio indexing: 3-5x faster than RPC polling
- React Query caching with background refetch
- Optimistic updates for better UX
- Next.js client-side navigation
- Prefetched data for instant page loads

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Links

- [Contract on Celoscan](https://celoscan.io/address/0xe5273E84634D9A81C09BEf46aA8980F1270b606A)
- [Celo Documentation](https://docs.celo.org/)
- [Envio Documentation](https://docs.envio.dev/)
- [Self Protocol](https://www.self.id/)
- [Next.js Documentation](https://nextjs.org/docs)