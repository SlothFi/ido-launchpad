import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

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
