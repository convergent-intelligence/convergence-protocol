require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.startsWith('0x') && process.env.PRIVATE_KEY.length === 66)
        ? [process.env.PRIVATE_KEY]
        : [],
      chainId: 11155111
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.startsWith('0x') && process.env.PRIVATE_KEY.length === 66)
        ? [process.env.PRIVATE_KEY]
        : [],
      chainId: 1
    },
    base: {
      url: "https://mainnet.base.org",
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.startsWith('0x') && process.env.PRIVATE_KEY.length === 66)
        ? [process.env.PRIVATE_KEY]
        : [],
      chainId: 8453,
      gasPrice: 1000000000
    },
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.startsWith('0x') && process.env.PRIVATE_KEY.length === 66)
        ? [process.env.PRIVATE_KEY]
        : [],
      chainId: 84532
    }
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_KEY || "",
      sepolia: process.env.ETHERSCAN_KEY || "",
      base: process.env.BASESCAN_KEY || "",
      baseSepolia: process.env.BASESCAN_KEY || ""
    },
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org"
        }
      },
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
