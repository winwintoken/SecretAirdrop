// Contract addresses configuration for SecretAirdrop
// These should be updated after deployment

export const CONTRACT_ADDRESSES = {
  // These are placeholder addresses - replace with actual deployed contract addresses
  gameCoin: import.meta.env.VITE_GAME_COIN_ADDRESS || "0x9B1409B81E9DA3555a694aA5Ba2B15506a583D4A",
  confidentialToken: import.meta.env.VITE_CONFIDENTIAL_TOKEN_ADDRESS || "0x7dd22ca0e18246C3CB078a52D566f34Fc147eb4d",
  secretAirdrop: import.meta.env.VITE_SECRET_AIRDROP_ADDRESS || "0xf1bdF668605681Ff21FE452311Dfb8F66Da11f3C"
} as const;

// Log contract addresses on initialization
console.log('📊 [CONTRACTS] Contract addresses loaded:', {
  gameCoin: CONTRACT_ADDRESSES.gameCoin,
  confidentialToken: CONTRACT_ADDRESSES.confidentialToken,
  secretAirdrop: CONTRACT_ADDRESSES.secretAirdrop,
  fromEnv: {
    gameCoin: import.meta.env.VITE_GAME_COIN_ADDRESS,
    confidentialToken: import.meta.env.VITE_CONFIDENTIAL_TOKEN_ADDRESS,
    secretAirdrop: import.meta.env.VITE_SECRET_AIRDROP_ADDRESS
  }
});

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