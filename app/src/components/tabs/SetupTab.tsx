import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, isAddress, formatEther } from 'viem';
import { GAME_COIN_ABI, CONFIDENTIAL_TOKEN_ABI, SECRET_AIRDROP_ABI } from '../../types/contracts';
import { useFHEVM } from '../../hooks/useFHEVM';
import { CONTRACT_ADDRESSES } from '../../config/contracts';

interface SetupTabProps {}

export function SetupTab({}: SetupTabProps) {
  const [wrapAmount, setWrapAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [recipientData, setRecipientData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [wrapLoading, setWrapLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Track approval status
  const [isApproved, setIsApproved] = useState(false);
  const [approveHash, setApproveHash] = useState<string | null>(null);
  const [isWaitingForApproval, setIsWaitingForApproval] = useState(false);

  const { address } = useAccount();
  const { instance: fhevmInstance } = useFHEVM();
  const { writeContract, data: hash, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({ hash });

  // Check on-chain approval status
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.gameCoin as `0x${string}`,
    abi: GAME_COIN_ABI,
    functionName: 'allowance',
    args: [address as `0x${string}`, CONTRACT_ADDRESSES.confidentialToken as `0x${string}`],
    enabled: !!address && !!wrapAmount,
  });

  // Calculate if approval is sufficient
  const requiredAmount = wrapAmount ? parseEther(parseInt(wrapAmount).toString()) : BigInt(0);
  const hasEnoughAllowance = currentAllowance ? currentAllowance >= requiredAmount : false;
  
  // Use on-chain status as the source of truth
  const isReallyApproved = hasEnoughAllowance && !!wrapAmount;

  // Log transaction status changes
  React.useEffect(() => {
    if (hash) {
      console.log('📋 [TX] Transaction hash received:', hash);
      
      // If we're currently approving, track this hash
      if (approveLoading) {
        console.log('📋 [APPROVE] Tracking approve transaction hash:', hash);
        setApproveHash(hash);
      }
    }
  }, [hash, approveLoading]);

  // Simplified effect to track transaction confirmations and refetch allowance
  React.useEffect(() => {
    if (isSuccess && hash) {
      console.log('✅ [TX] Transaction confirmed successfully! Hash:', hash);
      
      // If this was an approve transaction, refetch the allowance
      if (approveHash && hash === approveHash) {
        console.log('✅ [APPROVE] Approve transaction confirmed, refetching allowance');
        setIsWaitingForApproval(false);
        // Refetch allowance data from chain
        setTimeout(() => refetchAllowance(), 1000); // Small delay to ensure chain state is updated
      }
    }
  }, [isSuccess, hash, approveHash, refetchAllowance]);

  React.useEffect(() => {
    if (writeError) {
      console.error('❌ [TX] Write contract error:', writeError);
    }
  }, [writeError]);

  React.useEffect(() => {
    if (receiptError) {
      console.error('❌ [TX] Transaction receipt error:', receiptError);
    }
  }, [receiptError]);

  // Log on-chain allowance status for debugging
  React.useEffect(() => {
    console.log('🔍 [ALLOWANCE] On-chain allowance check:', {
      currentAllowance: currentAllowance?.toString(),
      requiredAmount: requiredAmount.toString(),
      hasEnoughAllowance,
      isReallyApproved,
      wrapAmount
    });
  }, [currentAllowance, requiredAmount, hasEnoughAllowance, isReallyApproved, wrapAmount]);

  // Reset approval state when wallet disconnects
  React.useEffect(() => {
    if (!address && (isApproved || approveHash || isWaitingForApproval)) {
      console.log('🔄 [STATE] Wallet disconnected, resetting approval status');
      setIsApproved(false);
      setApproveHash(null);
      setIsWaitingForApproval(false);
    }
  }, [address, isApproved, approveHash, isWaitingForApproval]);

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


  // Step 1: Approve GameCoin for ConfidentialToken
  const approveGameCoin = async () => {
    console.log('🚀 [APPROVE] Starting GameCoin approval process...');
    console.log('📊 [APPROVE] address:', address);
    console.log('📊 [APPROVE] wrapAmount:', wrapAmount);
    
    if (!address || !wrapAmount) {
      console.error('❌ [APPROVE] Missing required parameters:', { address, wrapAmount });
      setMessage({ type: 'error', text: 'Please connect wallet and enter amount' });
      return;
    }

    try {
      setApproveLoading(true);
      setIsWaitingForApproval(true);
      const amount = parseInt(wrapAmount);
      console.log('📊 [APPROVE] Parsed amount:', amount);
      
      const approveAmount = parseEther(amount.toString());
      console.log('🔐 [APPROVE] Approving GameCoin for amount:', approveAmount.toString());
      console.log('🔐 [APPROVE] Contract addresses:', {
        gameCoin: CONTRACT_ADDRESSES.gameCoin,
        confidentialToken: CONTRACT_ADDRESSES.confidentialToken
      });
      
      const approveArgs = {
        address: CONTRACT_ADDRESSES.gameCoin as `0x${string}`,
        abi: GAME_COIN_ABI,
        functionName: 'approve' as const,
        args: [CONTRACT_ADDRESSES.confidentialToken as `0x${string}`, approveAmount] as const,
      };
      console.log('🔐 [APPROVE] WriteContract args:', approveArgs);
      
      const approveTx = writeContract(approveArgs);
      console.log('✅ [APPROVE] Approve transaction initiated:', approveTx);

      setMessage({ type: 'success', text: `GameCoin approval initiated for ${amount} tokens! Please wait for confirmation.` });
    } catch (error) {
      console.error('❌ [APPROVE] Error during approval process:', error);
      console.error('❌ [APPROVE] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        cause: error instanceof Error ? error.cause : undefined
      });
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to approve GameCoin' });
      setIsWaitingForApproval(false);
    } finally {
      setApproveLoading(false);
      console.log('🏁 [APPROVE] Approval process finished');
    }
  };

  // Step 2: Wrap GameCoin to ConfidentialToken
  const wrapToConfidential = async () => {
    console.log('🚀 [WRAP] Starting wrap to confidential process...');
    console.log('📊 [WRAP] address:', address);
    console.log('📊 [WRAP] wrapAmount:', wrapAmount);
    
    if (!address || !wrapAmount) {
      console.error('❌ [WRAP] Missing required parameters:', { address, wrapAmount });
      setMessage({ type: 'error', text: 'Please connect wallet and enter amount' });
      return;
    }

    if (!isReallyApproved) {
      setMessage({ type: 'error', text: 'Please approve GameCoin first' });
      return;
    }

    try {
      setWrapLoading(true);
      const amount = parseInt(wrapAmount);
      console.log('📊 [WRAP] Parsed amount:', amount);
      
      // Convert amount to wei for the wrap function
      const amountInWei = parseEther(amount.toString());
      console.log('💰 [WRAP] Amount in wei:', amountInWei.toString());

      console.log('📦 [WRAP] Calling wrap function...');
      const wrapTx = writeContract({
        address: CONTRACT_ADDRESSES.confidentialToken as `0x${string}`,
        abi: CONFIDENTIAL_TOKEN_ABI,
        functionName: 'wrap',
        args: [address as `0x${string}`, amountInWei],
      });
      console.log('✅ [WRAP] Wrap transaction initiated:', wrapTx);

      console.log('🎉 [WRAP] Wrap process completed successfully!');
      setMessage({ type: 'success', text: `Successfully wrapped ${amount} GameCoin to ConfidentialToken!` });
      setWrapAmount('');
      setApproveHash(null); // Reset approval hash
      // Refetch allowance to update the UI
      setTimeout(() => refetchAllowance(), 1000);
    } catch (error) {
      console.error('❌ [WRAP] Error during wrap process:', error);
      console.error('❌ [WRAP] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        cause: error instanceof Error ? error.cause : undefined
      });
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to wrap tokens' });
    } finally {
      setWrapLoading(false);
      console.log('🏁 [WRAP] Wrap process finished');
    }
  };

  const depositTokens = async () => {
    console.log('🚀 [DEPOSIT] Starting deposit process...');
    console.log('📊 [DEPOSIT] fhevmInstance:', fhevmInstance);
    console.log('📊 [DEPOSIT] address:', address);
    console.log('📊 [DEPOSIT] depositAmount:', depositAmount);
    
    if (!fhevmInstance || !address || !depositAmount) {
      console.error('❌ [DEPOSIT] Missing required parameters:', { fhevmInstance, address, depositAmount });
      setMessage({ type: 'error', text: 'Please connect wallet and enter amount' });
      return;
    }

    try {
      setIsLoading(true);
      const amount = parseInt(depositAmount);
      console.log('📊 [DEPOSIT] Parsed amount:', amount);

      // Step 1: Approve ConfidentialToken
      console.log('🔐 [DEPOSIT] Step 1: Creating encrypted approve input...');
      const approveInput = fhevmInstance.createEncryptedInput(CONTRACT_ADDRESSES.confidentialToken, address);
      approveInput.add32(amount);
      console.log('🔒 [DEPOSIT] Encrypting approve input...');
      const approveEncryptedInput = await approveInput.encrypt();
      console.log('✅ [DEPOSIT] Approve encrypted input created:', {
        handles: approveEncryptedInput.handles,
        inputProof: approveEncryptedInput.inputProof
      });

      console.log('🔐 [DEPOSIT] Calling ConfidentialToken approve...');
      const approveTx = await writeContract({
        address: CONTRACT_ADDRESSES.confidentialToken as `0x${string}`,
        abi: CONFIDENTIAL_TOKEN_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.secretAirdrop as `0x${string}`, approveEncryptedInput.handles[0], approveEncryptedInput.inputProof],
      });
      console.log('✅ [DEPOSIT] Approve transaction initiated:', approveTx);

      // Step 2: Deposit tokens
      console.log('📦 [DEPOSIT] Step 2: Creating encrypted deposit input...');
      const depositInput = fhevmInstance.createEncryptedInput(CONTRACT_ADDRESSES.secretAirdrop, address);
      depositInput.add32(amount);
      console.log('🔒 [DEPOSIT] Encrypting deposit input...');
      const depositEncryptedInput = await depositInput.encrypt();
      console.log('✅ [DEPOSIT] Deposit encrypted input created:', {
        handles: depositEncryptedInput.handles,
        inputProof: depositEncryptedInput.inputProof
      });

      console.log('📦 [DEPOSIT] Calling SecretAirdrop depositTokens...');
      const depositTx = await writeContract({
        address: CONTRACT_ADDRESSES.secretAirdrop as `0x${string}`,
        abi: SECRET_AIRDROP_ABI,
        functionName: 'depositTokens',
        args: [depositEncryptedInput.handles[0], depositEncryptedInput.inputProof],
      });
      console.log('✅ [DEPOSIT] Deposit transaction initiated:', depositTx);

      console.log('🎉 [DEPOSIT] Process completed successfully!');
      setMessage({ type: 'success', text: `Successfully deposited ${amount} tokens to airdrop contract!` });
      setDepositAmount('');
    } catch (error) {
      console.error('❌ [DEPOSIT] Error during deposit process:', error);
      console.error('❌ [DEPOSIT] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        cause: error instanceof Error ? error.cause : undefined
      });
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to deposit tokens' });
    } finally {
      setIsLoading(false);
      console.log('🏁 [DEPOSIT] Process finished, loading state reset');
    }
  };

  const configureAirdrops = async () => {
    console.log('🚀 [CONFIGURE] Starting configure airdrops process...');
    console.log('📊 [CONFIGURE] fhevmInstance:', fhevmInstance);
    console.log('📊 [CONFIGURE] address:', address);
    console.log('📊 [CONFIGURE] recipientData:', recipientData);
    
    if (!fhevmInstance || !address || !recipientData) {
      console.error('❌ [CONFIGURE] Missing required parameters:', { fhevmInstance, address, recipientData });
      setMessage({ type: 'error', text: 'Please connect wallet and enter recipient data' });
      return;
    }

    try {
      setIsLoading(true);
      
      console.log('📋 [CONFIGURE] Parsing recipient data...');
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
      
      console.log('✅ [CONFIGURE] Parsed recipients and amounts:', {
        recipients: recipients,
        amounts: amounts,
        count: recipients.length
      });

      // Create encrypted inputs
      console.log('🔒 [CONFIGURE] Creating encrypted inputs for amounts...');
      const input = fhevmInstance.createEncryptedInput(CONTRACT_ADDRESSES.secretAirdrop, address);
      amounts.forEach((amount, index) => {
        console.log(`🔒 [CONFIGURE] Adding amount ${amount} for recipient ${index}: ${recipients[index]}`);
        input.add32(amount);
      });
      
      console.log('🔒 [CONFIGURE] Encrypting inputs...');
      const encryptedInput = await input.encrypt();
      console.log('✅ [CONFIGURE] Encrypted inputs created:', {
        handles: encryptedInput.handles,
        inputProof: encryptedInput.inputProof,
        handleCount: encryptedInput.handles.length
      });

      console.log('📦 [CONFIGURE] Calling SecretAirdrop configureAirdrops...');
      const configureTx = await writeContract({
        address: CONTRACT_ADDRESSES.secretAirdrop as `0x${string}`,
        abi: SECRET_AIRDROP_ABI,
        functionName: 'configureAirdrops',
        args: [recipients as `0x${string}`[], encryptedInput.handles, encryptedInput.inputProof],
      });
      console.log('✅ [CONFIGURE] Configure transaction initiated:', configureTx);

      console.log('🎉 [CONFIGURE] Process completed successfully!');
      setMessage({ type: 'success', text: `Successfully configured airdrops for ${recipients.length} recipients!` });
      setRecipientData('');
    } catch (error) {
      console.error('❌ [CONFIGURE] Error during configure process:', error);
      console.error('❌ [CONFIGURE] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        cause: error instanceof Error ? error.cause : undefined
      });
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to configure airdrops' });
    } finally {
      setIsLoading(false);
      console.log('🏁 [CONFIGURE] Process finished, loading state reset');
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
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              style={{ 
                ...buttonStyle, 
                background: isReallyApproved ? '#95a5a6' : (approveHash && !isReallyApproved) ? '#f39c12' : '#3498db',
                opacity: isReallyApproved ? 0.7 : 1 
              }} 
              onClick={approveGameCoin}
              disabled={approveLoading || isConfirming || isReallyApproved}
            >
              {approveLoading 
                ? 'Sending...' 
                : isConfirming && approveHash 
                ? 'Confirming...' 
                : isReallyApproved 
                ? '✅ Approved' 
                : '1. Approve GameCoin'
              }
            </button>
            <button 
              style={{ 
                ...buttonStyle, 
                background: isReallyApproved ? '#27ae60' : '#bdc3c7',
                cursor: isReallyApproved ? 'pointer' : 'not-allowed'
              }} 
              onClick={wrapToConfidential}
              disabled={wrapLoading || isConfirming || !isReallyApproved}
            >
              {wrapLoading || isConfirming 
                ? 'Wrapping...' 
                : '2. Wrap to Confidential'
              }
            </button>
          </div>
          {/* Status messages */}
          {approveHash && !isReallyApproved && (
            <div style={{
              background: '#fff3cd',
              color: '#856404',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '14px',
              marginTop: '10px'
            }}>
              ⏳ Approval transaction sent! Waiting for confirmation...
            </div>
          )}
          {isReallyApproved && (
            <div style={{
              background: '#e8f5e8',
              color: '#27ae60',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '14px',
              marginTop: '10px'
            }}>
              ✅ GameCoin approved! Current allowance: {currentAllowance ? formatEther(currentAllowance) : '0'} tokens. You can now wrap to ConfidentialToken.
            </div>
          )}
          
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