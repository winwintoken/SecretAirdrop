import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';
import { initSDK } from '@zama-fhe/relayer-sdk/bundle';
export function useFHEVM() {
  const [instance, setInstance] = useState<any>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isConnected } = useAccount();

  useEffect(() => {
    const initFHEVM = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize the SDK
        await initSDK();

        // Create FHEVM instance with proper configuration
        const config = {
          ...SepoliaConfig,
          // Use window.ethereum if available, otherwise fallback to network URL
          network: (window as any).ethereum,
        };

        const fhevmInstance = await createInstance(config);
        setInstance(fhevmInstance);
      } catch (err) {
        console.error('Failed to initialize FHEVM:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize FHEVM');
      } finally {
        setIsLoading(false);
      }
    };

    if (isConnected) {
      // initFHEVM();
    } else {
      // Reset instance when disconnected
      setInstance(undefined);
      setIsLoading(false);
      setError(null);
    }
  }, [isConnected]);

  return { instance, isLoading, error };
}