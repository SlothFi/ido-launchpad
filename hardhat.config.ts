import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import YAML from "yaml";
import moment from "moment";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import fs from "fs";
import { ethers } from "ethers";
// import * as deploy from "./scripts/tasks/deploy-factory";
// require("./scripts/tasks/deploy-factory.ts");

dotenv.config();

const privateKey = process.env.PRIVATE_KEY;
const privateKey2 = process.env.PRIVATE_KEY2;

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("deploy-factory", "Deploys a new IDO factory")
  .addParam("admin", "The admin account's address")
  .setAction(async (taskArgs, hre) => {
    const admin = taskArgs.admin;

    const SlothFiIDOFactory = await hre.ethers.getContractFactory(
      "SlothFiIDOFactory"
    );
    const factory = await SlothFiIDOFactory.deploy(admin);
    console.log("SlothFiIDOFactory deployed to ", factory.address);
    await save(factory.address, "slothfiido-factory.json");
  });

task("deploy-ido", "Deploys a new IDO using the specified IDO Factory")
  .addParam("factory", "The SlothFiIDOFactory factory address to use")
  .addParam("configfile", "The path to config yml file")
  .setAction(async (taskArgs, hre) => {
    const configPath = taskArgs.configfile;
    const file = fs.readFileSync(configPath, "utf8");
    const config = YAML.parse(file);
    console.log("config = ", config);

    const SlothFiIDOFactory = await hre.ethers.getContractFactory(
      "SlothFiIDOFactory"
    );
    const factory = SlothFiIDOFactory.attach(taskArgs.factory);
    const tx = await factory.createIDO(
      config.raiseTokenAddress,
      config.offerTokenAddress,
      moment.utc(config.startTime).unix(),
      moment.utc(config.endTime).unix(),
      moment.utc(config.claimTime).unix(),
      ethers.utils.parseEther(config.offeringAmount),
      ethers.utils.parseEther(config.raisingAmount),
      ethers.utils.parseEther(config.maxContributionAmount),
      config.adminAddress,
      config.collateralTokenAddress,
      ethers.utils.parseEther(config.collateralAmount)
    );
    const ido = await tx.wait();
    if (ido.events && ido.events.length) {
      const event: any = ido.events[0];
      console.log("IDO deployed at => ", event.args.contractAddress);
    }
  });

async function save(address: string, filename: string) {
  const config = `
    {
      "SlothFiIDOFactory": "${address}"
    }
  
    `;
  const data = JSON.stringify(config);
  const path = `./${filename}`;
  fs.writeFileSync(path, JSON.parse(data));
}

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  networks: {
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    harmonymain: {
      url: "https://api.harmony.one",
      accounts: privateKey && privateKey2 ? [privateKey, privateKey2] : [],
      chainId: 1666600000,
      gas: 8500000,
      gasPrice: 199000000000,
    },
    harmonytest: {
      url: "https://api.s0.b.hmny.io",
      accounts: privateKey && privateKey2 ? [privateKey, privateKey2] : [],
      chainId: 1666700000,
      gas: 8500000,
      gasPrice: 31000000000,
    },
    avalanchefuji: {
      // Infura
      url: `https://api.avax-test.network/ext/bc/C/rpc`,
      accounts: privateKey && privateKey2 ? [privateKey, privateKey2] : [],
      gas: 8000000,
      chainId: 43113,
      gasPrice: 225000000000, // 225 Gwei
      timeout: 120000,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
