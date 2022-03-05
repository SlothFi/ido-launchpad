// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  const raiseTokenAddress = "0x7e41fF84f262a182C2928D4817220F47eb89aeCc";
  const offerTokenAddress = "0x80700bd2e18a9CE9B18510d0D5fccA83861E7680";
  const collateralTokenAddress = "0x87a6eF2Ac2a6a3021f589fA86580312fA21fB118";

  const currentBlock = (await ethers.provider.getBlock("latest")).number;
  const startBlock = currentBlock + 10;
  const endBlock = currentBlock + 100;
  const claimBlock = currentBlock + 110;
  const offeringAmount = ethers.utils.parseEther("100");
  const raisingAmount = ethers.utils.parseEther("100");
  const adminAddress = (await ethers.getSigners())[0].address;
  const collateralAmount = ethers.utils.parseEther("100");

  // We get the contract to deploy
  const SlothIDO = await ethers.getContractFactory("SlothIDO");
  console.log("adminaddress = ", adminAddress);
  const ido = await SlothIDO.deploy(
    raiseTokenAddress,
    offerTokenAddress,
    startBlock,
    endBlock,
    claimBlock,
    offeringAmount,
    raisingAmount,
    adminAddress,
    collateralTokenAddress,
    collateralAmount
  );

  await ido.deployed();

  await save(ido.address);
  console.log("SlothIDO deployed to:", ido.address);
}

async function save(address: string) {
  const config = `
  {
    "priceConsumer": "${address}"
  }

  `;
  const data = JSON.stringify(config);
  const filename = `./address.json`;
  fs.writeFileSync(filename, JSON.parse(data));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
