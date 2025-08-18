// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {FHE, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {ConfidentialToken} from "./ConfidentialToken.sol";
import "hardhat/console.sol";

/**
 * @title SecretAirdrop
 * @notice A contract for managing confidential airdrops using encrypted tokens
 * @dev Allows project owners to deposit encrypted tokens and set up encrypted airdrop amounts for multiple addresses
 */
contract SecretAirdrop is SepoliaConfig {
    using FHE for *;

    struct AirdropInfo {
        euint64 amount; // Encrypted airdrop amount
        bool claimed; // Whether the airdrop has been claimed
        bool exists; // Whether the airdrop entry exists
    }

    // Contract state
    ConfidentialToken public immutable confidentialToken;
    address public immutable projectOwner;
    euint64 private totalDeposited;
    euint64 private totalClaimed;

    // Mapping from recipient address to their airdrop information
    mapping(address => AirdropInfo) public airdrops;

    // Array to keep track of all recipients
    address[] public recipients;

    // Events
    event TokensDeposited(address indexed projectOwner, uint256 indexed timestamp);
    event AirdropConfigured(address indexed recipient, uint256 indexed timestamp);
    event AirdropClaimed(address indexed recipient, uint256 indexed timestamp);
    event Error(address indexed user, uint8 errorCode);

    // Error codes
    euint64 private NO_ERROR;
    euint64 private INSUFFICIENT_BALANCE;
    euint64 private ALREADY_CLAIMED;
    euint64 private NO_AIRDROP;
    euint64 private UNAUTHORIZED;

    // Last error tracking
    mapping(address => euint64) private lastError;

    modifier onlyProjectOwner() {
        require(msg.sender == projectOwner, "Only project owner can call this function");
        _;
    }

    constructor(address _confidentialToken) {
        confidentialToken = ConfidentialToken(_confidentialToken);
        projectOwner = msg.sender;
        totalDeposited = FHE.asEuint64(0);
        totalClaimed = FHE.asEuint64(0);

        // Initialize error codes
        NO_ERROR = FHE.asEuint64(0);
        INSUFFICIENT_BALANCE = FHE.asEuint64(1);
        ALREADY_CLAIMED = FHE.asEuint64(2);
        NO_AIRDROP = FHE.asEuint64(3);
        UNAUTHORIZED = FHE.asEuint64(4);

        FHE.allowThis(totalDeposited);
        FHE.allowThis(totalClaimed);
    }

    /**
     * @notice Deposit encrypted tokens into the airdrop contract
     * @param encryptedAmount External encrypted amount to deposit
     * @param inputProof Proof for the encrypted input
     */
    function depositTokens(externalEuint64 encryptedAmount, bytes calldata inputProof) external onlyProjectOwner {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        console.log("depositTokens 1");
        // Transfer encrypted tokens from project owner to this contract
        FHE.allowTransient(amount, address(confidentialToken));
        confidentialToken.confidentialTransferFrom(msg.sender, address(this), amount);
        console.log("depositTokens 2");
        // Update total deposited
        totalDeposited = FHE.add(totalDeposited, amount);
        console.log("depositTokens 3");
        // Grant access permissions
        FHE.allowThis(totalDeposited);
        FHE.allow(totalDeposited, msg.sender);
        console.log("depositTokens 4");
        emit TokensDeposited(msg.sender, block.timestamp);
    }

    /**
     * @notice Configure airdrops for multiple recipients with encrypted amounts
     * @param _recipients Array of recipient addresses
     * @param encryptedAmounts Array of external encrypted amounts for each recipient
     * @param inputProof Proof for the encrypted inputs
     */
    function configureAirdrops(
        address[] calldata _recipients,
        externalEuint64[] calldata encryptedAmounts,
        bytes calldata inputProof
    ) external onlyProjectOwner {
        require(_recipients.length == encryptedAmounts.length, "Recipients and amounts length mismatch");

        for (uint256 i = 0; i < _recipients.length; i++) {
            address recipient = _recipients[i];
            euint64 amount = FHE.fromExternal(encryptedAmounts[i], inputProof);

            // If this is a new recipient, add to recipients array
            if (!airdrops[recipient].exists) {
                recipients.push(recipient);
                airdrops[recipient].exists = true;
            }

            // Update airdrop information
            airdrops[recipient].amount = amount;
            airdrops[recipient].claimed = false;

            // Grant access permissions
            FHE.allowThis(amount);
            FHE.allow(amount, recipient);

            emit AirdropConfigured(recipient, block.timestamp);
        }
    }

    /**
     * @notice Claim airdrop tokens for the calling address
     */
    function claimAirdrop() external {
        AirdropInfo storage airdropInfo = airdrops[msg.sender];

        // Check if airdrop exists
        if (!airdropInfo.exists) {
            _setError(msg.sender, NO_AIRDROP);
            return;
        }

        // Check if already claimed
        if (airdropInfo.claimed) {
            _setError(msg.sender, ALREADY_CLAIMED);
            return;
        }

        // Get the airdrop amount
        euint64 claimAmount = airdropInfo.amount;

        // Check if contract has sufficient balance (encrypted check)
        euint64 remainingBalance = FHE.sub(totalDeposited, totalClaimed);
        ebool canClaim = FHE.le(claimAmount, remainingBalance);

        // Conditional transfer based on balance check
        euint64 transferAmount = FHE.select(canClaim, claimAmount, FHE.asEuint64(0));

        // Update state conditionally
        euint64 errorCode = FHE.select(canClaim, NO_ERROR, INSUFFICIENT_BALANCE);
        _setError(msg.sender, errorCode);

        // Mark as claimed if successful
        airdropInfo.claimed = true;

        // Update total claimed
        totalClaimed = FHE.add(totalClaimed, transferAmount);

        // Transfer tokens to claimant
        confidentialToken.confidentialTransfer(msg.sender, transferAmount);

        // Grant access permissions
        FHE.allowThis(totalClaimed);
        FHE.allow(totalClaimed, msg.sender);

        emit AirdropClaimed(msg.sender, block.timestamp);
    }

    /**
     * @notice Get the encrypted airdrop amount for a specific address
     * @param recipient The address to check
     * @return The encrypted airdrop amount
     */
    function getAirdropAmount(address recipient) external view returns (euint64) {
        require(airdrops[recipient].exists, "No airdrop configured for this address");
        return airdrops[recipient].amount;
    }

    /**
     * @notice Check if an address has claimed their airdrop
     * @param recipient The address to check
     * @return Whether the airdrop has been claimed
     */
    function hasClaimed(address recipient) external view returns (bool) {
        return airdrops[recipient].claimed;
    }

    /**
     * @notice Check if an address has an airdrop configured
     * @param recipient The address to check
     * @return Whether an airdrop is configured
     */
    function hasAirdrop(address recipient) external view returns (bool) {
        return airdrops[recipient].exists;
    }

    /**
     * @notice Get the total number of recipients
     * @return The number of recipients
     */
    function getRecipientCount() external view returns (uint256) {
        return recipients.length;
    }

    /**
     * @notice Get a recipient address by index
     * @param index The index of the recipient
     * @return The recipient address
     */
    function getRecipient(uint256 index) external view returns (address) {
        require(index < recipients.length, "Index out of bounds");
        return recipients[index];
    }

    /**
     * @notice Get the encrypted total deposited amount (only accessible by project owner)
     * @return The encrypted total deposited amount
     */
    function getTotalDeposited() external view returns (euint64) {
        require(msg.sender == projectOwner, "Only project owner can view total deposited");
        return totalDeposited;
    }

    /**
     * @notice Get the encrypted total claimed amount (only accessible by project owner)
     * @return The encrypted total claimed amount
     */
    function getTotalClaimed() external view returns (euint64) {
        require(msg.sender == projectOwner, "Only project owner can view total claimed");
        return totalClaimed;
    }

    /**
     * @notice Get the last error for a user
     * @param user The user address
     * @return The encrypted error code
     */
    function getLastError(address user) external view returns (euint64) {
        return lastError[user];
    }

    /**
     * @dev Set error code for a user
     * @param user The user address
     * @param errorCode The encrypted error code
     */
    function _setError(address user, euint64 errorCode) private {
        lastError[user] = errorCode;

        // Grant access permissions for error
        FHE.allowThis(errorCode);
        FHE.allow(errorCode, user);

        emit Error(user, 0); // Emit generic error event
    }

    /**
     * @notice Emergency function to withdraw remaining tokens (only project owner)
     * @param to The address to send remaining tokens
     */
    function emergencyWithdraw(address to) external onlyProjectOwner {
        euint64 remainingBalance = FHE.sub(totalDeposited, totalClaimed);
        confidentialToken.confidentialTransfer(to, remainingBalance);

        // Grant access permissions
        FHE.allowThis(remainingBalance);
        FHE.allow(remainingBalance, to);
    }
}
