// Global variables
let provider = null;
let signer = null;
let fhevmInstance = null;
let contracts = {
    gameCoin: null,
    confidentialToken: null,
    secretAirdrop: null
};

// Contract addresses (will be loaded from localStorage or user input)
let addresses = {
    gameCoin: '',
    confidentialToken: '',
    secretAirdrop: ''
};

// Contract ABIs (simplified for demo - in production, import from artifacts)
const GAME_COIN_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function balanceOf(address) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
];

const CONFIDENTIAL_TOKEN_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function wrap(bytes32 encryptedAmount, bytes calldata inputProof) returns (bool)",
    "function approve(address spender, bytes32 encryptedAmount, bytes calldata inputProof) returns (bool)",
    "function transfer(address to, bytes32 encryptedAmount) returns (bool)",
    "function transferFrom(address from, address to, bytes32 encryptedAmount) returns (bool)"
];

const SECRET_AIRDROP_ABI = [
    "function projectOwner() view returns (address)",
    "function depositTokens(bytes32 encryptedAmount, bytes calldata inputProof)",
    "function configureAirdrops(address[] calldata recipients, bytes32[] calldata encryptedAmounts, bytes calldata inputProof)",
    "function claimAirdrop()",
    "function hasAirdrop(address recipient) view returns (bool)",
    "function hasClaimed(address recipient) view returns (bool)",
    "function getAirdropAmount(address recipient) view returns (bytes32)",
    "function getRecipientCount() view returns (uint256)",
    "function getRecipient(uint256 index) view returns (address)",
    "function getTotalDeposited() view returns (bytes32)",
    "function getTotalClaimed() view returns (bytes32)",
    "function getLastError(address user) view returns (bytes32)",
    "event TokensDeposited(address indexed projectOwner, uint256 indexed timestamp)",
    "event AirdropConfigured(address indexed recipient, uint256 indexed timestamp)", 
    "event AirdropClaimed(address indexed recipient, uint256 indexed timestamp)",
    "event Error(address indexed user, uint8 errorCode)"
];

// Initialize the application
window.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing Secret Airdrop application...');
    
    // Load saved addresses
    loadSavedAddresses();
    
    // Check if wallet is already connected
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await connectWallet();
            }
        } catch (error) {
            console.error('Error checking wallet connection:', error);
        }
    }
    
    // Initialize FHEVM SDK
    await initializeFHEVM();
});

// Initialize FHEVM SDK
async function initializeFHEVM() {
    try {
        console.log('Initializing FHEVM SDK...');
        
        // Initialize FHEVM SDK
        await window.fhevm.initSDK();
        
        // Create FHEVM instance with Sepolia config
        const config = {
            ...window.fhevm.SepoliaConfig,
            network: window.ethereum
        };
        
        fhevmInstance = await window.fhevm.createInstance(config);
        console.log('FHEVM SDK initialized successfully');
        
        updateStatus('FHEVM SDK Initialized', 'Connected', 'Ready');
    } catch (error) {
        console.error('Error initializing FHEVM SDK:', error);
        showError('Failed to initialize FHEVM SDK: ' + error.message);
    }
}

