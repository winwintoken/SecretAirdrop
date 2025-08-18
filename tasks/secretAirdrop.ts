import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { FhevmType } from "@fhevm/hardhat-plugin";

task("task:mint")
  .addParam("contract", "GameCoin contract address")
  .addParam("amount", "Amount of tokens to mint")
  .setDescription("Mint GameCoin tokens to an address")
  .setAction(async function (taskArguments: TaskArguments, { ethers, fhevm }) {
    const { contract, amount } = taskArguments;
    const [signer] = await ethers.getSigners();

    const gameCoinContract = await ethers.getContractAt("GameCoin", contract);
    const to = signer.address
    console.log(`Minting ${amount} GameCoin tokens to ${to}...`);
    const tx = await gameCoinContract.connect(signer).transfer(to, ethers.parseEther(amount.toString()));
    await tx.wait();

    console.log(`Successfully minted ${amount} tokens to ${to}`);
    console.log(`Transaction hash: ${tx.hash}`);
  });

task("task:approve")
  .addParam("gamecoin", "GameCoin contract address")
  .addParam("confidential", "ConfidentialToken contract address")
  .addParam("amount", "Amount to approve")
  .setDescription("Approve ConfidentialToken to spend GameCoin tokens")
  .setAction(async function (taskArguments: TaskArguments, { ethers, fhevm }) {
    const { gamecoin, confidential, amount } = taskArguments;
    const [signer] = await ethers.getSigners();

    const gameCoinContract = await ethers.getContractAt("GameCoin", gamecoin);

    console.log(`Approving ConfidentialToken ${confidential} to spend ${amount} GameCoin tokens...`);
    const tx = await gameCoinContract.connect(signer).approve(confidential, ethers.parseEther(amount.toString()));
    await tx.wait();

    console.log(`Successfully approved ${amount} tokens`);
    console.log(`Transaction hash: ${tx.hash}`);
  });

task("task:wrap")
  .addParam("contract", "ConfidentialToken contract address")
  .addParam("amount", "Amount of tokens to wrap (encrypted)")
  .setDescription("Wrap GameCoin tokens into encrypted ConfidentialToken")
  .setAction(async function (taskArguments: TaskArguments, { ethers, fhevm }) {
    const { contract, amount } = taskArguments;
    const [signer] = await ethers.getSigners();

    const confidentialTokenContract = await ethers.getContractAt("ConfidentialToken", contract);
    console.log(`Wrapping ${amount} tokens into encrypted ConfidentialToken...`);
    const tx = await confidentialTokenContract.connect(signer).wrap(
      signer.address,
      ethers.parseEther(amount.toString())
    );
    await tx.wait();

    console.log(`Successfully wrapped ${amount} tokens`);
    console.log(`Transaction hash: ${tx.hash}`);
  });


// Task: Set operator for ctoken transfers
task("task:approve-ctoken", "Approve contract as operator for ctoken")
  .addParam("contract", "Address of the airdrop contract")
  .addParam("ctoken", "Address of the ctoken contract")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const [signer] = await ethers.getSigners();
    const ctoken = await ethers.getContractAt("ConfidentialToken", taskArguments.ctoken);

    const until = Math.floor(Date.now() / 1000) + 100000
    console.log("🔐 Approving platform as operator...");

    // User directly calls setOperator on cUSDT contract
    const approveTx = await ctoken.setOperator(taskArguments.contract, until);
    await approveTx.wait();

    console.log("✅ Platform approved as operator");
    console.log("Transaction:", approveTx.hash);
  });

task("task:deposit")
  .addParam("contract", "SecretAirdrop contract address")
  .addParam("amount", "Amount of encrypted tokens to deposit")
  .setDescription("Deposit encrypted tokens into SecretAirdrop contract")
  .setAction(async function (taskArguments: TaskArguments, { ethers, fhevm }) {
    const { contract, amount } = taskArguments;
    const [signer] = await ethers.getSigners();
    await fhevm.initializeCLIApi();
    const secretAirdropContract = await ethers.getContractAt("SecretAirdrop", contract);

    // Create encrypted input for deposit
    const input = fhevm.createEncryptedInput(contract, signer.address);
    input.add64(parseInt(amount) * 1000000);
    const encryptedInput = await input.encrypt();

    console.log(`Depositing ${amount} encrypted tokens into SecretAirdrop...`);
    const tx = await secretAirdropContract.connect(signer).depositTokens(
      encryptedInput.handles[0],
      encryptedInput.inputProof
    );
    await tx.wait();

    console.log(`Successfully deposited ${amount} encrypted tokens`);
    console.log(`Transaction hash: ${tx.hash}`);
  });

