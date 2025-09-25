import {
  CoinToss,
  Pool,
  Player,
  Creator,
  PlayerPool,
  GameRound,
  PlayerChoice,
  StakeEvent,
  Event,
  SystemStats,
  NetworkStats,
  PoolStatus,
  PlayerChoiceType,
  StakeEventType,
  EventType,
} from "generated";

// Helper function to generate unique IDs
function generateId(...parts: (string | number | bigint)[]): string {
  return parts.map(p => p.toString()).join('-');
}

// Helper function to update system stats
async function updateSystemStats(context: any, chainId: number) {
  let systemStats = await context.SystemStats.get("system");

  if (!systemStats) {
    systemStats = {
      id: "system",
      totalPoolsCreated: 0,
      totalPoolsActive: 0,
      totalPoolsCompleted: 0,
      totalPoolsAbandoned: 0,
      totalPlayers: 0,
      totalPlayerJoins: 0,
      totalVolumeProcessed: 0n,
      totalPrizesAwarded: 0n,
      totalCreatorRewards: 0n,
      totalStaked: 0n,
      totalProjectPool: 0n,
      lastUpdatedAt: BigInt(Date.now()),
    };
  }

  // Update network-specific stats
  const networkStatsId = chainId.toString();
  let networkStats = await context.NetworkStats.get(networkStatsId);

  if (!networkStats) {
    networkStats = {
      id: networkStatsId,
      chainId,
      totalPools: 0,
      activePools: 0,
      completedPools: 0,
      totalVolume: 0n,
      totalPrizes: 0n,
      totalStaked: 0n,
      lastUpdatedAt: BigInt(Date.now()),
    };
  }

  systemStats.lastUpdatedAt = BigInt(Date.now());
  networkStats.lastUpdatedAt = BigInt(Date.now());

  context.SystemStats.set(systemStats);
  context.NetworkStats.set(networkStats);

  return { systemStats, networkStats };
}

// PoolCreated Event Handler
CoinToss.PoolCreated.handler(async ({ event, context }) => {
  const { poolId, creator, entryFee, maxPlayers } = event.params;
  const { block, transaction, chainId } = event;

  // Create or update creator
  let creatorEntity = await context.Creator.get(creator);
  if (!creatorEntity) {
    creatorEntity = {
      id: creator,
      address: creator,
      totalStaked: 0n,
      totalEarned: 0n,
      totalPoolsEligible: 0,
      totalPoolsCreated: 0,
      isVerified: false,
      verificationBonusPools: 0,
      completedPools: 0,
      abandonedPools: 0,
      firstStakedAt: block.timestamp,
      lastActiveAt: block.timestamp,
      chainId,
    };
  }

  creatorEntity.totalPoolsCreated += 1;
  creatorEntity.lastActiveAt = block.timestamp;
  context.Creator.set(creatorEntity);

  // Create pool entity
  const pool: Pool = {
    id: poolId.toString(),
    creator: creator,
    status: PoolStatus.OPENED,
    entryFee,
    maxPlayers: Number(maxPlayers),
    currentPlayers: 0,
    prizePool: 0n,
    currentRound: 0,
    createdAt: block.timestamp,
    createdAtBlock: block.number,
    chainId,
  };
  context.Pool.set(pool);

  // Create event log
  const eventLog: Event = {
    id: generateId(transaction.hash, event.logIndex),
    type: EventType.POOL_CREATED,
    transactionHash: transaction.hash,
    blockNumber: block.number,
    blockTimestamp: block.timestamp,
    logIndex: event.logIndex,
    chainId,
    pool: poolId.toString(),
    creator: creator,
    rawData: JSON.stringify(event.params),
  };
  context.Event.set(eventLog);

  // Update system stats
  const { systemStats, networkStats } = await updateSystemStats(context, chainId);
  systemStats.totalPoolsCreated += 1;
  networkStats.totalPools += 1;
  context.SystemStats.set(systemStats);
  context.NetworkStats.set(networkStats);
});

