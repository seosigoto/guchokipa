# Rock Paper Scissors Game - Solidity Smart Contract

## Project Overview

This Hardhat project contains a Solidity smart contract for a Rock Paper Scissors game. The contract allows players to initialize games, join games, judge the winner, cancel games, and configure participation fees. The project includes test scripts, a deployment script, and instructions for contract verification.

## Getting Started

### Prerequisites

- Node.js
- npm or yarn
- An Ethereum wallet with a private key
- An Alchemy or Infura account for Ethereum node access

### installation

when use npm : npm install

### .env

create .env file based on .env.example file;
and add needed keys like as follow:

PK=your_private_key
ETHERSCAN_KEY=your_etherscan_api_key
ALCHEMY_API=your_alchemy_api_key

### Compile Contracts

npx hardhat compile

### Running Tests

npx hardhat test

### Deployment

npx hardhat run --network goerli scripts/deploy.js

### Contract Verification

npx hardhat verify --network goerli [deployed_contract_address] [constructor_arguments]

example:
https://goerli.etherscan.io/address/0x643bc0Ea2209B43858f8EAd81dA7510e88914b8e#code
