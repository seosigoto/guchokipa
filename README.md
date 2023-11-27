# Rock Paper Scissors Game - Solidity Smart Contract

## Project Overview

- This Hardhat project contains a Solidity smart contract for a Rock Paper Scissors game.
- The contract allows players to initialize games, join games, judge the winner, cancel games, and configure participation fees.
- The project includes test scripts, a deployment script, and instructions for contract verification.

## Getting Started

### Prerequisites

- [Node.js v18](https://nodejs.org/en/)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- An Ethereum wallet with a private key
- An [Alchemy](https://www.alchemy.com/) or [Infura](https://www.infura.io/) account for Ethereum node access

### installation

```bash
npm install
// or
yarn install
```

### .env

create .env file based on .env.example file;
and add needed keys like as follow:

```bash
PK=your_private_key
ETHERSCAN_KEY=your_etherscan_api_key
ALCHEMY_API_Sepolia=your_alchemy_api_key
```

### Compile Contracts

```bash
npx hardhat compile
```

### Running Tests

- You can run test by running following command:

```bash
npx hardhat test
```

- Please check this screenshot:
  ![image](https://github.com/seosigoto/guchokipa/assets/74290267/2be8f2a9-72cb-4c12-8c21-d42ec0adff32)


### Deployment

```bash
npx hardhat run --network sepolia scripts/deploy.ts
```

### Contract Verification

```bash
npx hardhat verify --network sepolia [deployed_contract_address] [constructor_arguments]
```

example:
https://goerli.etherscan.io/address/0x865628502D911Fc2773EFF88E8b2fA9b60265382
https://sepolia.etherscan.io/address/0x681D09e6e5A99Ea1A9e9612AB2f41B4c0313e2f2#code
