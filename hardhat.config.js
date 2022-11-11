require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-web3');
require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-etherscan');
require('hardhat-deploy');
require('hardhat-deploy-ethers');
require('hardhat-contract-sizer');
require('hardhat-gas-reporter');
require('@float-capital/solidity-coverage');
require('dotenv').config();

module.exports = {
  networks: {
    hardhat: {
			forking: {
				url: process.env.ALCHEMY_URL,
        enabled: false,
        blockNumber: 15395600
			}
    }
  },
  solidity: {
    version: '0.8.17',
    settings: {
      optimizer: {
        enabled: true,
        runs: 7777,
      }
    }
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: false,
  }
}
