// Contract addresses configuration for SecretAirdrop
// These should be updated after deployment

export const CONTRACT_ADDRESSES = {
  // These are placeholder addresses - replace with actual deployed contract addresses
  gameCoin: import.meta.env.VITE_GAME_COIN_ADDRESS || "0x0000000000000000000000000000000000000000",
  confidentialToken: import.meta.env.VITE_CONFIDENTIAL_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000", 
  secretAirdrop: import.meta.env.VITE_SECRET_AIRDROP_ADDRESS || "0x0000000000000000000000000000000000000000"
} as const;

// Validate that all addresses are configured
export function validateContractAddresses() {
  const missing = [];
  
  if (CONTRACT_ADDRESSES.gameCoin === "0x0000000000000000000000000000000000000000") {
    missing.push("GameCoin");
  }
  
  if (CONTRACT_ADDRESSES.confidentialToken === "0x0000000000000000000000000000000000000000") {
    missing.push("ConfidentialToken");
  }
  
  if (CONTRACT_ADDRESSES.secretAirdrop === "0x0000000000000000000000000000000000000000") {
    missing.push("SecretAirdrop");
  }
  
  if (missing.length > 0) {
    console.warn(`Missing contract addresses for: ${missing.join(", ")}`);
    console.warn("Please set environment variables: VITE_GAME_COIN_ADDRESS, VITE_CONFIDENTIAL_TOKEN_ADDRESS, VITE_SECRET_AIRDROP_ADDRESS");
    return false;
  }
  
  return true;
}

// Check if contracts are configured
export const areContractsConfigured = validateContractAddresses();