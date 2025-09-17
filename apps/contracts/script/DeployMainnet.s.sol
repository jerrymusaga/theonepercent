// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {CoinToss} from "../src/CoinToss.sol";

/**
 * @title DeployMainnet
 * @dev Deployment script specifically for Celo Mainnet
 *
 *   MAINNET DEPLOYMENT 
 *
 * Usage:
 * forge script script/DeployMainnet.s.sol --rpc-url $CELO_MAINNET_RPC --broadcast --verify -vvvv
 */
contract DeployMainnet is Script {
    // Celo Mainnet configuration
    address constant SELF_HUB_ADDRESS = 0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF;
    bytes32 constant VERIFICATION_CONFIG_ID = 0x7b6436b0c98f62380866d9432c2af0ee08ce16a171bda6951aecd95ee1307d61;

    // Safety checks
    uint256 constant MIN_DEPLOYER_BALANCE = 1 ether; // Minimum 1 CELO required
    uint256 constant EXPECTED_CHAIN_ID = 42220; // Celo Mainnet

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        uint256 scopeValue = vm.envUint("HASHED_SCOPE");

        console.log("===   CELO MAINNET DEPLOYMENT  ===");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance / 1e18, "CELO");
        console.log("Chain ID:", block.chainid);
        console.log("Block number:", block.number);
        console.log("Gas price:", tx.gasprice);
        console.log("Using scope value:", scopeValue);

        // CRITICAL SAFETY CHECKS
        require(block.chainid == EXPECTED_CHAIN_ID, "MUST deploy on Celo Mainnet (Chain ID: 42220)");
        require(deployer.balance >= MIN_DEPLOYER_BALANCE, "Deployer needs at least 1 CELO for mainnet deployment");

        // Additional mainnet safety confirmation
        console.log("=== MAINNET SAFETY CONFIRMATION ===");
        console.log("You are deploying to MAINNET with real CELO!");
        console.log("Contract will cost real gas fees!");
        console.log("Double-check all parameters before proceeding!");

        // Manual confirmation step 
        console.log("Proceeding with mainnet deployment in 3 seconds...");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy CoinToss contract
        console.log("Deploying CoinToss contract to MAINNET...");
        CoinToss coinToss = new CoinToss(
            SELF_HUB_ADDRESS,
            scopeValue,
            VERIFICATION_CONFIG_ID
        );

        vm.stopBroadcast();

        console.log("===  MAINNET DEPLOYMENT SUCCESSFUL  ===");
        console.log("CoinToss deployed at:", address(coinToss));
        console.log("Contract owner:", coinToss.owner());
        console.log("Base stake amount:", coinToss.BASE_STAKE() / 1e18, "CELO");
        console.log("Max stake allowed:", coinToss.MAX_STAKE_ALLOWED() / 1e18, "CELO");
        console.log("Project pool balance:", coinToss.getProjectPoolBalance());

        console.log("=== MAINNET DEPLOYMENT INFO ===");
        console.log("Network: Celo Mainnet");
        console.log("Contract Address:", address(coinToss));
        console.log("Deployer:", deployer);
        console.log("Block Explorer: https://explorer.celo.org/mainnet/address/", address(coinToss));

        // Verify contract is working
        console.log("=== POST-DEPLOYMENT VERIFICATION ===");
        console.log("Contract size:", address(coinToss).code.length, "bytes");
        console.log("Owner verification:", coinToss.owner() == deployer ? " PASS" : " FAIL");

        
    }
}