// PlayerJoined Event Handler
CoinToss.PlayerJoined.handler(async ({ event, context }) => {
  const { poolId, player, currentPlayers, maxPlayers } = event.params;
  const { block, transaction, chainId } = event;

  // Get or create player
  let playerEntity = await context.Player.get(player);
  if (!playerEntity) {
    playerEntity = {
      id: player,
      address: player,
      totalPoolsJoined: 0,
      totalPoolsWon: 0,
      totalPoolsEliminated: 0,
      totalEarnings: 0n,
      totalSpent: 0n,
      firstJoinedAt: block.timestamp,
      lastActiveAt: block.timestamp,
    };
  }

  playerEntity.totalPoolsJoined += 1;
  playerEntity.lastActiveAt = block.timestamp;
  context.Player.set(playerEntity);

  // Update pool
  const pool = await context.Pool.get(poolId.toString());
  if (pool) {
    pool.currentPlayers = Number(currentPlayers);

    // Calculate prize pool (assuming entry fee * current players)
    pool.prizePool = pool.entryFee * BigInt(currentPlayers);

    context.Pool.set(pool);

    // Create player-pool relationship
    const playerPoolId = generateId(player, poolId);
    const playerPool: PlayerPool = {
      id: playerPoolId,
      player: player,
      pool: poolId.toString(),
      isEliminated: false,
      hasWon: false,
      joinedAt: block.timestamp,
      joinedAtBlock: block.number,
      entryFeePaid: pool.entryFee,
      prizeClaimed: false,
    };
    context.PlayerPool.set(playerPool);

    // Update player stats
    playerEntity.totalSpent = playerEntity.totalSpent + pool.entryFee;
    context.Player.set(playerEntity);
  }

  // Create event log
  const eventLog: Event = {
    id: generateId(transaction.hash, event.logIndex),
    type: EventType.PLAYER_JOINED,
    transactionHash: transaction.hash,
    blockNumber: block.number,
    blockTimestamp: block.timestamp,
    logIndex: event.logIndex,
    chainId,
    pool: poolId.toString(),
    player: player,
    rawData: JSON.stringify(event.params),
  };
  context.Event.set(eventLog);

  // Update system stats
  const { systemStats } = await updateSystemStats(context, chainId);
  systemStats.totalPlayerJoins += 1;

  // Check if this is a new unique player
  const existingPlayerCount = await context.Player.get(player);
  if (playerEntity.totalPoolsJoined === 1) {
    systemStats.totalPlayers += 1;
  }

  context.SystemStats.set(systemStats);
});

// PoolActivated Event Handler
CoinToss.PoolActivated.handler(async ({ event, context }) => {
  const { poolId, totalPlayers, prizePool } = event.params;
  const { block, transaction, chainId } = event;

  // Update pool status
  const pool = await context.Pool.get(poolId.toString());
  if (pool) {
    pool.status = PoolStatus.ACTIVE;
    pool.activatedAt = block.timestamp;
    pool.activatedAtBlock = block.number;
    pool.prizePool = prizePool;
    pool.currentRound = 1; // Game starts at round 1
    context.Pool.set(pool);
  }

  // Create event log
  const eventLog: Event = {
    id: generateId(transaction.hash, event.logIndex),
    type: EventType.POOL_ACTIVATED,
    transactionHash: transaction.hash,
    blockNumber: block.number,
    blockTimestamp: block.timestamp,
    logIndex: event.logIndex,
    chainId,
    pool: poolId.toString(),
    rawData: JSON.stringify(event.params),
  };
  context.Event.set(eventLog);

  // Update system stats
  const { systemStats, networkStats } = await updateSystemStats(context, chainId);
  systemStats.totalPoolsActive += 1;
  networkStats.activePools += 1;
  systemStats.totalVolumeProcessed = systemStats.totalVolumeProcessed + prizePool;
  networkStats.totalVolume = networkStats.totalVolume + prizePool;
  context.SystemStats.set(systemStats);
  context.NetworkStats.set(networkStats);
});

// PlayerMadeChoice Event Handler
CoinToss.PlayerMadeChoice.handler(async ({ event, context }) => {
  const { poolId, player, choice, round } = event.params;
  const { block, transaction, chainId } = event;

  // Update player last active
  const playerEntity = await context.Player.get(player);
  if (playerEntity) {
    playerEntity.lastActiveAt = block.timestamp;
    context.Player.set(playerEntity);
  }

  // Get or create game round
  const roundId = generateId(poolId, round);
  let gameRound = await context.GameRound.get(roundId);
  if (!gameRound) {
    gameRound = {
      id: roundId,
      pool: poolId.toString(),
      roundNumber: Number(round),
      winningChoice: PlayerChoiceType.HEADS, // Will be updated when round resolves
      eliminatedCount: 0,
      remainingCount: 0,
      resolvedAt: 0n,
      resolvedAtBlock: 0n,
      headsCount: 0,
      tailsCount: 0,
    };
  }

  // Update choice counts
  if (choice === 1) { // HEADS
    gameRound.headsCount += 1;
  } else if (choice === 2) { // TAILS
    gameRound.tailsCount += 1;
  }
  context.GameRound.set(gameRound);

  // Create player choice
  const playerChoiceId = generateId(player, poolId, round);
  const playerChoice: PlayerChoice = {
    id: playerChoiceId,
    player: player,
    pool: poolId.toString(),
    round: roundId,
    choice: choice === 1 ? PlayerChoiceType.HEADS : PlayerChoiceType.TAILS,
    wasWinningChoice: false, // Will be updated when round resolves
    madeAt: block.timestamp,
    madeAtBlock: block.number,
  };
  context.PlayerChoice.set(playerChoice);

  // Create event log
  const eventLog: Event = {
    id: generateId(transaction.hash, event.logIndex),
    type: EventType.PLAYER_MADE_CHOICE,
    transactionHash: transaction.hash,
    blockNumber: block.number,
    blockTimestamp: block.timestamp,
    logIndex: event.logIndex,
    chainId,
    pool: poolId.toString(),
    player: player,
    rawData: JSON.stringify(event.params),
  };
  context.Event.set(eventLog);
});

// RoundResolved Event Handler
CoinToss.RoundResolved.handler(async ({ event, context }) => {
  const { poolId, round, winningChoice, eliminatedCount, remainingCount } = event.params;
  const { block, transaction, chainId } = event;

  // Update game round
  const roundId = generateId(poolId, round);
  const gameRound = await context.GameRound.get(roundId);
  if (gameRound) {
    gameRound.winningChoice = winningChoice === 1 ? PlayerChoiceType.HEADS : PlayerChoiceType.TAILS;
    gameRound.eliminatedCount = Number(eliminatedCount);
    gameRound.remainingCount = Number(remainingCount);
    gameRound.resolvedAt = block.timestamp;
    gameRound.resolvedAtBlock = block.number;
    context.GameRound.set(gameRound);

    // Update player choices with winning status
    // Note: In a production system, you might want to batch this operation
    // For now, we'll mark choices as winning/losing based on the round result
    const winningChoiceType = winningChoice === 1 ? PlayerChoiceType.HEADS : PlayerChoiceType.TAILS;

    // Update all player choices for this round
    // Note: This is a simplified approach - in practice you'd want to iterate through choices
  }

  // Update pool current round
  const pool = await context.Pool.get(poolId.toString());
  if (pool) {
    pool.currentRound = Number(round) + 1;
    context.Pool.set(pool);
  }

  // Create event log
  const eventLog: Event = {
    id: generateId(transaction.hash, event.logIndex),
    type: EventType.ROUND_RESOLVED,
    transactionHash: transaction.hash,
    blockNumber: block.number,
    blockTimestamp: block.timestamp,
    logIndex: event.logIndex,
    chainId,
    pool: poolId.toString(),
    rawData: JSON.stringify(event.params),
  };
  context.Event.set(eventLog);
});

// GameCompleted Event Handler
CoinToss.GameCompleted.handler(async ({ event, context }) => {
  const { poolId, winner, prizeAmount } = event.params;
  const { block, transaction, chainId } = event;

  // Update pool
  const pool = await context.Pool.get(poolId.toString());
  if (pool) {
    pool.status = PoolStatus.COMPLETED;
    pool.winner = winner;
    pool.prizeAmount = prizeAmount;
    pool.completedAt = block.timestamp;
    pool.completedAtBlock = block.number;
    context.Pool.set(pool);

    // Update creator stats
    const creator = await context.Creator.get(pool.creator);
    if (creator) {
      creator.completedPools += 1;
      creator.lastActiveAt = block.timestamp;
      context.Creator.set(creator);
    }
  }

  // Update winner player stats
  const winnerPlayer = await context.Player.get(winner);
  if (winnerPlayer) {
    winnerPlayer.totalPoolsWon += 1;
    winnerPlayer.totalEarnings = winnerPlayer.totalEarnings + prizeAmount;
    winnerPlayer.lastActiveAt = block.timestamp;
    context.Player.set(winnerPlayer);

    // Update player-pool relationship
    const playerPoolId = generateId(winner, poolId);
    const playerPool = await context.PlayerPool.get(playerPoolId);
    if (playerPool) {
      playerPool.hasWon = true;
      playerPool.prizeAmount = prizeAmount;
      context.PlayerPool.set(playerPool);
    }
  }

  // Create event log
  const eventLog: Event = {
    id: generateId(transaction.hash, event.logIndex),
    type: EventType.GAME_COMPLETED,
    transactionHash: transaction.hash,
    blockNumber: block.number,
    blockTimestamp: block.timestamp,
    logIndex: event.logIndex,
    chainId,
    pool: poolId.toString(),
    player: winner,
    rawData: JSON.stringify(event.params),
  };
  context.Event.set(eventLog);

  // Update system stats
  const { systemStats, networkStats } = await updateSystemStats(context, chainId);
  systemStats.totalPoolsCompleted += 1;
  systemStats.totalPoolsActive -= 1;
  systemStats.totalPrizesAwarded = systemStats.totalPrizesAwarded + prizeAmount;
  networkStats.completedPools += 1;
  networkStats.activePools -= 1;
  networkStats.totalPrizes = networkStats.totalPrizes + prizeAmount;
  context.SystemStats.set(systemStats);
  context.NetworkStats.set(networkStats);
});

// PoolAbandoned Event Handler
CoinToss.PoolAbandoned.handler(async ({ event, context }) => {
  const { poolId, creator, reason } = event.params;
  const { block, transaction, chainId } = event;

  // Update pool
  const pool = await context.Pool.get(poolId.toString());
  if (pool) {
    pool.status = PoolStatus.ABANDONED;
    context.Pool.set(pool);
  }

  // Update creator stats
  const creatorEntity = await context.Creator.get(creator);
  if (creatorEntity) {
    creatorEntity.abandonedPools += 1;
    creatorEntity.lastActiveAt = block.timestamp;
    context.Creator.set(creatorEntity);
  }

  // Create event log
  const eventLog: Event = {
    id: generateId(transaction.hash, event.logIndex),
    type: EventType.POOL_ABANDONED,
    transactionHash: transaction.hash,
    blockNumber: block.number,
    blockTimestamp: block.timestamp,
    logIndex: event.logIndex,
    chainId,
    pool: poolId.toString(),
    creator: creator,
    rawData: JSON.stringify(event.params),
  };
  context.Event.set(eventLog);

  // Update system stats
  const { systemStats, networkStats } = await updateSystemStats(context, chainId);
  systemStats.totalPoolsAbandoned += 1;
  systemStats.totalPoolsActive -= 1;
  networkStats.activePools -= 1;
  context.SystemStats.set(systemStats);
  context.NetworkStats.set(networkStats);
});

// StakeDeposited Event Handler
CoinToss.StakeDeposited.handler(async ({ event, context }) => {
  const { creator, amount, poolsEligible } = event.params;
  const { block, transaction, chainId } = event;

  // Update creator
  let creatorEntity = await context.Creator.get(creator);
  if (!creatorEntity) {
    creatorEntity = {
      id: creator,
      address: creator,
      totalStaked: 0n,
      totalEarned: 0n,
      totalPoolsEligible: 0,
      totalPoolsCreated: 0,
      isVerified: false,
      verificationBonusPools: 0,
      completedPools: 0,
      abandonedPools: 0,
      firstStakedAt: block.timestamp,
      lastActiveAt: block.timestamp,
      chainId,
    };
  }

  creatorEntity.totalStaked = creatorEntity.totalStaked + amount;
  creatorEntity.totalPoolsEligible = Number(poolsEligible);
  creatorEntity.lastActiveAt = block.timestamp;
  context.Creator.set(creatorEntity);

  // Create stake event
  const stakeEvent: StakeEvent = {
    id: generateId(transaction.hash, event.logIndex),
    creator: creator,
    type: StakeEventType.DEPOSIT,
    amount,
    poolsEligible: Number(poolsEligible),
    timestamp: block.timestamp,
    blockNumber: block.number,
    transactionHash: transaction.hash,
    chainId,
  };
  context.StakeEvent.set(stakeEvent);

  // Create event log
  const eventLog: Event = {
    id: generateId(transaction.hash, event.logIndex),
    type: EventType.STAKE_DEPOSITED,
    transactionHash: transaction.hash,
    blockNumber: block.number,
    blockTimestamp: block.timestamp,
    logIndex: event.logIndex,
    chainId,
    creator: creator,
    rawData: JSON.stringify(event.params),
  };
  context.Event.set(eventLog);

  // Update system stats
  const { systemStats, networkStats } = await updateSystemStats(context, chainId);
  systemStats.totalStaked = systemStats.totalStaked + amount;
  networkStats.totalStaked = networkStats.totalStaked + amount;
  context.SystemStats.set(systemStats);
  context.NetworkStats.set(networkStats);
});

// StakeWithdrawn Event Handler
CoinToss.StakeWithdrawn.handler(async ({ event, context }) => {
  const { creator, amount, penalty } = event.params;
  const { block, transaction, chainId } = event;

  // Update creator
  const creatorEntity = await context.Creator.get(creator);
  if (creatorEntity) {
    creatorEntity.totalStaked = creatorEntity.totalStaked - amount;
    creatorEntity.totalPoolsEligible = 0; // Reset after withdrawal
    creatorEntity.lastActiveAt = block.timestamp;
    context.Creator.set(creatorEntity);
  }

  // Create stake event
  const stakeEvent: StakeEvent = {
    id: generateId(transaction.hash, event.logIndex),
    creator: creator,
    type: StakeEventType.WITHDRAW,
    amount,
    penalty,
    poolsEligible: 0,
    timestamp: block.timestamp,
    blockNumber: block.number,
    transactionHash: transaction.hash,
    chainId,
  };
  context.StakeEvent.set(stakeEvent);

  // Create event log
  const eventLog: Event = {
    id: generateId(transaction.hash, event.logIndex),
    type: EventType.STAKE_WITHDRAWN,
    transactionHash: transaction.hash,
    blockNumber: block.number,
    blockTimestamp: block.timestamp,
    logIndex: event.logIndex,
    chainId,
    creator: creator,
    rawData: JSON.stringify(event.params),
  };
  context.Event.set(eventLog);

  // Update system stats
  const { systemStats, networkStats } = await updateSystemStats(context, chainId);
  systemStats.totalStaked = systemStats.totalStaked - amount;
  networkStats.totalStaked = networkStats.totalStaked - amount;
  context.SystemStats.set(systemStats);
  context.NetworkStats.set(networkStats);
});

// CreatorRewardClaimed Event Handler
CoinToss.CreatorRewardClaimed.handler(async ({ event, context }) => {
  const { creator, amount } = event.params;
  const { block, transaction, chainId } = event;

  // Update creator
  const creatorEntity = await context.Creator.get(creator);
  if (creatorEntity) {
    creatorEntity.totalEarned = creatorEntity.totalEarned + amount;
    creatorEntity.lastActiveAt = block.timestamp;
    context.Creator.set(creatorEntity);
  }

  // Create event log
  const eventLog: Event = {
    id: generateId(transaction.hash, event.logIndex),
    type: EventType.CREATOR_REWARD_CLAIMED,
    transactionHash: transaction.hash,
    blockNumber: block.number,
    blockTimestamp: block.timestamp,
    logIndex: event.logIndex,
    chainId,
    creator: creator,
    rawData: JSON.stringify(event.params),
  };
  context.Event.set(eventLog);

  // Update system stats
  const { systemStats } = await updateSystemStats(context, chainId);
  systemStats.totalCreatorRewards = systemStats.totalCreatorRewards + amount;
  context.SystemStats.set(systemStats);
});

// CreatorVerified Event Handler
CoinToss.CreatorVerified.handler(async ({ event, context }) => {
  const { creator, attestationId } = event.params;
  const { block, transaction, chainId } = event;

  // Update creator verification status
  const creatorEntity = await context.Creator.get(creator);
  if (creatorEntity) {
    creatorEntity.isVerified = true;
    creatorEntity.verifiedAt = block.timestamp;
    creatorEntity.attestationId = attestationId;
    creatorEntity.lastActiveAt = block.timestamp;
    context.Creator.set(creatorEntity);
  }

  // Create event log
  const eventLog: Event = {
    id: generateId(transaction.hash, event.logIndex),
    type: EventType.CREATOR_VERIFIED,
    transactionHash: transaction.hash,
    blockNumber: block.number,
    blockTimestamp: block.timestamp,
    logIndex: event.logIndex,
    chainId,
    creator: creator,
    rawData: JSON.stringify(event.params),
  };
  context.Event.set(eventLog);
});

// VerificationBonusApplied Event Handler
CoinToss.VerificationBonusApplied.handler(async ({ event, context }) => {
  const { creator, bonusPools } = event.params;
  const { block, transaction, chainId } = event;

  // Update creator bonus pools
  const creatorEntity = await context.Creator.get(creator);
  if (creatorEntity) {
    creatorEntity.verificationBonusPools = Number(bonusPools);
    creatorEntity.lastActiveAt = block.timestamp;
    context.Creator.set(creatorEntity);
  }

  // Create event log
  const eventLog: Event = {
    id: generateId(transaction.hash, event.logIndex),
    type: EventType.VERIFICATION_BONUS_APPLIED,
    transactionHash: transaction.hash,
    blockNumber: block.number,
    blockTimestamp: block.timestamp,
    logIndex: event.logIndex,
    chainId,
    creator: creator,
    rawData: JSON.stringify(event.params),
  };
  context.Event.set(eventLog);
});

// ProjectPoolUpdated Event Handler
CoinToss.ProjectPoolUpdated.handler(async ({ event, context }) => {
  const { amount, source, totalProjectPool } = event.params;
  const { block, transaction, chainId } = event;

  // Create event log
  const eventLog: Event = {
    id: generateId(transaction.hash, event.logIndex),
    type: EventType.PROJECT_POOL_UPDATED,
    transactionHash: transaction.hash,
    blockNumber: block.number,
    blockTimestamp: block.timestamp,
    logIndex: event.logIndex,
    chainId,
    rawData: JSON.stringify(event.params),
  };
  context.Event.set(eventLog);

  // Update system stats
  const { systemStats } = await updateSystemStats(context, chainId);
  systemStats.totalProjectPool = totalProjectPool;
  context.SystemStats.set(systemStats);
});

// ScopeUpdated Event Handler
CoinToss.ScopeUpdated.handler(async ({ event, context }) => {
  const { newScope } = event.params;
  const { block, transaction, chainId } = event;

  // Create event log
  const eventLog: Event = {
    id: generateId(transaction.hash, event.logIndex),
    type: EventType.SCOPE_UPDATED,
    transactionHash: transaction.hash,
    blockNumber: block.number,
    blockTimestamp: block.timestamp,
    logIndex: event.logIndex,
    chainId,
    rawData: JSON.stringify(event.params),
  };
  context.Event.set(eventLog);
});

// OwnershipTransferred Event Handler
CoinToss.OwnershipTransferred.handler(async ({ event, context }) => {
  const { previousOwner, newOwner } = event.params;
  const { block, transaction, chainId } = event;

  // Create event log
  const eventLog: Event = {
    id: generateId(transaction.hash, event.logIndex),
    type: EventType.OWNERSHIP_TRANSFERRED,
    transactionHash: transaction.hash,
    blockNumber: block.number,
    blockTimestamp: block.timestamp,
    logIndex: event.logIndex,
    chainId,
    rawData: JSON.stringify(event.params),
  };
  context.Event.set(eventLog);
});