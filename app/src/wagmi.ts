import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, mainnet } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Secret Airdrop',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'secret-airdrop-demo',
  chains: [sepolia, mainnet],
  ssr: false,
});