// Connect wallet
async function connectWallet() {
    try {
        if (!window.ethereum) {
            throw new Error('Please install MetaMask or another Web3 wallet');
        }
        
        showLoading(true);
        
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Create provider and signer
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        
        const address = await signer.getAddress();
        const network = await provider.getNetwork();
        
        updateStatus('Connected', network.name, address);
        
        // Initialize contracts if addresses are available
        if (addresses.gameCoin && addresses.confidentialToken && addresses.secretAirdrop) {
            initializeContracts();
        }
        
        showSuccess('Wallet connected successfully!');
        
    } catch (error) {
        console.error('Error connecting wallet:', error);
        showError('Failed to connect wallet: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Initialize contracts
function initializeContracts() {
    try {
        if (!signer) {
            throw new Error('Wallet not connected');
        }
        
        contracts.gameCoin = new ethers.Contract(addresses.gameCoin, GAME_COIN_ABI, signer);
        contracts.confidentialToken = new ethers.Contract(addresses.confidentialToken, CONFIDENTIAL_TOKEN_ABI, signer);
        contracts.secretAirdrop = new ethers.Contract(addresses.secretAirdrop, SECRET_AIRDROP_ABI, signer);
        
        console.log('Contracts initialized successfully');
        
    } catch (error) {
        console.error('Error initializing contracts:', error);
        showError('Failed to initialize contracts: ' + error.message);
    }
}

// Save addresses to localStorage
function saveAddresses() {
    try {
        addresses.gameCoin = document.getElementById('gameCoinAddress').value.trim();
        addresses.confidentialToken = document.getElementById('confidentialTokenAddress').value.trim();
        addresses.secretAirdrop = document.getElementById('secretAirdropAddress').value.trim();
        
        if (!addresses.gameCoin || !addresses.confidentialToken || !addresses.secretAirdrop) {
            throw new Error('Please fill in all contract addresses');
        }
        
        // Validate addresses format
        if (!ethers.utils.isAddress(addresses.gameCoin) || 
            !ethers.utils.isAddress(addresses.confidentialToken) || 
            !ethers.utils.isAddress(addresses.secretAirdrop)) {
            throw new Error('Please enter valid contract addresses');
        }
        
        localStorage.setItem('secretAirdrop_addresses', JSON.stringify(addresses));
        
        // Initialize contracts if wallet is connected
        if (signer) {
            initializeContracts();
        }
        
        showSuccess('Contract addresses saved successfully!');
        
    } catch (error) {
        console.error('Error saving addresses:', error);
        showError('Failed to save addresses: ' + error.message);
    }
}

// Load saved addresses
function loadSavedAddresses() {
    try {
        const saved = localStorage.getItem('secretAirdrop_addresses');
        if (saved) {
            addresses = JSON.parse(saved);
            
            document.getElementById('gameCoinAddress').value = addresses.gameCoin || '';
            document.getElementById('confidentialTokenAddress').value = addresses.confidentialToken || '';
            document.getElementById('secretAirdropAddress').value = addresses.secretAirdrop || '';
            
            console.log('Addresses loaded from localStorage');
        }
    } catch (error) {
        console.error('Error loading saved addresses:', error);
    }
}

// Approve and wrap tokens
async function approveAndWrap() {
    try {
        if (!contracts.gameCoin || !contracts.confidentialToken || !fhevmInstance) {
            throw new Error('Please connect wallet and configure contracts first');
        }
        
        const amount = parseInt(document.getElementById('wrapAmount').value);
        if (!amount || amount <= 0) {
            throw new Error('Please enter a valid amount to wrap');
        }
        
        showLoading(true);
        
        // Step 1: Approve GameCoin
        console.log('Approving GameCoin tokens...');
        const approveAmount = ethers.utils.parseEther(amount.toString());
        const approveTx = await contracts.gameCoin.approve(addresses.confidentialToken, approveAmount);
        await approveTx.wait();
        
        // Step 2: Create encrypted input for wrapping
        console.log('Creating encrypted input for wrapping...');
        const input = fhevmInstance.createEncryptedInput(addresses.confidentialToken, await signer.getAddress());
        input.add32(amount);
        const encryptedInput = await input.encrypt();
        
        // Step 3: Wrap tokens
        console.log('Wrapping tokens...');
        const wrapTx = await contracts.confidentialToken.wrap(
            encryptedInput.handles[0],
            encryptedInput.inputProof
        );
        await wrapTx.wait();
        
        showSuccess(`Successfully wrapped ${amount} GameCoin tokens into ConfidentialToken!`);
        
        // Refresh balances
        await refreshBalances();
        
    } catch (error) {
        console.error('Error wrapping tokens:', error);
        showError('Failed to wrap tokens: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Deposit tokens to airdrop contract
async function depositTokens() {
    try {
        if (!contracts.confidentialToken || !contracts.secretAirdrop || !fhevmInstance) {
            throw new Error('Please connect wallet and configure contracts first');
        }
        
        const amount = parseInt(document.getElementById('depositAmount').value);
        if (!amount || amount <= 0) {
            throw new Error('Please enter a valid amount to deposit');
        }
        
        showLoading(true);
        
        // Step 1: Create encrypted input for approval
        console.log('Approving ConfidentialToken for SecretAirdrop...');
        const approveInput = fhevmInstance.createEncryptedInput(addresses.confidentialToken, await signer.getAddress());
        approveInput.add32(amount);
        const approveEncryptedInput = await approveInput.encrypt();
        
        const approveTx = await contracts.confidentialToken.approve(
            addresses.secretAirdrop,
            approveEncryptedInput.handles[0],
            approveEncryptedInput.inputProof
        );
        await approveTx.wait();
        
        // Step 2: Create encrypted input for deposit
        console.log('Creating encrypted input for deposit...');
        const depositInput = fhevmInstance.createEncryptedInput(addresses.secretAirdrop, await signer.getAddress());
        depositInput.add32(amount);
        const depositEncryptedInput = await depositInput.encrypt();
        
        // Step 3: Deposit tokens
        console.log('Depositing tokens to airdrop contract...');
        const depositTx = await contracts.secretAirdrop.depositTokens(
            depositEncryptedInput.handles[0],
            depositEncryptedInput.inputProof
        );
        await depositTx.wait();
        
        showSuccess(`Successfully deposited ${amount} ConfidentialToken to airdrop contract!`);
        
        // Refresh statistics
        await refreshStats();
        
    } catch (error) {
        console.error('Error depositing tokens:', error);
        showError('Failed to deposit tokens: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Configure airdrops
async function configureAirdrops() {
    try {
        if (!contracts.secretAirdrop || !fhevmInstance) {
            throw new Error('Please connect wallet and configure contracts first');
        }
        
        const recipientData = document.getElementById('recipientData').value.trim();
        if (!recipientData) {
            throw new Error('Please enter recipient data');
        }
        
        showLoading(true);
        
        // Parse recipient data
        const lines = recipientData.split('\n').filter(line => line.trim());
        const recipients = [];
        const amounts = [];
        
        for (const line of lines) {
            const parts = line.split(',');
            if (parts.length !== 2) {
                throw new Error(`Invalid format in line: ${line}. Use address,amount format`);
            }
            
            const address = parts[0].trim();
            const amount = parseInt(parts[1].trim());
            
            if (!ethers.utils.isAddress(address)) {
                throw new Error(`Invalid address: ${address}`);
            }
            
            if (!amount || amount <= 0) {
                throw new Error(`Invalid amount: ${amount}`);
            }
            
            recipients.push(address);
            amounts.push(amount);
        }
        
        console.log(`Configuring airdrops for ${recipients.length} recipients...`);
        
        // Create encrypted inputs
        const input = fhevmInstance.createEncryptedInput(addresses.secretAirdrop, await signer.getAddress());
        amounts.forEach(amount => input.add32(amount));
        const encryptedInput = await input.encrypt();
        
        // Configure airdrops
        const configureTx = await contracts.secretAirdrop.configureAirdrops(
            recipients,
            encryptedInput.handles,
            encryptedInput.inputProof
        );
        await configureTx.wait();
        
        showSuccess(`Successfully configured airdrops for ${recipients.length} recipients!`);
        
        // Clear the input field
        document.getElementById('recipientData').value = '';
        
        // Refresh statistics and recipient list
        await refreshStats();
        await loadRecipients();
        
    } catch (error) {
        console.error('Error configuring airdrops:', error);
        showError('Failed to configure airdrops: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Claim airdrop
async function claimAirdrop() {
    try {
        if (!contracts.secretAirdrop) {
            throw new Error('Please connect wallet and configure contracts first');
        }
        
        showLoading(true);
        
        const userAddress = await signer.getAddress();
        
        // Check if user has an airdrop
        const hasAirdrop = await contracts.secretAirdrop.hasAirdrop(userAddress);
        if (!hasAirdrop) {
            throw new Error('No airdrop configured for your address');
        }
        
        // Check if already claimed
        const hasClaimed = await contracts.secretAirdrop.hasClaimed(userAddress);
        if (hasClaimed) {
            throw new Error('Airdrop already claimed');
        }
        
        // Claim airdrop
        console.log('Claiming airdrop...');
        const claimTx = await contracts.secretAirdrop.claimAirdrop();
        await claimTx.wait();
        
        showSuccess('Airdrop claimed successfully!');
        
        // Refresh airdrop status and balances
        await checkAirdropStatus();
        await refreshBalances();
        
    } catch (error) {
        console.error('Error claiming airdrop:', error);
        showError('Failed to claim airdrop: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Check airdrop status for current user
async function checkAirdropStatus() {
    try {
        if (!contracts.secretAirdrop || !signer) {
            throw new Error('Please connect wallet and configure contracts first');
        }
        
        const userAddress = await signer.getAddress();
        
        const hasAirdrop = await contracts.secretAirdrop.hasAirdrop(userAddress);
        const hasClaimed = await contracts.secretAirdrop.hasClaimed(userAddress);
        
        let statusHtml = `<h3>Airdrop Status for ${userAddress.substring(0, 6)}...${userAddress.substring(38)}</h3>`;
        
        if (!hasAirdrop) {
            statusHtml += '<p><strong>Status:</strong> No airdrop configured for your address</p>';
        } else {
            statusHtml += `<p><strong>Has Airdrop:</strong> Yes</p>`;
            statusHtml += `<p><strong>Claimed:</strong> ${hasClaimed ? 'Yes' : 'No'}</p>`;
            
            if (!hasClaimed) {
                statusHtml += '<p style="color: #27ae60;"><strong>✓ You can claim your airdrop!</strong></p>';
            }
        }
        
        document.getElementById('airdropInfo').innerHTML = statusHtml;
        
    } catch (error) {
        console.error('Error checking airdrop status:', error);
        showError('Failed to check airdrop status: ' + error.message);
    }
}

// Refresh user balances
async function refreshBalances() {
    try {
        if (!contracts.gameCoin || !contracts.confidentialToken || !signer) {
            return;
        }
        
        const userAddress = await signer.getAddress();
        
        // Get GameCoin balance
        const gameCoinBalance = await contracts.gameCoin.balanceOf(userAddress);
        document.getElementById('gameCoinBalance').textContent = 
            ethers.utils.formatEther(gameCoinBalance) + ' GAME';
        
        // ConfidentialToken balance is encrypted, so we just show that it exists
        document.getElementById('confidentialBalance').textContent = 'Encrypted (use user decrypt to view)';
        
    } catch (error) {
        console.error('Error refreshing balances:', error);
    }
}

// Refresh airdrop statistics
async function refreshStats() {
    try {
        if (!contracts.secretAirdrop) {
            return;
        }
        
        const totalRecipients = await contracts.secretAirdrop.getRecipientCount();
        document.getElementById('totalRecipients').textContent = totalRecipients.toString();
        
        // Total deposited and claimed are encrypted for project owner only
        document.getElementById('totalDeposited').textContent = 'Encrypted (owner only)';
        document.getElementById('totalClaimed').textContent = 'Encrypted (owner only)';
        
    } catch (error) {
        console.error('Error refreshing statistics:', error);
    }
}

// Load recipients list
async function loadRecipients() {
    try {
        if (!contracts.secretAirdrop) {
            throw new Error('SecretAirdrop contract not initialized');
        }
        
        showLoading(true);
        
        const totalRecipients = await contracts.secretAirdrop.getRecipientCount();
        let recipientHtml = '';
        
        if (totalRecipients.toString() === '0') {
            recipientHtml = '<p>No recipients configured yet.</p>';
        } else {
            recipientHtml = '<div>';
            
            for (let i = 0; i < totalRecipients; i++) {
                const recipientAddress = await contracts.secretAirdrop.getRecipient(i);
                const hasClaimed = await contracts.secretAirdrop.hasClaimed(recipientAddress);
                
                recipientHtml += `
                    <div class="recipient-item">
                        <span class="address">${recipientAddress}</span>
                        <span class="status ${hasClaimed ? 'claimed' : 'pending'}">
                            ${hasClaimed ? 'Claimed' : 'Pending'}
                        </span>
                    </div>
                `;
            }
            
            recipientHtml += '</div>';
        }
        
        document.getElementById('recipientList').innerHTML = recipientHtml;
        
    } catch (error) {
        console.error('Error loading recipients:', error);
        showError('Failed to load recipients: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Tab switching
function switchTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked tab
    event.target.classList.add('active');
    
    // Load data for specific tabs
    if (tabName === 'claim') {
        checkAirdropStatus();
        refreshBalances();
    } else if (tabName === 'status') {
        refreshStats();
    }
}

// Utility functions
function updateStatus(sdkStatus, networkName, userAddress) {
    document.getElementById('statusText').textContent = sdkStatus;
    document.getElementById('networkName').textContent = networkName;
    document.getElementById('userAddress').textContent = 
        userAddress.length > 42 ? userAddress.substring(0, 6) + '...' + userAddress.substring(38) : userAddress;
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    const successElement = document.getElementById('successMessage');
    successElement.textContent = message;
    successElement.style.display = 'block';
    setTimeout(() => {
        successElement.style.display = 'none';
    }, 5000);
}

// Auto-connect wallet button
function connectWalletButton() {
    connectWallet();
}

// Add connect wallet button if not connected
if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
            connectWallet();
        } else {
            updateStatus('Disconnected', 'Unknown', 'Not Connected');
        }
    });
    
    window.ethereum.on('chainChanged', () => {
        window.location.reload();
    });
}

// Add a connect wallet button to the header if not connected
setTimeout(() => {
    if (!signer) {
        const header = document.querySelector('.header');
        const connectButton = document.createElement('button');
        connectButton.textContent = '🔗 Connect Wallet';
        connectButton.className = 'btn';
        connectButton.style.marginTop = '20px';
        connectButton.onclick = connectWallet;
        header.appendChild(connectButton);
    }
}, 1000);