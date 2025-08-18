# Secret Airdrop App

A React + Vite frontend application for confidential token airdrops using Zama's FHE technology, built with Rainbow Kit for wallet connections and Viem for blockchain interactions.

## Features

- **Project Setup**: Configure contract addresses and manage token operations
- **Claim Airdrop**: Users can claim their confidential airdrops
- **Status Dashboard**: View airdrop statistics and recipient status
- **Wallet Integration**: Seamless wallet connection with Rainbow Kit
- **FHE Support**: Confidential operations using Zama's FHEVM

## Tech Stack

- **React 19** - Modern React with latest features
- **Vite** - Fast build tool and development server
- **TypeScript** - Type-safe development
- **Viem** - Lightweight Ethereum library
- **Rainbow Kit** - Beautiful wallet connection UI
- **Wagmi** - React hooks for Ethereum

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. (Optional) Set up WalletConnect Project ID:
   - Get a project ID from [WalletConnect Cloud](https://cloud.walletconnect.com)
   - Update `VITE_WALLETCONNECT_PROJECT_ID` in `.env`

### Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building

Build the application for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Usage

### 1. Project Setup Tab
- Configure contract addresses for GameCoin, ConfidentialToken, and SecretAirdrop
- Wrap GameCoin tokens into ConfidentialToken
- Deposit tokens to the airdrop contract
- Configure recipients and their encrypted amounts

### 2. Claim Airdrop Tab
- Check airdrop eligibility
- Claim available airdrops
- View token balances

### 3. Status Tab
- View airdrop statistics
- See recipient list and claim status

## Contract Integration

The app integrates with three main contracts:
- **GameCoin**: ERC20 token for initial funding
- **ConfidentialToken**: FHE-enabled wrapper token
- **SecretAirdrop**: Main airdrop distribution contract

## Security Features

- All transaction amounts are encrypted using FHE
- Only authorized users can view their specific airdrop amounts
- Project owners have encrypted access to total statistics

## License

This project is licensed under the BSD-3-Clause-Clear license.
