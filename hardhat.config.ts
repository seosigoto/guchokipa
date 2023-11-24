import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const chainIds: { [key: string]: number } = {
  // ethereum
  mainnet: 1,
  goerli: 5,
  ropsten: 3,
  // other networks...
};

const PRIVATE_KEY: string = process.env.PK || "";
const ETHERSCAN_KEY: string = process.env.ETHERSCAN_KEY || "";
const TEST_ETH_RPC_URL: string | undefined = process.env.TEST_ETH_RPC_URL;
const ALCHEMY_API: string | undefined = process.env.ALCHEMY_API;

const config = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      // url: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API}`,
    },
    goerli: {
      url: "https://goerli.blockpi.network/v1/rpc/public",
      chainId: chainIds.goerli,
      accounts: [PRIVATE_KEY],
      gasMultiplier: 1.25,
    },
    // other networks...
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_KEY,
      goerli: ETHERSCAN_KEY,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  mocha: {
    timeout: 30000,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: false,
    strict: true,
  },
};

export default config;
