// scripts/deploy.js

const hre = require("hardhat");

async function main() {
  // Fetch the contract to deploy
  const Game = await hre.ethers.getContractFactory("Game");

  // Set the initial participation fee (adjust as needed)
  const initialParticipationFee = hre.ethers.utils.parseEther("0.1"); // 0.1 ETH

  // Deploy the contract
  const game = await Game.deploy(initialParticipationFee);

  await game.deployed();

  console.log("Game deployed to:", game.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
