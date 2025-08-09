import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import type { FhevmInstance } from "@fhevm/hardhat-plugin";
import type { GameCoin, ConfidentialToken, SecretAirdrop } from "../types";
import type { Signer } from "ethers";

describe("SecretAirdrop", function () {
  let instance: FhevmInstance;
  let projectOwner: Signer;
  let recipient1: Signer;
  let recipient2: Signer;
  let recipient3: Signer;
  let gameCoin: GameCoin;
  let confidentialToken: ConfidentialToken;
  let secretAirdrop: SecretAirdrop;

  before(async function () {
    // Get signers
    [projectOwner, recipient1, recipient2, recipient3] = await ethers.getSigners();

    // Initialize FHEVM instance
    instance = await fhevm.createInstance();

    // Deploy GameCoin
    const GameCoinFactory = await ethers.getContractFactory("GameCoin");
    const initialSupply = ethers.parseEther("1000000"); // 1 million tokens
    gameCoin = await GameCoinFactory.connect(projectOwner).deploy(
      "Game Coin",
      "GAME",
      initialSupply
    );
    await gameCoin.waitForDeployment();

    // Deploy ConfidentialToken
    const ConfidentialTokenFactory = await ethers.getContractFactory("ConfidentialToken");
    confidentialToken = await ConfidentialTokenFactory.connect(projectOwner).deploy(
      await gameCoin.getAddress(),
      "Confidential Game Token",
      "cGAME",
      "https://example.com/token-metadata"
    );
    await confidentialToken.waitForDeployment();

    // Deploy SecretAirdrop
    const SecretAirdropFactory = await ethers.getContractFactory("SecretAirdrop");
    secretAirdrop = await SecretAirdropFactory.connect(projectOwner).deploy(
      await confidentialToken.getAddress()
    );
    await secretAirdrop.waitForDeployment();

    console.log("Contracts deployed:");
    console.log(`GameCoin: ${await gameCoin.getAddress()}`);
    console.log(`ConfidentialToken: ${await confidentialToken.getAddress()}`);
    console.log(`SecretAirdrop: ${await secretAirdrop.getAddress()}`);
  });

  describe("Deployment", function () {
    it("Should set the right project owner", async function () {
      expect(await secretAirdrop.projectOwner()).to.equal(await projectOwner.getAddress());
    });

    it("Should set the right confidential token", async function () {
      expect(await secretAirdrop.confidentialToken()).to.equal(await confidentialToken.getAddress());
    });

    it("Should have zero recipients initially", async function () {
      expect(await secretAirdrop.getRecipientCount()).to.equal(0);
    });
  });

  describe("Token Setup", function () {
    it("Should approve ConfidentialToken to spend GameCoin", async function () {
      const approveAmount = ethers.parseEther("100000"); // 100k tokens
      await gameCoin.connect(projectOwner).approve(await confidentialToken.getAddress(), approveAmount);
      
      const allowance = await gameCoin.allowance(
        await projectOwner.getAddress(),
        await confidentialToken.getAddress()
      );
      expect(allowance).to.equal(approveAmount);
    });

    it("Should wrap GameCoin into ConfidentialToken", async function () {
      const wrapAmount = 50000; // 50k tokens
      
      // Create encrypted input
      const input = instance.createEncryptedInput(await confidentialToken.getAddress(), await projectOwner.getAddress());
      input.add32(wrapAmount);
      const encryptedInput = await input.encrypt();

      // Wrap tokens
      await confidentialToken.connect(projectOwner).wrap(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      // Check that GameCoin balance decreased
      const gameCoinBalance = await gameCoin.balanceOf(await projectOwner.getAddress());
      expect(gameCoinBalance).to.equal(ethers.parseEther("950000")); // 1M - 50k
    });
  });

  describe("Airdrop Setup", function () {
    it("Should allow project owner to approve SecretAirdrop to spend ConfidentialToken", async function () {
      const approveAmount = 30000; // 30k encrypted tokens
      
      // Create encrypted input for approval
      const input = instance.createEncryptedInput(await confidentialToken.getAddress(), await projectOwner.getAddress());
      input.add32(approveAmount);
      const encryptedInput = await input.encrypt();

      await confidentialToken.connect(projectOwner).approve(
        await secretAirdrop.getAddress(),
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );
    });

    it("Should allow project owner to deposit tokens", async function () {
      const depositAmount = 20000; // 20k encrypted tokens
      
      // Create encrypted input for deposit
      const input = instance.createEncryptedInput(await secretAirdrop.getAddress(), await projectOwner.getAddress());
      input.add32(depositAmount);
      const encryptedInput = await input.encrypt();

      await expect(
        secretAirdrop.connect(projectOwner).depositTokens(
          encryptedInput.handles[0],
          encryptedInput.inputProof
        )
      ).to.emit(secretAirdrop, "TokensDeposited");
    });

    it("Should not allow non-owner to deposit tokens", async function () {
      const depositAmount = 1000;
      
      const input = instance.createEncryptedInput(await secretAirdrop.getAddress(), await recipient1.getAddress());
      input.add32(depositAmount);
      const encryptedInput = await input.encrypt();

      await expect(
        secretAirdrop.connect(recipient1).depositTokens(
          encryptedInput.handles[0],
          encryptedInput.inputProof
        )
      ).to.be.revertedWith("Only project owner can call this function");
    });

    it("Should configure airdrops for multiple recipients", async function () {
      const recipients = [
        await recipient1.getAddress(),
        await recipient2.getAddress(),
        await recipient3.getAddress()
      ];
      const amounts = [1000, 2000, 3000];

      // Create encrypted inputs
      const input = instance.createEncryptedInput(await secretAirdrop.getAddress(), await projectOwner.getAddress());
      amounts.forEach(amount => input.add32(amount));
      const encryptedInput = await input.encrypt();

      await expect(
        secretAirdrop.connect(projectOwner).configureAirdrops(
          recipients,
          encryptedInput.handles,
          encryptedInput.inputProof
        )
      ).to.emit(secretAirdrop, "AirdropConfigured");

      // Check recipient count
      expect(await secretAirdrop.getRecipientCount()).to.equal(3);

      // Check recipients
      expect(await secretAirdrop.getRecipient(0)).to.equal(recipients[0]);
      expect(await secretAirdrop.getRecipient(1)).to.equal(recipients[1]);
      expect(await secretAirdrop.getRecipient(2)).to.equal(recipients[2]);

      // Check airdrop existence
      expect(await secretAirdrop.hasAirdrop(recipients[0])).to.be.true;
      expect(await secretAirdrop.hasAirdrop(recipients[1])).to.be.true;
      expect(await secretAirdrop.hasAirdrop(recipients[2])).to.be.true;

      // Check not claimed initially
      expect(await secretAirdrop.hasClaimed(recipients[0])).to.be.false;
      expect(await secretAirdrop.hasClaimed(recipients[1])).to.be.false;
      expect(await secretAirdrop.hasClaimed(recipients[2])).to.be.false;
    });

    it("Should not allow non-owner to configure airdrops", async function () {
      const recipients = [await recipient1.getAddress()];
      const amounts = [500];

      const input = instance.createEncryptedInput(await secretAirdrop.getAddress(), await recipient1.getAddress());
      input.add32(amounts[0]);
      const encryptedInput = await input.encrypt();

      await expect(
        secretAirdrop.connect(recipient1).configureAirdrops(
          recipients,
          encryptedInput.handles,
          encryptedInput.inputProof
        )
      ).to.be.revertedWith("Only project owner can call this function");
    });
  });

  describe("Airdrop Claims", function () {
    it("Should allow recipient to claim their airdrop", async function () {
      await expect(
        secretAirdrop.connect(recipient1).claimAirdrop()
      ).to.emit(secretAirdrop, "AirdropClaimed");

      // Check that airdrop is marked as claimed
      expect(await secretAirdrop.hasClaimed(await recipient1.getAddress())).to.be.true;
    });

    it("Should not allow claiming the same airdrop twice", async function () {
      // recipient1 already claimed above
      await expect(
        secretAirdrop.connect(recipient1).claimAirdrop()
      ).to.emit(secretAirdrop, "Error");

      // Should still be marked as claimed
      expect(await secretAirdrop.hasClaimed(await recipient1.getAddress())).to.be.true;
    });

    it("Should allow other recipients to claim their airdrops", async function () {
      await expect(
        secretAirdrop.connect(recipient2).claimAirdrop()
      ).to.emit(secretAirdrop, "AirdropClaimed");

      await expect(
        secretAirdrop.connect(recipient3).claimAirdrop()
      ).to.emit(secretAirdrop, "AirdropClaimed");

      expect(await secretAirdrop.hasClaimed(await recipient2.getAddress())).to.be.true;
      expect(await secretAirdrop.hasClaimed(await recipient3.getAddress())).to.be.true;
    });

    it("Should not allow claiming for address without airdrop", async function () {
      const [, , , , nonRecipient] = await ethers.getSigners();
      
      await expect(
        secretAirdrop.connect(nonRecipient).claimAirdrop()
      ).to.emit(secretAirdrop, "Error");

      expect(await secretAirdrop.hasAirdrop(await nonRecipient.getAddress())).to.be.false;
    });
  });

  describe("Airdrop Information", function () {
    it("Should return airdrop amount for valid recipients", async function () {
      const amount = await secretAirdrop.getAirdropAmount(await recipient1.getAddress());
      expect(amount).to.not.be.undefined;
    });

    it("Should revert when getting airdrop amount for non-recipients", async function () {
      const [, , , , nonRecipient] = await ethers.getSigners();
      
      await expect(
        secretAirdrop.getAirdropAmount(await nonRecipient.getAddress())
      ).to.be.revertedWith("No airdrop configured for this address");
    });

    it("Should allow project owner to view total deposited", async function () {
      const totalDeposited = await secretAirdrop.connect(projectOwner).getTotalDeposited();
      expect(totalDeposited).to.not.be.undefined;
    });

    it("Should not allow non-owner to view total deposited", async function () {
      await expect(
        secretAirdrop.connect(recipient1).getTotalDeposited()
      ).to.be.revertedWith("Only project owner can view total deposited");
    });

    it("Should allow project owner to view total claimed", async function () {
      const totalClaimed = await secretAirdrop.connect(projectOwner).getTotalClaimed();
      expect(totalClaimed).to.not.be.undefined;
    });

    it("Should not allow non-owner to view total claimed", async function () {
      await expect(
        secretAirdrop.connect(recipient1).getTotalClaimed()
      ).to.be.revertedWith("Only project owner can view total claimed");
    });
  });

  describe("Error Handling", function () {
    it("Should track last error for users", async function () {
      // Try to claim with an address that has no airdrop
      const [, , , , nonRecipient] = await ethers.getSigners();
      
      await secretAirdrop.connect(nonRecipient).claimAirdrop();
      
      const lastError = await secretAirdrop.getLastError(await nonRecipient.getAddress());
      expect(lastError).to.not.be.undefined;
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow project owner to emergency withdraw", async function () {
      // First, let's deposit some additional tokens to test withdrawal
      const depositAmount = 5000;
      
      const input = instance.createEncryptedInput(await secretAirdrop.getAddress(), await projectOwner.getAddress());
      input.add32(depositAmount);
      const encryptedInput = await input.encrypt();

      await secretAirdrop.connect(projectOwner).depositTokens(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      // Now test emergency withdrawal
      await expect(
        secretAirdrop.connect(projectOwner).emergencyWithdraw(await projectOwner.getAddress())
      ).to.not.be.reverted;
    });

    it("Should not allow non-owner to emergency withdraw", async function () {
      await expect(
        secretAirdrop.connect(recipient1).emergencyWithdraw(await recipient1.getAddress())
      ).to.be.revertedWith("Only project owner can call this function");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle recipients and amounts length mismatch", async function () {
      const recipients = [await recipient1.getAddress()];
      const amounts = [1000, 2000]; // More amounts than recipients

      const input = instance.createEncryptedInput(await secretAirdrop.getAddress(), await projectOwner.getAddress());
      amounts.forEach(amount => input.add32(amount));
      const encryptedInput = await input.encrypt();

      await expect(
        secretAirdrop.connect(projectOwner).configureAirdrops(
          recipients,
          encryptedInput.handles,
          encryptedInput.inputProof
        )
      ).to.be.revertedWith("Recipients and amounts length mismatch");
    });

    it("Should handle index out of bounds for recipients", async function () {
      const recipientCount = await secretAirdrop.getRecipientCount();
      
      await expect(
        secretAirdrop.getRecipient(recipientCount)
      ).to.be.revertedWith("Index out of bounds");
    });

    it("Should allow updating existing airdrop amounts", async function () {
      const recipients = [await recipient1.getAddress()];
      const newAmounts = [5000]; // Updated amount

      const input = instance.createEncryptedInput(await secretAirdrop.getAddress(), await projectOwner.getAddress());
      input.add32(newAmounts[0]);
      const encryptedInput = await input.encrypt();

      await expect(
        secretAirdrop.connect(projectOwner).configureAirdrops(
          recipients,
          encryptedInput.handles,
          encryptedInput.inputProof
        )
      ).to.emit(secretAirdrop, "AirdropConfigured");

      // Should still have the same recipient count (no duplicate)
      expect(await secretAirdrop.getRecipientCount()).to.equal(3);
    });
  });
});