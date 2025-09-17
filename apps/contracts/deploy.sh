#!/bin/bash

# CoinToss Contract Deployment Script
# Usage: ./deploy.sh [testnet|mainnet|local]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    print_status "Please copy .env.example to .env and fill in your values:"
    print_status "cp .env.example .env"
    exit 1
fi

# Load environment variables
source .env

# Check if private key is set
if [ -z "$PRIVATE_KEY" ] || [ "$PRIVATE_KEY" = "your_private_key_here" ]; then
    print_error "PRIVATE_KEY not set in .env file!"
    exit 1
fi

# Function to deploy to testnet
deploy_testnet() {
    print_status "Deploying to Celo Alfajores Testnet..."

    if [ -z "$CELO_ALFAJORES_RPC" ]; then
        print_error "CELO_ALFAJORES_RPC not set in .env file!"
        exit 1
    fi

    print_warning "Make sure you have testnet CELO in your wallet!"
    print_status "Testnet faucet: https://faucet.celo.org/"

    forge script script/DeployTestnet.s.sol \
        --rpc-url $CELO_ALFAJORES_RPC \
        --broadcast \
        --verify \
        --etherscan-api-key $CELOSCAN_API_KEY \
        -vvvv

    print_success "Testnet deployment completed!"
}

# Function to deploy to mainnet
deploy_mainnet() {
    print_warning "⚠️  MAINNET DEPLOYMENT WARNING ⚠️"
    print_warning "You are about to deploy to Celo Mainnet with real CELO!"
    print_warning "This will cost real gas fees!"

    read -p "Are you absolutely sure you want to deploy to mainnet? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        print_status "Mainnet deployment cancelled."
        exit 0
    fi

    print_status "Deploying to Celo Mainnet..."

    if [ -z "$CELO_MAINNET_RPC" ]; then
        print_error "CELO_MAINNET_RPC not set in .env file!"
        exit 1
    fi

    forge script script/DeployMainnet.s.sol \
        --rpc-url $CELO_MAINNET_RPC \
        --broadcast \
        --verify \
        --etherscan-api-key $CELOSCAN_API_KEY \
        -vvvv

    print_success "🎉 Mainnet deployment completed!"
    print_warning "Remember to:"
    print_warning "1. Verify the contract on the block explorer"
    print_warning "2. Update your frontend with the new contract address"
    print_warning "3. Test all functions with small amounts first"
}

# Function to deploy locally
deploy_local() {
    print_status "Deploying to local network..."

    # Start local anvil if not running
    if ! pgrep -f anvil > /dev/null; then
        print_status "Starting local Anvil node..."
        anvil --host 0.0.0.0 --port 8545 &
        sleep 3
    fi

    forge script script/Deploy.s.sol \
        --rpc-url http://localhost:8545 \
        --broadcast \
        -vvvv

    print_success "Local deployment completed!"
}

# Main deployment logic
case "$1" in
    testnet)
        deploy_testnet
        ;;
    mainnet)
        deploy_mainnet
        ;;
    local)
        deploy_local
        ;;
    *)
        print_error "Usage: $0 [testnet|mainnet|local]"
        print_status "Examples:"
        print_status "  $0 testnet  - Deploy to Celo Alfajores testnet"
        print_status "  $0 mainnet  - Deploy to Celo mainnet"
        print_status "  $0 local    - Deploy to local Anvil network"
        exit 1
        ;;
esac