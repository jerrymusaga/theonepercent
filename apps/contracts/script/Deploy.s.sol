// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {CoinToss} from "../src/CoinToss.sol";

contract DeployScript is Script {
    // Celo Mainnet addresses
    address constant CELO_MAINNET_SELF_HUB = 0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF;
    bytes32 constant CELO_MAINNET_CONFIG_ID = 0x7b6436b0c98f62380866d9432c2af0ee08ce16a171bda6951aecd95ee1307d61;

    // Celo Alfajores Testnet addresses
    address constant CELO_TESTNET_SELF_HUB = 0x68c931C9a534D37aa78094877F46fE46a49F1A51;
    bytes32 constant CELO_TESTNET_CONFIG_ID = 0x7b6436b0c98f62380866d9432c2af0ee08ce16a171bda6951aecd95ee1307d61;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        uint256 scopeValue = vm.envUint("HASHED_SCOPE");

        console.log("Deploying from address:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("Using scope value:", scopeValue);

        vm.startBroadcast(deployerPrivateKey);

        CoinToss coinToss;

        // Deploy based on chain ID
        if (block.chainid == 42220) {
            // Celo Mainnet
            console.log("Deploying to Celo Mainnet...");
            coinToss = new CoinToss(
                CELO_MAINNET_SELF_HUB,
                scopeValue,
                CELO_MAINNET_CONFIG_ID
            );
        } else if (block.chainid == 44787) {
            // Celo Alfajores Testnet
            console.log("Deploying to Celo Alfajores Testnet...");
            coinToss = new CoinToss(
                CELO_TESTNET_SELF_HUB,
                scopeValue,
                CELO_TESTNET_CONFIG_ID
            );
        } else {
            // Local/Other networks - use mock addresses
            console.log("Deploying to local/other network...");
            coinToss = new CoinToss(
                address(0x1234567890123456789012345678901234567890), // Mock hub
                scopeValue,
                CELO_TESTNET_CONFIG_ID
            );
        }

        vm.stopBroadcast();

        console.log("CoinToss deployed at:", address(coinToss));
        console.log("Deployment completed successfully!");

        // Verify deployment
        console.log("Verifying deployment...");
        console.log("Owner:", coinToss.owner());
        console.log("Base Stake:", coinToss.BASE_STAKE());
        console.log("Max Stake Allowed:", coinToss.MAX_STAKE_ALLOWED());
    }
}