const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying contracts to Sepolia network...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");

    // Deploy GameCoin first
    const initialSupply = ethers.parseEther("1000000"); // 1 million tokens
    console.log("Deploying GameCoin...");
    const GameCoin = await ethers.getContractFactory("GameCoin");
    const gameCoin = await GameCoin.deploy("Game Coin", "GAME", initialSupply);
    await gameCoin.waitForDeployment();
    const gameCoinAddress = await gameCoin.getAddress();
    console.log(`GameCoin deployed to: ${gameCoinAddress}`);

    // Deploy ConfidentialToken wrapper
    console.log("Deploying ConfidentialToken...");
    const ConfidentialToken = await ethers.getContractFactory("ConfidentialToken");
    const confidentialToken = await ConfidentialToken.deploy(
        gameCoinAddress, // underlying token
        "Confidential Game Token", // name
        "cGAME", // symbol
        "https://example.com/token-metadata" // tokenURI
    );
    await confidentialToken.waitForDeployment();
    const confidentialTokenAddress = await confidentialToken.getAddress();
    console.log(`ConfidentialToken deployed to: ${confidentialTokenAddress}`);

    // Deploy SecretAirdrop contract
    console.log("Deploying SecretAirdrop...");
    const SecretAirdrop = await ethers.getContractFactory("SecretAirdrop");
    const secretAirdrop = await SecretAirdrop.deploy(confidentialTokenAddress);
    await secretAirdrop.waitForDeployment();
    const secretAirdropAddress = await secretAirdrop.getAddress();
    console.log(`SecretAirdrop deployed to: ${secretAirdropAddress}`);

    console.log("\n=== Deployment Summary ===");
    console.log("Network: Sepolia");
    console.log(`GameCoin: ${gameCoinAddress}`);
    console.log(`ConfidentialToken: ${confidentialTokenAddress}`);
    console.log(`SecretAirdrop: ${secretAirdropAddress}`);
    
    console.log("\n=== Next Steps ===");
    console.log("1. 项目方需要先mint GameCoin代币");
    console.log("2. 调用ConfidentialToken的wrap功能包装成加密代币");
    console.log("3. 将加密代币存入SecretAirdrop合约");
    console.log("4. 设置空投参数和接收者地址");
    console.log("5. 用户可以通过前端页面领取空投");
    
    console.log("\n=== Contract Verification ===");
    console.log("Run the following commands to verify contracts:");
    console.log(`npx hardhat verify --network sepolia ${gameCoinAddress} "Game Coin" "GAME" "${initialSupply}"`);
    console.log(`npx hardhat verify --network sepolia ${confidentialTokenAddress} "${gameCoinAddress}" "Confidential Game Token" "cGAME" "https://example.com/token-metadata"`);
    console.log(`npx hardhat verify --network sepolia ${secretAirdropAddress} "${confidentialTokenAddress}"`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });