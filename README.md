# IDO Contracts

This folder contains IDO contracts. 

To run
## Install dependencies
`npm install`

`npx hardhat compile`

## Run tests
`npx hardhat test`


## Deploy contracts to testnet
`npx hardhat run ./scripts/deploy.ts --network harmonymain`

## Deploy IDO factory 
`npx hardhat deploy-ido --admin "address of factory admin" --network "networkName"`

## Deploy IDO 
To deploy a new IDO, edit the `ido-config.yaml` file in the root directory of project. 
Note:
- Contract addresses must be valid ERC20 contract addresses
- All times should be in UTC in `yyyy-MM-dd hh:mm` format.
- All amount values are in ether unit (10^18)
After editing the config file, run:

`npx hardhat deploy-ido --factory "factoryAddress" --configfile ./ido-config.yaml --network "networkName"`