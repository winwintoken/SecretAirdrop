import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';
import { initSDK } from '@zama-fhe/relayer-sdk/bundle';
export function useFHEVM() {
  const [instance, setInstance] = useState<any>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isConnected } = useAccount();

  const initFHEVM = useCallback(async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      console.log('🔧 [FHEVM] Starting FHEVM initialization...');
      setIsLoading(true);
      setError(null);

      // Initialize the SDK
      console.log('🔧 [FHEVM] Initializing SDK...');
      await initSDK();
      console.log('✅ [FHEVM] SDK initialized successfully');

      // Create FHEVM instance with proper configuration
      const config = {
        ...SepoliaConfig
        // Use window.ethereum if available, otherwise fallback to network URL
        // network: window.ethereum,
      };
      console.log('🔧 [FHEVM] Creating FHEVM instance with config:', config);

      const fhevmInstance = await createInstance(config);
      console.log('✅ [FHEVM] FHEVM instance created successfully:', fhevmInstance);
      setInstance(fhevmInstance);
    } catch (err) {
      console.error('❌ [FHEVM] Failed to initialize FHEVM:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize FHEVM');
    } finally {
      setIsLoading(false);
      console.log('🔧 [FHEVM] Initialization process completed');
    }
  }, [isConnected]);

  return { instance, isLoading, error, initFHEVM };
}