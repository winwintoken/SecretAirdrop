import { type ReactNode, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId } from 'wagmi';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();

  // Log wallet connection status
  useEffect(() => {
    console.log('🔗 [WALLET] Connection status changed:', {
      isConnected,
      address,
      chainId,
      connector: connector?.name
    });
  }, [isConnected, address, chainId, connector]);

  useEffect(() => {
    if (isConnected && address) {
      console.log('✅ [WALLET] Wallet connected successfully!');
      console.log('📊 [WALLET] Address:', address);
      console.log('📊 [WALLET] Chain ID:', chainId);
      console.log('📊 [WALLET] Network:', getNetworkName(chainId));
    } else {
      console.log('❌ [WALLET] Wallet not connected');
    }
  }, [isConnected, address, chainId]);

  const getNetworkName = (chainId: number) => {
    console.log('🌐 [NETWORK] Checking network for chainId:', chainId);
    switch (chainId) {
      case 11155111:
        console.log('✅ [NETWORK] Connected to Sepolia testnet');
        return 'Sepolia';
      case 1:
        console.log('✅ [NETWORK] Connected to Ethereum mainnet');
        return 'Ethereum';
      default:
        console.warn('⚠️ [NETWORK] Unknown network with chainId:', chainId);
        return 'Unknown';
    }
  };

  // Validate network for FHEVM compatibility
  useEffect(() => {
    if (chainId !== 11155111) {
      console.warn('⚠️ [NETWORK] Not on Sepolia testnet! FHEVM contracts may not work correctly.');
      console.warn('⚠️ [NETWORK] Please switch to Sepolia (chainId: 11155111)');
    }
  }, [chainId]);

  return (
    <div style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      margin: 0,
      padding: '20px',
      color: '#333',
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '30px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
          paddingBottom: '20px',
          borderBottom: '2px solid #f0f0f0'
        }}>
          <h1 style={{
            margin: 0,
            color: '#2c3e50',
            fontSize: '2.5em',
            fontWeight: 700
          }}>
            🎁 Secret Airdrop
          </h1>
          <p style={{
            margin: '10px 0 20px 0',
            color: '#7f8c8d',
            fontSize: '1.1em'
          }}>
            Confidential Token Distribution Platform
          </p>
          <ConnectButton />
        </div>

     
        {children}
      </div>
    </div>
  );
}