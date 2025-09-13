// Contract configuration and ABI for CoinToss
export const CONTRACT_CONFIG = {
  // Contract addresses - update these when deployed
  addresses: {
    [42220]: '0x...', // Celo Mainnet
    [44787]: '0x...', // Celo Alfajores Testnet
  },
  abi: [
    {
      "type": "constructor",
      "inputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "BASE_STAKE",
      "inputs": [],
      "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "CREATOR_REWARD_PERCENTAGE",
      "inputs": [],
      "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "MAX_STAKE_ALLOWED",
      "inputs": [],
      "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "PENALTY_PERCENTAGE",
      "inputs": [],
      "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "POOL_MULTIPLIER",
      "inputs": [],
      "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "activatePool",
      "inputs": [{"name": "_poolId", "type": "uint256", "internalType": "uint256"}],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "areAllPoolsCompleted",
      "inputs": [{"name": "_creator", "type": "address", "internalType": "address"}],
      "outputs": [{"name": "", "type": "bool", "internalType": "bool"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "calculateCreatorReward",
      "inputs": [{"name": "_creator", "type": "address", "internalType": "address"}],
      "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "calculatePoolsEligible",
      "inputs": [{"name": "stakeAmount", "type": "uint256", "internalType": "uint256"}],
      "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
      "stateMutability": "pure"
    },
    {
      "type": "function",
      "name": "canActivatePool",
      "inputs": [{"name": "_poolId", "type": "uint256", "internalType": "uint256"}],
      "outputs": [{"name": "", "type": "bool", "internalType": "bool"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "claimPrize",
      "inputs": [{"name": "_poolId", "type": "uint256", "internalType": "uint256"}],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "claimRefundFromAbandonedPool",
      "inputs": [{"name": "_poolId", "type": "uint256", "internalType": "uint256"}],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "createPool",
      "inputs": [
        {"name": "_entryFee", "type": "uint256", "internalType": "uint256"},
        {"name": "_maxPlayers", "type": "uint256", "internalType": "uint256"}
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "currentPoolId",
      "inputs": [],
      "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getCreatedPools",
      "inputs": [{"name": "_creator", "type": "address", "internalType": "address"}],
      "outputs": [{"name": "", "type": "uint256[]", "internalType": "uint256[]"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getCreatorInfo",
      "inputs": [{"name": "_creator", "type": "address", "internalType": "address"}],
      "outputs": [
        {"name": "stakedAmount", "type": "uint256", "internalType": "uint256"},
        {"name": "poolsCreated", "type": "uint256", "internalType": "uint256"},
        {"name": "poolsRemaining", "type": "uint256", "internalType": "uint256"},
        {"name": "hasActiveStake", "type": "bool", "internalType": "bool"}
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getCurrentRound",
      "inputs": [{"name": "_poolId", "type": "uint256", "internalType": "uint256"}],
      "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getGameProgress",
      "inputs": [{"name": "_poolId", "type": "uint256", "internalType": "uint256"}],
      "outputs": [
        {"name": "currentRound", "type": "uint256", "internalType": "uint256"},
        {"name": "remainingPlayersCount", "type": "uint256", "internalType": "uint256"},
        {"name": "totalPlayersCount", "type": "uint256", "internalType": "uint256"},
        {"name": "isGameComplete", "type": "bool", "internalType": "bool"}
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getPlayerChoice",
      "inputs": [
        {"name": "_poolId", "type": "uint256", "internalType": "uint256"},
        {"name": "_player", "type": "address", "internalType": "address"}
      ],
      "outputs": [{"name": "", "type": "uint8", "internalType": "enum CoinToss.PlayerChoice"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getPoolInfo",
      "inputs": [{"name": "_poolId", "type": "uint256", "internalType": "uint256"}],
      "outputs": [
        {"name": "creator", "type": "address", "internalType": "address"},
        {"name": "entryFee", "type": "uint256", "internalType": "uint256"},
        {"name": "maxPlayers", "type": "uint256", "internalType": "uint256"},
        {"name": "currentPlayers", "type": "uint256", "internalType": "uint256"},
        {"name": "prizePool", "type": "uint256", "internalType": "uint256"},
        {"name": "status", "type": "uint8", "internalType": "enum CoinToss.PoolStatus"}
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getRemainingPlayers",
      "inputs": [{"name": "_poolId", "type": "uint256", "internalType": "uint256"}],
      "outputs": [{"name": "", "type": "address[]", "internalType": "address[]"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "hasPlayerChosen",
      "inputs": [
        {"name": "_poolId", "type": "uint256", "internalType": "uint256"},
        {"name": "_player", "type": "address", "internalType": "address"}
      ],
      "outputs": [{"name": "", "type": "bool", "internalType": "bool"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "isPlayerEliminated",
      "inputs": [
        {"name": "_poolId", "type": "uint256", "internalType": "uint256"},
        {"name": "_player", "type": "address", "internalType": "address"}
      ],
      "outputs": [{"name": "", "type": "bool", "internalType": "bool"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "isPoolAbandoned",
      "inputs": [{"name": "_poolId", "type": "uint256", "internalType": "uint256"}],
      "outputs": [{"name": "", "type": "bool", "internalType": "bool"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "joinPool",
      "inputs": [{"name": "_poolId", "type": "uint256", "internalType": "uint256"}],
      "outputs": [],
      "stateMutability": "payable"
    },
    {
      "type": "function",
      "name": "makeSelection",
      "inputs": [
        {"name": "_poolId", "type": "uint256", "internalType": "uint256"},
        {"name": "_choice", "type": "uint8", "internalType": "enum CoinToss.PlayerChoice"}
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "stakeForPoolCreation",
      "inputs": [],
      "outputs": [],
      "stateMutability": "payable"
    },
    {
      "type": "function",
      "name": "unstakeAndClaim",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "event",
      "name": "PoolCreated",
      "inputs": [
        {"name": "poolId", "type": "uint256", "indexed": true, "internalType": "uint256"},
        {"name": "creator", "type": "address", "indexed": true, "internalType": "address"},
        {"name": "entryFee", "type": "uint256", "indexed": false, "internalType": "uint256"},
        {"name": "maxPlayers", "type": "uint256", "indexed": false, "internalType": "uint256"}
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "PlayerJoined",
      "inputs": [
        {"name": "poolId", "type": "uint256", "indexed": true, "internalType": "uint256"},
        {"name": "player", "type": "address", "indexed": true, "internalType": "address"},
        {"name": "currentPlayers", "type": "uint256", "indexed": false, "internalType": "uint256"},
        {"name": "maxPlayers", "type": "uint256", "indexed": false, "internalType": "uint256"}
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "PoolActivated",
      "inputs": [
        {"name": "poolId", "type": "uint256", "indexed": true, "internalType": "uint256"},
        {"name": "totalPlayers", "type": "uint256", "indexed": false, "internalType": "uint256"},
        {"name": "prizePool", "type": "uint256", "indexed": false, "internalType": "uint256"}
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "PlayerMadeChoice",
      "inputs": [
        {"name": "poolId", "type": "uint256", "indexed": true, "internalType": "uint256"},
        {"name": "player", "type": "address", "indexed": true, "internalType": "address"},
        {"name": "choice", "type": "uint8", "indexed": false, "internalType": "enum CoinToss.PlayerChoice"},
        {"name": "round", "type": "uint256", "indexed": false, "internalType": "uint256"}
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "RoundResolved",
      "inputs": [
        {"name": "poolId", "type": "uint256", "indexed": true, "internalType": "uint256"},
        {"name": "round", "type": "uint256", "indexed": false, "internalType": "uint256"},
        {"name": "winningChoice", "type": "uint8", "indexed": false, "internalType": "enum CoinToss.PlayerChoice"},
        {"name": "eliminatedCount", "type": "uint256", "indexed": false, "internalType": "uint256"},
        {"name": "remainingCount", "type": "uint256", "indexed": false, "internalType": "uint256"}
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "GameCompleted",
      "inputs": [
        {"name": "poolId", "type": "uint256", "indexed": true, "internalType": "uint256"},
        {"name": "winner", "type": "address", "indexed": true, "internalType": "address"},
        {"name": "prizeAmount", "type": "uint256", "indexed": false, "internalType": "uint256"}
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "StakeDeposited",
      "inputs": [
        {"name": "creator", "type": "address", "indexed": true, "internalType": "address"},
        {"name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256"},
        {"name": "poolsEligible", "type": "uint256", "indexed": false, "internalType": "uint256"}
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "StakeWithdrawn",
      "inputs": [
        {"name": "creator", "type": "address", "indexed": true, "internalType": "address"},
        {"name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256"},
        {"name": "penalty", "type": "uint256", "indexed": false, "internalType": "uint256"}
      ],
      "anonymous": false
    }
  ] as const
} as const;

// Enums from the contract
export enum PlayerChoice {
  NONE = 0,
  HEADS = 1,
  TAILS = 2
}

export enum PoolStatus {
  OPENED = 0,
  ACTIVE = 1,
  COMPLETED = 2,
  ABANDONED = 3
}

// Contract constants
export const CONTRACT_CONSTANTS = {
  BASE_STAKE: '5000000000000000000', // 5 CELO in wei
  MAX_STAKE_ALLOWED: '50000000000000000000', // 50 CELO in wei
  PENALTY_PERCENTAGE: 30,
  CREATOR_REWARD_PERCENTAGE: 5,
  POOL_MULTIPLIER: 100
} as const;

// Type definitions
export interface PoolInfo {
  creator: `0x${string}`;
  entryFee: bigint;
  maxPlayers: bigint;
  currentPlayers: bigint;
  prizePool: bigint;
  status: PoolStatus;
}

export interface CreatorInfo {
  stakedAmount: bigint;
  poolsCreated: bigint;
  poolsRemaining: bigint;
  hasActiveStake: boolean;
}

export interface GameProgress {
  currentRound: bigint;
  remainingPlayersCount: bigint;
  totalPlayersCount: bigint;
  isGameComplete: boolean;
}