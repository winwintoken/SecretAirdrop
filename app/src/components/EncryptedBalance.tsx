import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { useFHEVM } from '@/hooks/useFHEVM';
import { CONTRACT_ADDRESSES } from '@/config/contracts';

interface EncryptedBalanceProps {
  ciphertextHandle: string | null;
  label: string;
  unit?: string;
}

export function EncryptedBalance({ ciphertextHandle, label, unit = 'tokens' }: EncryptedBalanceProps) {
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { address } = useAccount();
  const { instance: fhevmInstance, initFHEVM } = useFHEVM();
  const { data: walletClient } = useWalletClient();

  const buttonStyle = {
    background: '#3498db',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    marginLeft: '8px'
  };

  const decryptBalance = async () => {
    console.log("ciphertextHandle:", ciphertextHandle, fhevmInstance, address, walletClient);

    if (!fhevmInstance || !address || !walletClient || !ciphertextHandle) {
      setError('Missing requirements for decryption');
      return;
    }

    try {
      setIsDecrypting(true);
      setError(null);
      console.log('🔓 [DECRYPT] Starting balance decryption...');
      console.log('🔓 [DECRYPT] Ciphertext handle:', ciphertextHandle);

      // Generate keypair for user decryption
      const keypair = fhevmInstance.generateKeypair();
      console.log('🔑 [DECRYPT] Generated keypair');

      // Prepare handle-contract pairs
      const handleContractPairs = [
        {
          handle: ciphertextHandle,
          contractAddress: CONTRACT_ADDRESSES.confidentialToken,
        },
      ];

      // Create EIP712 signature for user decryption
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = "10";
      const contractAddresses = [CONTRACT_ADDRESSES.confidentialToken];

      const eip712 = fhevmInstance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimeStamp,
        durationDays
      );

      console.log('✍️ [DECRYPT] Signing EIP712 message...');
      const signature = await walletClient.signTypedData({
        domain: eip712.domain,
        types: {
          UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
        },
        primaryType: 'UserDecryptRequestVerification',
        message: eip712.message,
      });

      console.log('🔓 [DECRYPT] Performing user decryption...');
      const result = await fhevmInstance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace("0x", ""),
        contractAddresses,
        address,
        startTimeStamp,
        durationDays
      );

      const decryptedBalance = result[ciphertextHandle];
      console.log('✅ [DECRYPT] Decrypted balance:', decryptedBalance);

      // Convert the decrypted value to a readable format
      // Since it's stored as amount * 1000000 (for precision), divide by 1000000
      const readableBalance = (Number(decryptedBalance)).toFixed(2);
      setDecryptedValue(readableBalance);
    } catch (error) {
      console.error('❌ [DECRYPT] Decryption failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to decrypt balance');
    } finally {
      setIsDecrypting(false);
    }
  };

  const resetDecryption = () => {
    setDecryptedValue(null);
    setError(null);
  };

  if (!ciphertextHandle) {
    return <span><strong>{label}:</strong> 0 {unit}</span>;
  }

  return (
    <span>
      <strong>{label}:</strong>{' '}
      {decryptedValue ? (
        <>
          {decryptedValue} {unit}
          <button style={{ ...buttonStyle, background: '#95a5a6' }} onClick={resetDecryption}>
            Hide
          </button>
        </>
      ) : (
        <>
          ***
          {!fhevmInstance ? (
            <button
              style={{ ...buttonStyle, background: '#f39c12' }}
              onClick={initFHEVM}
              disabled={isDecrypting}
            >
              Initialize FHE
            </button>
          ) : (
            <button
              style={buttonStyle}
              onClick={decryptBalance}
              disabled={isDecrypting}
            >
              {isDecrypting ? 'Decrypting...' : 'Decrypt'}
            </button>
          )}
        </>
      )}
      {error && (
        <div style={{
          color: '#e74c3c',
          fontSize: '12px',
          marginTop: '4px'
        }}>
          Error: {error}
        </div>
      )}
    </span>
  );
}