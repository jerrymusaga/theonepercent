// GraphQL types matching the Envio schema
export interface Pool {
  id: string;
  creator: Creator;
  status: PoolStatus;
  entryFee: string; // BigInt as string
  maxPlayers: number;
  currentPlayers: number;
  prizePool: string; // BigInt as string
  currentRound: number;
  winner?: Player;
  prizeAmount?: string; // BigInt as string
  createdAt: string; // BigInt as string
  activatedAt?: string; // BigInt as string
  completedAt?: string; // BigInt as string
  createdAtBlock: string; // BigInt as string
  activatedAtBlock?: string; // BigInt as string
  completedAtBlock?: string; // BigInt as string
  chainId: number;
}

export interface Player {
  id: string;
  address: string;
  totalPoolsJoined: number;
  totalPoolsWon: number;
  totalPoolsEliminated: number;
  totalEarnings: string; // BigInt as string
  totalSpent: string; // BigInt as string
  firstJoinedAt: string; // BigInt as string
  lastActiveAt: string; // BigInt as string
}

export interface Creator {
  id: string;
  address: string;
  totalStaked: string; // BigInt as string
  totalEarned: string; // BigInt as string
  totalPoolsEligible: number;
  totalPoolsCreated: number;
  isVerified: boolean;
  verifiedAt?: string; // BigInt as string
  attestationId?: string;
  verificationBonusPools: number;
  completedPools: number;
  abandonedPools: number;
  firstStakedAt: string; // BigInt as string
  lastActiveAt: string; // BigInt as string
  chainId: number;
}

export interface PlayerPool {
  id: string;
  player: Player;
  pool: Pool;
  isEliminated: boolean;
  hasWon: boolean;
  eliminatedInRound?: number;
  joinedAt: string; // BigInt as string
  joinedAtBlock: string; // BigInt as string
  entryFeePaid: string; // BigInt as string
  prizeAmount?: string; // BigInt as string
  prizeClaimed: boolean;
  prizeClaimedAt?: string; // BigInt as string
}

export interface GameRound {
  id: string;
  pool: Pool;
  roundNumber: number;
  winningChoice: PlayerChoiceType;
  eliminatedCount: number;
  remainingCount: number;
  resolvedAt: string; // BigInt as string
  resolvedAtBlock: string; // BigInt as string
  headsCount: number;
  tailsCount: number;
}

export interface PlayerChoice {
  id: string;
  player: Player;
  pool: Pool;
  round: GameRound;
  choice: PlayerChoiceType;
  wasWinningChoice: boolean;
  madeAt: string; // BigInt as string
  madeAtBlock: string; // BigInt as string
}

export interface SystemStats {
  id: string;
  totalPoolsCreated: number;
  totalPoolsActive: number;
  totalPoolsCompleted: number;
  totalPoolsAbandoned: number;
  totalPlayers: number;
  totalPlayerJoins: number;
  totalVolumeProcessed: string; // BigInt as string
  totalPrizesAwarded: string; // BigInt as string
  totalCreatorRewards: string; // BigInt as string
  totalStaked: string; // BigInt as string
  totalProjectPool: string; // BigInt as string
  lastUpdatedAt: string; // BigInt as string
}

export interface NetworkStats {
  id: string;
  chainId: number;
  totalPools: number;
  activePools: number;
  completedPools: number;
  totalVolume: string; // BigInt as string
  totalPrizes: string; // BigInt as string
  totalStaked: string; // BigInt as string
  lastUpdatedAt: string; // BigInt as string
}

export enum PoolStatus {
  OPENED = 'OPENED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED'
}

export enum PlayerChoiceType {
  HEADS = 'HEADS',
  TAILS = 'TAILS'
}

export enum EventType {
  POOL_CREATED = 'POOL_CREATED',
  PLAYER_JOINED = 'PLAYER_JOINED',
  POOL_ACTIVATED = 'POOL_ACTIVATED',
  POOL_ABANDONED = 'POOL_ABANDONED',
  GAME_COMPLETED = 'GAME_COMPLETED',
  PLAYER_MADE_CHOICE = 'PLAYER_MADE_CHOICE',
  ROUND_RESOLVED = 'ROUND_RESOLVED',
  STAKE_DEPOSITED = 'STAKE_DEPOSITED',
  STAKE_WITHDRAWN = 'STAKE_WITHDRAWN',
  CREATOR_REWARD_CLAIMED = 'CREATOR_REWARD_CLAIMED',
  CREATOR_VERIFIED = 'CREATOR_VERIFIED',
  VERIFICATION_BONUS_APPLIED = 'VERIFICATION_BONUS_APPLIED',
  PROJECT_POOL_UPDATED = 'PROJECT_POOL_UPDATED',
  SCOPE_UPDATED = 'SCOPE_UPDATED',
  OWNERSHIP_TRANSFERRED = 'OWNERSHIP_TRANSFERRED'
}

// Query response types
export interface PoolsResponse {
  pools: Pool[];
}

export interface PoolResponse {
  pool: Pool | null;
}

export interface PlayersResponse {
  players: Player[];
}

export interface PlayerResponse {
  player: Player | null;
}

export interface CreatorsResponse {
  creators: Creator[];
}

export interface CreatorResponse {
  creator: Creator | null;
}

export interface SystemStatsResponse {
  systemStats: SystemStats | null;
}

export interface GameRoundsResponse {
  gameRounds: GameRound[];
}

export interface PlayerChoicesResponse {
  playerChoices: PlayerChoice[];
}

// Filter and sorting types
export interface PoolFilter {
  status?: PoolStatus;
  creator?: string;
  chainId?: number;
  entryFee_gte?: string;
  entryFee_lte?: string;
  currentPlayers_gte?: number;
  currentPlayers_lte?: number;
}

export interface PlayerFilter {
  address?: string;
  totalPoolsJoined_gte?: number;
  totalEarnings_gte?: string;
}

export interface CreatorFilter {
  address?: string;
  isVerified?: boolean;
  chainId?: number;
  totalStaked_gte?: string;
}

export type OrderDirection = 'asc' | 'desc';

export interface OrderBy {
  field: string;
  direction: OrderDirection;
}