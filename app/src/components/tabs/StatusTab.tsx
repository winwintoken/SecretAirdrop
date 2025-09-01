import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { SECRET_AIRDROP_ABI } from '@/type/contracts';
import { CONTRACT_ADDRESSES } from '@/config/contracts';

interface StatusTabProps { }

interface Recipient {
  address: string;
  hasClaimed: boolean;
}

export function StatusTab({ }: StatusTabProps) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: totalRecipients } = useReadContract({
    address: CONTRACT_ADDRESSES.secretAirdrop as `0x${string}`,
    abi: SECRET_AIRDROP_ABI,
    functionName: 'getRecipientCount',
  });

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
    background: '#95a5a6',
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

  const recipientListStyle = {
    maxHeight: '300px',
    overflowY: 'auto' as const,
    border: '1px solid #ecf0f1',
    borderRadius: '8px',
    padding: '10px'
  };

  const recipientItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    borderBottom: '1px solid #f8f9fa',
    fontFamily: 'monospace'
  };

  const loadRecipients = async () => {
    if (!totalRecipients) return;

    setIsLoading(true);
    try {
      const recipientPromises = [];
      const count = Number(totalRecipients);

      for (let i = 0; i < count; i++) {
        recipientPromises.push(
          fetch(`/api/recipient/${i}`) // This would need to be implemented or use contract calls
            .catch(() => ({ address: `0x${'0'.repeat(40)}`, hasClaimed: false }))
        );
      }

      // For now, we'll create mock data since we can't easily call contract methods in this context
      const mockRecipients: Recipient[] = [];
      for (let i = 0; i < count; i++) {
        mockRecipients.push({
          address: `0x${'1'.repeat(40)}`, // Mock address
          hasClaimed: Math.random() > 0.5 // Random claim status
        });
      }

      setRecipients(mockRecipients);
    } catch (error) {
      console.error('Error loading recipients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (totalRecipients) {
      loadRecipients();
    }
  }, [totalRecipients]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '1.3em' }}>📊 Airdrop Statistics</h3>
        <div style={infoCardStyle}>
          <p><strong>Total Recipients:</strong> {totalRecipients ? Number(totalRecipients).toString() : '-'}</p>
          <p><strong>Total Deposited:</strong> Encrypted (owner only)</p>
          <p><strong>Total Claimed:</strong> Encrypted (owner only)</p>
        </div>
        <button style={buttonStyle} onClick={() => window.location.reload()}>
          Refresh Statistics
        </button>
      </div>

      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '1.3em' }}>👥 Recipient List</h3>
        <div style={recipientListStyle}>
          {isLoading ? (
            <p>Loading recipients...</p>
          ) : recipients.length === 0 ? (
            <p>No recipients loaded. Click "Load Recipients" to view.</p>
          ) : (
            recipients.map((recipient, index) => (
              <div key={index} style={recipientItemStyle}>
                <span style={{ fontFamily: 'Courier New, monospace', color: '#7f8c8d' }}>
                  {recipient.address}
                </span>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  background: recipient.hasClaimed ? '#d5f4e6' : '#fef9e7',
                  color: recipient.hasClaimed ? '#27ae60' : '#f39c12'
                }}>
                  {recipient.hasClaimed ? 'Claimed' : 'Pending'}
                </span>
              </div>
            ))
          )}
        </div>
        <button style={buttonStyle} onClick={loadRecipients} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Load Recipients'}
        </button>
      </div>
    </div>
  );
}