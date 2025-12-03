// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {TheOnePercent} from "../src/TheOnePercent.sol";

/**
 * @title DeployTestnet
 * @dev Deployment script specifically for Celo Alfajores Testnet
 *
 * Usage:
 * forge script script/DeployTestnet.s.sol --rpc-url $CELO_ALFAJORES_RPC --broadcast --verify -vvvv
 */
contract DeployTestnet is Script {
    // Celo Alfajores Testnet configuration
    address constant SELF_HUB_ADDRESS = 0x68c931C9a534D37aa78094877F46fE46a49F1A51;
    bytes32 constant VERIFICATION_CONFIG_ID = 0x7b6436b0c98f62380866d9432c2af0ee08ce16a171bda6951aecd95ee1307d61;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        uint256 scopeValue = vm.envUint("HASHED_SCOPE");

        console.log("=== CELO ALFAJORES TESTNET DEPLOYMENT ===");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance / 1e18, "CELO");
        console.log("Chain ID:", block.chainid);
        console.log("Block number:", block.number);
        console.log("Using scope value:", scopeValue);

        // Verify we're on the correct network
        require(block.chainid == 44787, "Must deploy on Celo Alfajores Testnet (Chain ID: 44787)");

        // Check deployer has enough balance
        require(deployer.balance >= 0.1 ether, "Deployer needs at least 0.1 CELO for deployment");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy TheOnePercent contract
        console.log("Deploying TheOnePercent contract...");
        TheOnePercent theOnePercent = new TheOnePercent(
            SELF_HUB_ADDRESS,
            scopeValue,
            VERIFICATION_CONFIG_ID
        );

        vm.stopBroadcast();

        console.log("=== DEPLOYMENT SUCCESSFUL ===");
        console.log("TheOnePercent deployed at:", address(theOnePercent));
        console.log("Contract owner:", theOnePercent.owner());
        console.log("Base stake amount:", theOnePercent.BASE_STAKE() / 1e18, "CELO");
        console.log("Max stake allowed:", theOnePercent.MAX_STAKE_ALLOWED() / 1e18, "CELO");
        console.log("Project pool balance:", theOnePercent.getProjectPoolBalance());

        console.log("=== DEPLOYMENT INFO ===");
        console.log("Network: Celo Alfajores Testnet");
        console.log("Contract Address:", address(theOnePercent));
        console.log("Deployer:", deployer);
        console.log("Transaction Hash: Check terminal output above");
        console.log("Block Explorer: https://explorer.celo.org/alfajores/address/", address(theOnePercent));

        // Save deployment info to file
        string memory deploymentInfo = string(abi.encodePacked(
            "TheOnePercent Testnet Deployment\n",
            "==========================\n",
            "Network: Celo Alfajores Testnet\n",
            "Contract Address: ", vm.toString(address(theOnePercent)), "\n",
            "Deployer: ", vm.toString(deployer), "\n",
            "Self Hub: ", vm.toString(SELF_HUB_ADDRESS), "\n",
            "Scope: ", vm.toString(scopeValue), "\n",
            "Config ID: ", vm.toString(VERIFICATION_CONFIG_ID), "\n"
        ));

        // vm.writeFile("./deployments/testnet-deployment.txt", deploymentInfo);
        // console.log("Deployment info saved to: ./deployments/testnet-deployment.txt");
        console.log("=== DEPLOYMENT COMPLETE ===");
    }
}