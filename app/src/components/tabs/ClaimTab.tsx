import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { GAME_COIN_ABI, SECRET_AIRDROP_ABI, CONFIDENTIAL_TOKEN_ABI } from '@/types/contracts';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { EncryptedBalance } from '../EncryptedBalance';

interface ClaimTabProps { }

export function ClaimTab({ }: ClaimTabProps) {
  const [gameCoinBalance, setGameCoinBalance] = useState<string>('0');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { address } = useAccount();
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  // Read contracts
  const { data: hasAirdrop } = useReadContract({
    address: CONTRACT_ADDRESSES.secretAirdrop as `0x${string}`,
    abi: SECRET_AIRDROP_ABI,
    functionName: 'hasAirdrop',
    args: address ? [address] : undefined,
  });

  const { data: hasClaimed } = useReadContract({
    address: CONTRACT_ADDRESSES.secretAirdrop as `0x${string}`,
    abi: SECRET_AIRDROP_ABI,
    functionName: 'hasClaimed',
    args: address ? [address] : undefined,
  });

  const { data: balance } = useReadContract({
    address: CONTRACT_ADDRESSES.gameCoin as `0x${string}`,
    abi: GAME_COIN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { data: confidentialBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.confidentialToken as `0x${string}`,
    abi: CONFIDENTIAL_TOKEN_ABI,
    functionName: 'confidentialBalanceOf',
    args: address ? [address] : undefined,
  });

  useEffect(() => {
    if (balance) {
      setGameCoinBalance(formatEther(balance as bigint));
    }
  }, [balance]);

  const cardStyle = {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
    border: '1px solid #ecf0f1',
    marginBottom: '20px'
  };

  const infoCardStyle = {
    background: '#f8f9fa',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '20px',
    borderLeft: '4px solid #3498db'
  };

  const buttonStyle = {
    background: '#3498db',
    color: 'white',
    border: 'none',
    padding: '12px 30px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 600,
    marginRight: '10px',
    marginBottom: '10px'
  };

  const claimAirdrop = async () => {
    console.log('🚀 [CLAIM] Starting claim airdrop process...');
    console.log('📊 [CLAIM] address:', address);
    console.log('📊 [CLAIM] hasAirdrop:', hasAirdrop);
    console.log('📊 [CLAIM] hasClaimed:', hasClaimed);

    if (!address) {
      console.error('❌ [CLAIM] No wallet address');
      setMessage({ type: 'error', text: 'Please connect your wallet' });
      return;
    }

    if (!hasAirdrop) {
      console.error('❌ [CLAIM] No airdrop configured for address:', address);
      setMessage({ type: 'error', text: 'No airdrop configured for your address' });
      return;
    }

    if (hasClaimed) {
      console.error('❌ [CLAIM] Airdrop already claimed for address:', address);
      setMessage({ type: 'error', text: 'Airdrop already claimed' });
      return;
    }

    try {
      console.log('🎁 [CLAIM] Calling SecretAirdrop claimAirdrop...');
      const claimTx = await writeContract({
        address: CONTRACT_ADDRESSES.secretAirdrop as `0x${string}`,
        abi: SECRET_AIRDROP_ABI,
        functionName: 'claimAirdrop',
      });
      console.log('✅ [CLAIM] Claim transaction initiated:', claimTx);

      console.log('🎉 [CLAIM] Claim process completed successfully!');
      setMessage({ type: 'success', text: 'Airdrop claimed successfully!' });
    } catch (error) {
      console.error('❌ [CLAIM] Error during claim process:', error);
      console.error('❌ [CLAIM] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        cause: error instanceof Error ? error.cause : undefined
      });
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to claim airdrop' });
    }
  };

  const checkAirdropStatus = () => {
    if (!address) {
      setMessage({ type: 'error', text: 'Please connect your wallet' });
      return;
    }

    // Status is automatically updated via useReadContract hooks
    setMessage({ type: 'success', text: 'Status refreshed' });
    setTimeout(() => setMessage(null), 2000);
  };

  const getAirdropStatusDisplay = () => {
    if (!address) {
      return <p>Connect your wallet to check airdrop status.</p>;
    }

    const statusHtml = (
      <div>
        <h3>Airdrop Status for {address.substring(0, 6)}...{address.substring(38)}</h3>
        {!hasAirdrop ? (
          <p><strong>Status:</strong> No airdrop configured for your address</p>
        ) : (
          <>
            <p><strong>Has Airdrop:</strong> Yes</p>
            <p><strong>Claimed:</strong> {hasClaimed ? 'Yes' : 'No'}</p>
            {!hasClaimed && (
              <p style={{ color: '#27ae60' }}><strong>✓ You can claim your airdrop!</strong></p>
            )}
          </>
        )}
      </div>
    );

    return statusHtml;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '1.3em' }}>🎁 Your Airdrop</h3>
        <div style={infoCardStyle}>
          {getAirdropStatusDisplay()}
        </div>
        <button
          style={{ ...buttonStyle, background: '#27ae60' }}
          onClick={claimAirdrop}
          disabled={isConfirming || !hasAirdrop || !!hasClaimed}
        >
          {isConfirming ? 'Processing...' : 'Claim My Airdrop'}
        </button>
        <button
          style={{ ...buttonStyle, background: '#95a5a6' }}
          onClick={checkAirdropStatus}
        >
          Check Status
        </button>
      </div>

      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '1.3em' }}>💰 Your Balances</h3>
        <div style={infoCardStyle}>
          <p><strong>GameCoin Balance:</strong> {gameCoinBalance} GAME</p>
          <p>
            <EncryptedBalance
              ciphertextHandle={confidentialBalance as string | null}
              label="ConfidentialToken Balance"
              unit="cGmaeCoin"
            />
          </p>
        </div>
        <button
          style={{ ...buttonStyle, background: '#95a5a6' }}
          onClick={() => window.location.reload()}
        >
          Refresh Balances
        </button>
      </div>

      {message && (
        <div style={{
          background: message.type === 'success' ? '#27ae60' : '#e74c3c',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          marginTop: '20px',
          gridColumn: '1 / -1'
        }}>
          {message.text}
        </div>
      )}
    </div>
  );
}