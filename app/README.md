# Secret Airdrop Frontend

A user-friendly web interface for the Secret Airdrop confidential token distribution platform.

## Features

### For Project Owners (Airdrop Creators)
- **Contract Configuration**: Set up GameCoin, ConfidentialToken, and SecretAirdrop contract addresses
- **Token Operations**: Wrap GameCoin into encrypted ConfidentialToken
- **Airdrop Setup**: Deposit encrypted tokens and configure recipients with encrypted amounts
- **Batch Configuration**: Set up multiple recipients at once with a simple text format

### For Recipients (Airdrop Claimers)  
- **Claim Interface**: Simple one-click claiming for eligible addresses
- **Status Check**: View airdrop eligibility and claim status
- **Balance Display**: Check GameCoin and ConfidentialToken balances

### For Everyone
- **Statistics View**: Monitor total recipients and airdrop activity
- **Recipient List**: View all configured recipients and their claim status
- **Real-time Updates**: Automatic refresh of balances and statistics

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Web3**: Ethers.js for blockchain interaction
- **FHE**: Zama FHEVM SDK for confidential computing
- **Styling**: Modern responsive CSS with gradients and animations
- **Storage**: localStorage for contract address persistence

## Setup Instructions

1. **Open the Frontend**:
   ```bash
   # Serve the files using any HTTP server, for example:
   cd app
   python3 -m http.server 8000
   # or
   npx serve .
   ```

2. **Connect Your Wallet**:
   - Install MetaMask or another Web3 wallet
   - Connect to Sepolia testnet
   - Click "Connect Wallet" button

3. **Configure Contracts**:
   - Deploy contracts using: `npx hardhat deploy --network sepolia`
   - Copy the contract addresses to the "Contract Configuration" section
   - Click "Save Addresses" to persist them

4. **For Project Owners**:
   - Wrap GameCoin tokens into ConfidentialToken
   - Deposit encrypted tokens to the airdrop contract
   - Configure recipients using the format: `address,amount` (one per line)

5. **For Recipients**:
   - Connect your wallet
   - Go to "Claim Airdrop" tab
   - Check your eligibility and claim if available

## Usage Examples

### Project Owner Workflow
1. **Wrap Tokens**: Convert 10,000 GameCoin to ConfidentialToken
2. **Deposit**: Put 8,000 ConfidentialToken into airdrop contract  
3. **Configure**: Set up recipients like:
   ```
   0x1234567890123456789012345678901234567890,1000
   0x2345678901234567890123456789012345678901,1500
   0x3456789012345678901234567890123456789012,2000
   ```

### Recipient Workflow
1. **Check Status**: See if you have an airdrop available
2. **Claim**: Click "Claim My Airdrop" if eligible
3. **Verify**: Check your ConfidentialToken balance (encrypted)

## Features

### Responsive Design
- Mobile-friendly interface
- Adaptive grid layouts
- Touch-optimized interactions

### Error Handling
- Comprehensive error messages
- Transaction status indicators
- Automatic retry suggestions

### Privacy Features
- All amounts are encrypted on-chain
- Only authorized parties can decrypt values
- Zero-knowledge proofs for input validation

### User Experience
- Loading animations during transactions
- Success/error notifications
- Real-time status updates
- Persistent configuration storage

## Security Considerations

- All sensitive data is encrypted using FHEVM
- Frontend only handles public data and encrypted handles
- Private keys never leave the user's wallet
- Smart contract handles all access control

## Browser Support

- Modern browsers with Web3 wallet extensions
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers with wallet apps (MetaMask mobile, etc.)

## Troubleshooting

### Common Issues

1. **"FHEVM SDK not initialized"**
   - Wait for the SDK to load completely
   - Refresh the page if needed

2. **"Transaction failed"**
   - Check you have enough ETH for gas
   - Verify contract addresses are correct
   - Ensure you have the required token balances

3. **"No airdrop configured"**
   - Verify your address is in the recipient list
   - Contact the project owner if you should be eligible

4. **"Already claimed"**
   - Each address can only claim once
   - Check the "Status" tab to verify claim history

### Debug Mode

Open browser DevTools (F12) to see detailed logs and error messages for troubleshooting.

## Development

### File Structure
```
app/
├── index.html          # Main application interface
├── app.js             # JavaScript application logic
└── README.md          # This documentation
```

### Key Functions

- `connectWallet()`: Initialize Web3 connection
- `initializeFHEVM()`: Set up FHEVM SDK
- `approveAndWrap()`: Convert GameCoin to ConfidentialToken
- `depositTokens()`: Fund the airdrop contract
- `configureAirdrops()`: Set up recipients and amounts
- `claimAirdrop()`: Claim available airdrops

### Extending the Frontend

To add new features:

1. Add UI elements to `index.html`
2. Implement logic in `app.js`
3. Update contract ABIs if needed
4. Test thoroughly on testnet

## License

This frontend is part of the Secret Airdrop project and follows the same BSD-3-Clause-Clear license.