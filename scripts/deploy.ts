// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import moment from "moment";
import fs from "fs";

async function main() {
  // Set these token addresses accordingly
  // Token for IDO participants to send contributions. Example WONE
  const raiseTokenAddress = "0x7e41fF84f262a182C2928D4817220F47eb89aeCc";

  // Token being sold in IDO
  const offerTokenAddress = "0x80700bd2e18a9CE9B18510d0D5fccA83861E7680";

  // Addresses must deposit collateral to gain access to IDO. Example MON
  const collateralTokenAddress = "0x87a6eF2Ac2a6a3021f589fA86580312fA21fB118";

  // Change the times below to set start, end, claim for IDO
  const startTime = moment.utc("2022-04-15 00:00").unix();
  const endTime = moment.utc("2022-04-16 00:00").unix();
  const claimTime = moment.utc("2022-04-17 00:00").unix();

  const offeringAmount = ethers.utils.parseEther("100000");
  const raisingAmount = ethers.utils.parseEther("10000");
  const maxContributionAmount = ethers.utils.parseEther("1000");
  const adminAddress = (await ethers.getSigners())[0].address;
  const collateralAmount = ethers.utils.parseEther("1000");

  // We get the contract to deploy
  const SlothFiIDO = await ethers.getContractFactory("SlothFiIDO");
  const ido = await SlothFiIDO.deploy(
    raiseTokenAddress,
    offerTokenAddress,
    startTime,
    endTime,
    claimTime,
    offeringAmount,
    raisingAmount,
    maxContributionAmount,
    adminAddress,
    collateralTokenAddress,
    collateralAmount
  );

  await ido.deployed();

  await save(ido.address);
  console.log("SlothFiIDO deployed to:", ido.address);
}

async function save(address: string) {
  const config = `
  {
    "SlothFiIDO": "${address}"
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
