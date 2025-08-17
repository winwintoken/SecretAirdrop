import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying contracts with deployer:", deployer);

  // Deploy GameCoin first
  const initialSupply = ethers.parseEther("1000000"); // 1 million tokens
  const deployedGameCoin = await deploy("GameCoin", {
    from: deployer,
    args: ["Game Coin", "GAME", initialSupply],
    log: true,
  });
  console.log(`GameCoin contract deployed at: ${deployedGameCoin.address}`);

  // Deploy ConfidentialToken wrapper
  const deployedConfidentialToken = await deploy("ConfidentialToken", {
    from: deployer,
    args: [
      deployedGameCoin.address, // underlying token
      "Confidential Game Token", // name
      "cGAME", // symbol
      "https://example.com/token-metadata" // tokenURI
    ],
    log: true,
  });
  console.log(`ConfidentialToken contract deployed at: ${deployedConfidentialToken.address}`);

  // Deploy SecretAirdrop contract
  const deployedSecretAirdrop = await deploy("SecretAirdrop", {
    from: deployer,
    args: [deployedConfidentialToken.address],
    log: true,
  });
  console.log(`SecretAirdrop contract deployed at: ${deployedSecretAirdrop.address}`);

  console.log("\nDeployment Summary:");
  console.log("==================");
  console.log(`GameCoin: ${deployedGameCoin.address}`);
  console.log(`ConfidentialToken: ${deployedConfidentialToken.address}`);
  console.log(`SecretAirdrop: ${deployedSecretAirdrop.address}`);
};

export default func;
func.id = "deploy_secretAirdrop";
func.tags = ["SecretAirdrop"];
