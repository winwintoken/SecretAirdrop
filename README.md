# SecretAirdrop - Confidential Token Airdrop Platform

A decentralized application that enables project owners to conduct confidential airdrops using Zama's Fully Homomorphic Encryption (FHE) technology. Built on FHEVM, this platform ensures complete privacy of airdrop amounts while maintaining transparency of participation.

## 🚀 Overview

SecretAirdrop is a privacy-preserving airdrop platform that leverages Zama's FHE technology to keep airdrop amounts confidential while ensuring verifiable distribution. The platform consists of three main smart contracts and a React-based frontend application.

### Key Features

- **🔒 Confidential Amounts**: Airdrop amounts are encrypted and never revealed on-chain
- **🎯 Batch Configuration**: Configure multiple recipients with different amounts in a single transaction
- **🔐 Secure Claims**: Users can claim their encrypted tokens without revealing amounts to others
- **📊 Privacy-Preserving Analytics**: Project owners can track total deposits and claims without exposing individual amounts
- **⚡ Gas Efficient**: Optimized smart contracts with minimal gas consumption
- **🌐 User-Friendly Interface**: Intuitive web application for both project owners and recipients

## 🏗 Architecture

### Smart Contracts

1. **GameCoin**: Standard ERC20 token representing the base project token
2. **ConfidentialToken**: FHE-enabled wrapper that encrypts GameCoin tokens
3. **SecretAirdrop**: Main airdrop contract managing encrypted distributions

### Technology Stack

**Backend (Smart Contracts)**
- **Solidity**: ^0.8.24
- **Hardhat**: Smart contract development framework
- **FHEVM**: Zama's Fully Homomorphic Encryption VM
- **OpenZeppelin**: Secure contract libraries

**Frontend**
- **React**: ^19.1.1 with TypeScript
- **Vite**: Build tool and development server
- **RainbowKit**: Wallet connection interface
- **Wagmi**: React hooks for Ethereum
- **Viem**: TypeScript interface for Ethereum
- **Zama Relayer SDK**: FHE operations client-side library

## 📋 Prerequisites

- **Node.js**: >=20.0.0
- **npm**: >=7.0.0
- **MetaMask** or compatible Ethereum wallet
- **Ethereum Sepolia testnet** access with test ETH

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/SecretAirdrop.git
cd SecretAirdrop
```

### 2. Install Dependencies

**Root Project (Smart Contracts)**
```bash
npm install
```

**Frontend Application**
```bash
cd app
npm install
cd ..
```

### 3. Environment Configuration

Create a `.env` file in the root directory:
```env
PRIVATE_KEY=your_deployer_private_key_without_0x_prefix
ALCHEMY_API_KEY=your_alchemy_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key_for_verification
```

## 🚀 Quick Start

### 1. Compile Smart Contracts
```bash
npm run compile
```

### 2. Run Tests
```bash
# Local tests
npm run test

# Sepolia network tests
npm run test:sepolia
```

### 3. Deploy to Sepolia
```bash
npm run deploy:sepolia
```

### 4. Start Frontend Development Server
```bash
cd app
npm run dev
```

The application will be available at `http://localhost:5173`

## 📖 Usage Guide

### For Project Owners

1. **Deploy Contracts**: Deploy GameCoin, ConfidentialToken, and SecretAirdrop contracts
2. **Mint Tokens**: Create your project tokens (GameCoin)
3. **Wrap Tokens**: Convert regular tokens to confidential tokens using ConfidentialToken wrapper
4. **Deposit Tokens**: Transfer encrypted tokens to the SecretAirdrop contract
5. **Configure Airdrops**: Set up recipients and their encrypted airdrop amounts
6. **Monitor Status**: Track total deposits, claims, and remaining balance

### For Recipients

1. **Connect Wallet**: Connect your Ethereum wallet to the application
2. **Check Eligibility**: View if you have pending airdrops
3. **Claim Tokens**: Claim your encrypted airdrop amount
4. **View Balance**: Check your confidential token balance

## 💰 Contract Interaction Flow

```
Project Owner Workflow:
1. Mint GameCoin tokens
2. Wrap GameCoin → ConfidentialToken (encrypted)
3. Deposit ConfidentialTokens → SecretAirdrop contract
4. Configure multiple recipients with encrypted amounts
5. Monitor total deposits and claims

Recipient Workflow:
1. Connect wallet to dApp
2. Check airdrop eligibility
3. Claim encrypted tokens from SecretAirdrop
4. Receive ConfidentialTokens in wallet
```

### Detailed Steps:

1. **Project Owner Mints GameCoin**: Creates standard ERC20 tokens
2. **Wrap to ConfidentialToken**: Converts tokens to FHE-encrypted version
3. **Deposit to SecretAirdrop**: Transfers encrypted tokens to airdrop contract
4. **Configure Recipients**: Sets encrypted amounts for multiple addresses
5. **Recipients Claim**: Users claim their encrypted token amounts
6. **Receive ConfidentialTokens**: Recipients get encrypted tokens in their wallet

