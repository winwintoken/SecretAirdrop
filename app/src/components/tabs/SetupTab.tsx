import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, isAddress } from 'viem';
import { GAME_COIN_ABI, CONFIDENTIAL_TOKEN_ABI, SECRET_AIRDROP_ABI } from '../../types/contracts';
import { useFHEVM } from '../../hooks/useFHEVM';
import { CONTRACT_ADDRESSES } from '../../config/contracts';

interface SetupTabProps {}

export function SetupTab({}: SetupTabProps) {
  const [wrapAmount, setWrapAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [recipientData, setRecipientData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { address } = useAccount();
  const { instance: fhevmInstance } = useFHEVM();
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const cardStyle = {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
    border: '1px solid #ecf0f1',
    marginBottom: '20px'
  };

  const formGroupStyle = {
    marginBottom: '25px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 600,
    color: '#2c3e50'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '2px solid #ecf0f1',
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box' as const
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


  const approveAndWrap = async () => {
    if (!fhevmInstance || !address || !wrapAmount) {
      setMessage({ type: 'error', text: 'Please connect wallet and enter amount' });
      return;
    }

    try {
      setIsLoading(true);
      const amount = parseInt(wrapAmount);
      
      // Step 1: Approve GameCoin
      const approveAmount = parseEther(amount.toString());
      await writeContract({
        address: CONTRACT_ADDRESSES.gameCoin as `0x${string}`,
        abi: GAME_COIN_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.confidentialToken as `0x${string}`, approveAmount],
      });

      // Step 2: Create encrypted input and wrap
      const input = fhevmInstance.createEncryptedInput(CONTRACT_ADDRESSES.confidentialToken, address);
      input.add32(amount);
      const encryptedInput = await input.encrypt();

      await writeContract({
        address: CONTRACT_ADDRESSES.confidentialToken as `0x${string}`,
        abi: CONFIDENTIAL_TOKEN_ABI,
        functionName: 'wrap',
        args: [encryptedInput.handles[0], encryptedInput.inputProof],
      });

      setMessage({ type: 'success', text: `Successfully wrapped ${amount} GameCoin tokens!` });
      setWrapAmount('');
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to wrap tokens' });
    } finally {
      setIsLoading(false);
    }
  };

  const depositTokens = async () => {
    if (!fhevmInstance || !address || !depositAmount) {
      setMessage({ type: 'error', text: 'Please connect wallet and enter amount' });
      return;
    }

    try {
      setIsLoading(true);
      const amount = parseInt(depositAmount);

      // Step 1: Approve ConfidentialToken
      const approveInput = fhevmInstance.createEncryptedInput(CONTRACT_ADDRESSES.confidentialToken, address);
      approveInput.add32(amount);
      const approveEncryptedInput = await approveInput.encrypt();

      await writeContract({
        address: CONTRACT_ADDRESSES.confidentialToken as `0x${string}`,
        abi: CONFIDENTIAL_TOKEN_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.secretAirdrop as `0x${string}`, approveEncryptedInput.handles[0], approveEncryptedInput.inputProof],
      });

      // Step 2: Deposit tokens
      const depositInput = fhevmInstance.createEncryptedInput(CONTRACT_ADDRESSES.secretAirdrop, address);
      depositInput.add32(amount);
      const depositEncryptedInput = await depositInput.encrypt();

      await writeContract({
        address: CONTRACT_ADDRESSES.secretAirdrop as `0x${string}`,
        abi: SECRET_AIRDROP_ABI,
        functionName: 'depositTokens',
        args: [depositEncryptedInput.handles[0], depositEncryptedInput.inputProof],
      });

      setMessage({ type: 'success', text: `Successfully deposited ${amount} tokens to airdrop contract!` });
      setDepositAmount('');
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to deposit tokens' });
    } finally {
      setIsLoading(false);
    }
  };

  const configureAirdrops = async () => {
    if (!fhevmInstance || !address || !recipientData) {
      setMessage({ type: 'error', text: 'Please connect wallet and enter recipient data' });
      return;
    }

    try {
      setIsLoading(true);
      
      const lines = recipientData.split('\n').filter(line => line.trim());
      const recipients: string[] = [];
      const amounts: number[] = [];

      for (const line of lines) {
        const parts = line.split(',');
        if (parts.length !== 2) {
          throw new Error(`Invalid format in line: ${line}. Use address,amount format`);
        }

        const recipientAddress = parts[0].trim();
        const amount = parseInt(parts[1].trim());

        if (!isAddress(recipientAddress)) {
          throw new Error(`Invalid address: ${recipientAddress}`);
        }

        if (!amount || amount <= 0) {
          throw new Error(`Invalid amount: ${amount}`);
        }

        recipients.push(recipientAddress);
        amounts.push(amount);
      }

      // Create encrypted inputs
      const input = fhevmInstance.createEncryptedInput(CONTRACT_ADDRESSES.secretAirdrop, address);
      amounts.forEach(amount => input.add32(amount));
      const encryptedInput = await input.encrypt();

      await writeContract({
        address: CONTRACT_ADDRESSES.secretAirdrop as `0x${string}`,
        abi: SECRET_AIRDROP_ABI,
        functionName: 'configureAirdrops',
        args: [recipients as `0x${string}`[], encryptedInput.handles, encryptedInput.inputProof],
      });

      setMessage({ type: 'success', text: `Successfully configured airdrops for ${recipients.length} recipients!` });
      setRecipientData('');
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to configure airdrops' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '1.3em' }}>🔧 Token Operations</h3>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Amount to Wrap (GameCoin → ConfidentialToken):</label>
            <input
              type="number"
              style={inputStyle}
              value={wrapAmount}
              onChange={(e) => setWrapAmount(e.target.value)}
              placeholder="1000"
            />
          </div>
          <button 
            style={buttonStyle} 
            onClick={approveAndWrap}
            disabled={isLoading || isConfirming}
          >
            {isLoading || isConfirming ? 'Processing...' : 'Approve & Wrap Tokens'}
          </button>
          
          <div style={formGroupStyle}>
            <label style={labelStyle}>Amount to Deposit (for Airdrop):</label>
            <input
              type="number"
              style={inputStyle}
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="5000"
            />
          </div>
          <button 
            style={{ ...buttonStyle, background: '#27ae60' }} 
            onClick={depositTokens}
            disabled={isLoading || isConfirming}
          >
            {isLoading || isConfirming ? 'Processing...' : 'Deposit to Airdrop'}
          </button>
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '1.3em' }}>🎯 Configure Airdrop Recipients</h3>
        <div style={formGroupStyle}>
          <label style={labelStyle}>Recipients & Amounts (one per line: address,amount):</label>
          <textarea
            style={{ ...inputStyle, minHeight: '120px' }}
            value={recipientData}
            onChange={(e) => setRecipientData(e.target.value)}
            placeholder="0x1234...,1000&#10;0x5678...,2000&#10;0x9abc...,1500"
          />
        </div>
        <button 
          style={{ ...buttonStyle, background: '#f39c12' }} 
          onClick={configureAirdrops}
          disabled={isLoading || isConfirming}
        >
          {isLoading || isConfirming ? 'Processing...' : 'Configure Airdrops'}
        </button>
      </div>

      {message && (
        <div style={{
          background: message.type === 'success' ? '#27ae60' : '#e74c3c',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          {message.text}
        </div>
      )}
    </div>
  );
}