task("task:configure")
  .addParam("contract", "SecretAirdrop contract address")
  .addParam("recipients", "Comma-separated list of recipient addresses")
  .addParam("amounts", "Comma-separated list of encrypted amounts")
  .setDescription("Configure airdrops for multiple recipients")
  .setAction(async function (taskArguments: TaskArguments, { ethers, fhevm }) {
    const { contract, recipients, amounts } = taskArguments;
    const [signer] = await ethers.getSigners();

    const secretAirdropContract = await ethers.getContractAt("SecretAirdrop", contract);

    const recipientList = recipients.split(",").map((addr: string) => addr.trim());
    const amountList = amounts.split(",").map((amount: string) => parseInt(amount.trim()));

    if (recipientList.length !== amountList.length) {
      throw new Error("Recipients and amounts must have the same length");
    }

    // Create encrypted inputs for all amounts
    const input = fhevm.createEncryptedInput(contract, signer.address);
    for (const amount of amountList) {
      input.add32(amount);
    }
    const encryptedInput = await input.encrypt();

    console.log(`Configuring airdrops for ${recipientList.length} recipients...`);
    const tx = await secretAirdropContract.connect(signer).configureAirdrops(
      recipientList,
      encryptedInput.handles,
      encryptedInput.inputProof
    );
    await tx.wait();

    console.log(`Successfully configured airdrops for ${recipientList.length} recipients`);
    console.log(`Transaction hash: ${tx.hash}`);

    // Log recipient details
    for (let i = 0; i < recipientList.length; i++) {
      console.log(`Recipient ${i + 1}: ${recipientList[i]} -> ${amountList[i]} tokens`);
    }
  });

task("task:claim")
  .addParam("contract", "SecretAirdrop contract address")
  .setDescription("Claim airdrop tokens for the calling address")
  .setAction(async function (taskArguments: TaskArguments, { ethers, fhevm }) {
    const { contract } = taskArguments;
    const [signer] = await ethers.getSigners();

    const secretAirdropContract = await ethers.getContractAt("SecretAirdrop", contract);

    console.log(`Claiming airdrop for address ${signer.address}...`);

    // Check if airdrop exists first
    const hasAirdrop = await secretAirdropContract.hasAirdrop(signer.address);
    if (!hasAirdrop) {
      console.log("No airdrop configured for this address");
      return;
    }

    // Check if already claimed
    const hasClaimed = await secretAirdropContract.hasClaimed(signer.address);
    if (hasClaimed) {
      console.log("Airdrop already claimed for this address");
      return;
    }

    const tx = await secretAirdropContract.connect(signer).claimAirdrop();
    await tx.wait();

    console.log(`Successfully claimed airdrop tokens`);
    console.log(`Transaction hash: ${tx.hash}`);
  });

task("task:status")
  .addParam("contract", "SecretAirdrop contract address")
  .addOptionalParam("address", "Address to check (defaults to signer address)")
  .setDescription("Check airdrop status for an address")
  .setAction(async function (taskArguments: TaskArguments, { ethers, fhevm }) {
    const { contract, address } = taskArguments;
    const [signer] = await ethers.getSigners();

    const checkAddress = address || signer.address;
    const secretAirdropContract = await ethers.getContractAt("SecretAirdrop", contract);

    console.log(`Checking airdrop status for address: ${checkAddress}`);
    console.log("=".repeat(50));

    const hasAirdrop = await secretAirdropContract.hasAirdrop(checkAddress);
    console.log(`Has airdrop configured: ${hasAirdrop}`);

    if (hasAirdrop) {
      const hasClaimed = await secretAirdropContract.hasClaimed(checkAddress);
      console.log(`Has claimed: ${hasClaimed}`);

      // Try to get airdrop amount (encrypted)
      try {
        const encryptedAmount = await secretAirdropContract.getAirdropAmount(checkAddress);
        console.log(`Encrypted airdrop amount handle: ${encryptedAmount}`);
      } catch (error) {
        console.log("Cannot retrieve airdrop amount (may require proper ACL permissions)");
      }
    }

    // Get total recipients count
    const recipientCount = await secretAirdropContract.getRecipientCount();
    console.log(`Total recipients configured: ${recipientCount}`);
  });

task("task:balances")
  .addParam("gamecoin", "GameCoin contract address")
  .addParam("confidential", "ConfidentialToken contract address")
  .addOptionalParam("address", "Address to check (defaults to signer address)")
  .setDescription("Check token balances for an address")
  .setAction(async function (taskArguments: TaskArguments, { ethers, fhevm }) {
    const { gamecoin, confidential, address } = taskArguments;
    await fhevm.initializeCLIApi();
    const [signer] = await ethers.getSigners();

    const checkAddress = address || signer.address;
    const gameCoinContract = await ethers.getContractAt("GameCoin", gamecoin);
    const confidentialTokenContract = await ethers.getContractAt("ConfidentialToken", confidential);

    console.log(`Token balances for address: ${checkAddress}`);
    console.log("=".repeat(50));

    // GameCoin balance
    const gameCoinBalance = await gameCoinContract.balanceOf(checkAddress);
    console.log(`GameCoin balance: ${ethers.formatEther(gameCoinBalance)} GAME`);

    // ConfidentialToken balance (encrypted)

    const encryptedBalance = await confidentialTokenContract.confidentialBalanceOf(checkAddress);
    console.log(`ConfidentialToken balance handle: ${encryptedBalance}`);

    // Decrypt the encrypted balance if it's for the signer address
    if (checkAddress === signer.address && encryptedBalance !== ethers.ZeroHash) {
      try {
        const decryptedBalance = await fhevm.userDecryptEuint(
          FhevmType.euint64,
          encryptedBalance,
          confidential,
          signer
        );
        console.log(`ConfidentialToken balance (decrypted): ${Number(decryptedBalance) / 1000000} CONF`);
      } catch (decryptError) {
        console.log("Failed to decrypt balance (may require proper ACL permissions or mock environment)");
      }
    } else if (checkAddress !== signer.address) {
      console.log("Can only decrypt balance for signer address");
    }

  });