## 🔐 Security Features

### Access Control
- **Project Owner Only**: Certain functions restricted to contract deployer
- **Recipient Verification**: Only eligible addresses can claim airdrops
- **One-Time Claims**: Prevents double-claiming of airdrops

### FHE Privacy Guarantees
- **Encrypted Storage**: All amounts stored as encrypted ciphertexts
- **Private Operations**: Arithmetic performed on encrypted values
- **Access Control Lists**: Fine-grained permissions for data access
- **Zero-Knowledge Proofs**: Cryptographic proofs without revealing data

### Error Handling
- **Encrypted Error Codes**: Error states tracked in encrypted form
- **Safe Arithmetic**: Overflow protection in FHE operations
- **Transaction Atomicity**: All-or-nothing transaction execution

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
npm run test

# Run specific test file
npx hardhat test test/SecretAirdrop.ts

# Run tests on Sepolia
npm run test:sepolia
```

### Coverage Report
```bash
npm run coverage
```

### Gas Usage Report
```bash
REPORT_GAS=true npm run test
```

## 📁 Project Structure

```
SecretAirdrop/
├── contracts/                 # Smart contracts
│   ├── SecretAirdrop.sol     # Main airdrop contract
│   ├── ConfidentialToken.sol # FHE token wrapper
│   ├── GameCoin.sol          # Base ERC20 token
│   └── FHECounter.sol        # Example FHE contract
├── deploy/                   # Deployment scripts
├── tasks/                    # Hardhat tasks
├── test/                     # Contract tests
├── scripts/                  # Utility scripts
├── app/                      # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── config/          # Configuration files
│   │   └── types/           # TypeScript types
│   └── public/              # Static assets
├── docs/                     # Documentation
├── hardhat.config.ts         # Hardhat configuration
└── package.json             # Project dependencies
```

## 🛠 Development Commands

### Smart Contracts
```bash
# Clean artifacts
npm run clean

# Compile contracts
npm run compile

# Generate TypeChain types
npm run typechain

# Run linter
npm run lint

# Format code
npm run prettier:write

# Deploy to localhost
npm run deploy:localhost
```

### Frontend
```bash
cd app

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🌐 Network Configuration

### Sepolia Testnet
- **Chain ID**: 11155111
- **RPC URL**: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`
- **Block Explorer**: https://sepolia.etherscan.io

### FHEVM Configuration
- **ACL Contract**: `0x687820221192C5B662b25367F70076A37bc79b6c`
- **KMS Verifier**: `0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC`
- **Input Verifier**: `0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4`
- **Relayer URL**: `https://relayer.testnet.zama.cloud`

## 📜 Available Scripts

| Script                 | Description                           |
| --------------------- | ------------------------------------- |
| `npm run compile`     | Compile all contracts                 |
| `npm run test`        | Run all tests                         |
| `npm run test:sepolia`| Run tests on Sepolia network         |
| `npm run coverage`    | Generate coverage report              |
| `npm run lint`        | Run linting checks                    |
| `npm run clean`       | Clean build artifacts                 |
| `npm run deploy:sepolia` | Deploy contracts to Sepolia       |
| `npm run deploy:localhost` | Deploy contracts to localhost    |

## 🔧 Troubleshooting

### Common Issues

1. **Build Failures**
   - Ensure Node.js version is >=20
   - Clear node_modules and reinstall dependencies
   - Run `npm run clean` and recompile

2. **Network Connection Issues**
   - Check RPC endpoints are accessible
   - Verify API keys are correctly configured
   - Ensure wallet is connected to correct network

3. **Transaction Failures**
   - Check account has sufficient ETH for gas
   - Verify contract addresses are correct
   - Ensure FHE operations have proper permissions

### Debug Mode
Enable debug logging:
```bash
DEBUG=true npm run test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests for new features
- Use conventional commit messages
- Update documentation for new features

## 📚 Documentation

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Setup Guide](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup)
- [FHEVM Testing Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test)
- [Zama Relayer SDK](https://docs.zama.ai/protocol/fhevm-relayer)

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Zama](https://zama.ai/) for FHEVM and FHE technology
- [OpenZeppelin](https://openzeppelin.com/) for secure contract libraries
- [Hardhat](https://hardhat.org/) for development framework
- [React](https://react.dev/) and [Vite](https://vitejs.dev/) for frontend tools

## 🆘 Support

For technical support or questions:
- **GitHub Issues**: [Report bugs or request features](https://github.com/zama-ai/fhevm/issues)
- **Documentation**: [FHEVM Docs](https://docs.zama.ai)
- **Community**: [Zama Discord](https://discord.gg/zama)

## 🗺 Roadmap

- [ ] Multi-token support
- [ ] Advanced analytics dashboard
- [ ] Mobile application
- [ ] Integration with more FHE operations
- [ ] Batch claim functionality
- [ ] Vesting schedule support

---

**Built with ❤️ using Zama's Fully Homomorphic Encryption technology**