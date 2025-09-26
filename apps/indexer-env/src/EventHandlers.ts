/*
 * CoinToss Event Handlers - Minimal Working Version
 * Only handles basic events to get the indexer running
 */
import {
  CoinToss,
} from "generated";

// PoolCreated Event Handler
CoinToss.PoolCreated.handler(async ({ event, context }) => {
  const { poolId, creator, entryFee, maxPlayers } = event.params;
  const chainId = event.chainId;
  const timestamp = BigInt(event.block.timestamp);
  const blockNumber = BigInt(event.block.number);

  // Create Creator entity if it doesn't exist
  const creatorId = creator.toLowerCase();
  let creatorEntity = await context.Creator.get(creatorId);
  if (!creatorEntity) {
    creatorEntity = {
      id: creatorId,
      address: creator,
      totalStaked: 0n,
      totalEarned: 0n,
      totalPoolsEligible: 0,
      totalPoolsCreated: 1,
      completedPools: 0,
      abandonedPools: 0,
      isVerified: false,
      attestationId: undefined,
      verificationBonusPools: 0,
      verifiedAt: undefined,
      firstStakedAt: timestamp,
      lastActiveAt: timestamp,
      chainId: chainId,
    };
    context.Creator.set(creatorEntity);
  } else {
    // Update existing creator - create new object
    const updatedCreator = {
      ...creatorEntity,
      totalPoolsCreated: creatorEntity.totalPoolsCreated + 1,
      lastActiveAt: timestamp,
    };
    context.Creator.set(updatedCreator);
  }

  // Create Pool entity
  const poolEntity = {
    id: poolId.toString(),
    creator_id: creatorId,
    status: "WAITING_FOR_PLAYERS" as const,
    entryFee: entryFee,
    maxPlayers: Number(maxPlayers),
    currentPlayers: 0,
    prizePool: 0n,
    currentRound: 0,
    winner_id: undefined,
    prizeAmount: undefined,
    createdAt: timestamp,
    createdAtBlock: blockNumber,
    activatedAt: undefined,
    activatedAtBlock: undefined,
    completedAt: undefined,
    completedAtBlock: undefined,
    chainId: chainId,
  };
  context.Pool.set(poolEntity);

  // Create Event entity (use transactionHash string directly)
  const eventEntity = {
    id: `${poolId.toString()}-created`,
    eventType: "POOL_CREATED" as const,
    pool_id: poolId.toString(),
    creator_id: creatorId,
    player_id: undefined,
    timestamp: timestamp,
    blockNumber: blockNumber,
    chainId: chainId,
    transactionHash: `${event.block.number}-${event.logIndex}`,
    logIndex: event.logIndex,
  };
  context.Event.set(eventEntity);

  // Update NetworkStats
  const networkStatsId = `network-${chainId}`;
  let networkStats = await context.NetworkStats.get(networkStatsId);
  if (!networkStats) {
    networkStats = {
      id: networkStatsId,
      chainId: chainId,
      totalPools: 1,
      activePools: 0,
      completedPools: 0,
      totalVolume: 0n,
      lastUpdated: timestamp,
    };
  } else {
    networkStats = {
      ...networkStats,
      totalPools: networkStats.totalPools + 1,
      lastUpdated: timestamp,
    };
  }
  context.NetworkStats.set(networkStats);
});

// PlayerJoined Event Handler
CoinToss.PlayerJoined.handler(async ({ event, context }) => {
  const { poolId, player, currentPlayers } = event.params;
  const chainId = event.chainId;
  const timestamp = BigInt(event.block.timestamp);
  const blockNumber = BigInt(event.block.number);

  // Get pool entity - it should exist
  const poolEntity = await context.Pool.get(poolId.toString());
  if (poolEntity) {
    // Update pool with new player count
    const updatedPool = {
      ...poolEntity,
      currentPlayers: Number(currentPlayers),
      prizePool: poolEntity.prizePool + poolEntity.entryFee,
    };
    context.Pool.set(updatedPool);
  }

  // Create Player entity if it doesn't exist
  const playerId = player.toLowerCase();
  let playerEntity = await context.Player.get(playerId);
  if (!playerEntity) {
    playerEntity = {
      id: playerId,
      address: player,
      totalPoolsJoined: 1,
      totalPoolsWon: 0,
      totalPoolsEliminated: 0,
      totalEarnings: 0n,
      totalSpent: poolEntity?.entryFee || 0n,
      firstJoinedAt: timestamp,
      lastActiveAt: timestamp,
    };
    context.Player.set(playerEntity);
  } else {
    // Update existing player
    const updatedPlayer = {
      ...playerEntity,
      totalPoolsJoined: playerEntity.totalPoolsJoined + 1,
      totalSpent: playerEntity.totalSpent + (poolEntity?.entryFee || 0n),
      lastActiveAt: timestamp,
    };
    context.Player.set(updatedPlayer);
  }

  // Create PlayerPool relationship
  const playerPoolEntity = {
    id: `${poolId.toString()}-${playerId}`,
    player_id: playerId,
    pool_id: poolId.toString(),
    status: "ACTIVE" as const,
    joinedAt: timestamp,
    joinedAtBlock: blockNumber,
    eliminatedAt: undefined,
    eliminatedAtBlock: undefined,
    eliminatedInRound: undefined,
    chainId: chainId,
  };
  context.PlayerPool.set(playerPoolEntity);

  // Create Event entity
  const eventEntity = {
    id: `${poolId.toString()}-${playerId}-joined`,
    eventType: "PLAYER_JOINED" as const,
    pool_id: poolId.toString(),
    player_id: playerId,
    creator_id: undefined,
    timestamp: timestamp,
    blockNumber: blockNumber,
    chainId: chainId,
    transactionHash: `${event.block.number}-${event.logIndex}`,
    logIndex: event.logIndex,
  };
  context.Event.set(eventEntity);

  // Update NetworkStats volume
  const networkStatsId = `network-${chainId}`;
  let networkStats = await context.NetworkStats.get(networkStatsId);
  if (networkStats) {
    const updatedStats = {
      ...networkStats,
      totalVolume: networkStats.totalVolume + (poolEntity?.entryFee || 0n),
      lastUpdated: timestamp,
    };
    context.NetworkStats.set(updatedStats);
  }
});

// PoolActivated Event Handler
CoinToss.PoolActivated.handler(async ({ event, context }) => {
  const { poolId } = event.params;
  const timestamp = BigInt(event.block.timestamp);
  const blockNumber = BigInt(event.block.number);
  const chainId = event.chainId;

  // Update pool status
  const poolEntity = await context.Pool.get(poolId.toString());
  if (poolEntity) {
    const updatedPool = {
      ...poolEntity,
      status: "ACTIVE" as const,
      currentRound: 1,
      activatedAt: timestamp,
      activatedAtBlock: blockNumber,
      prizePool: poolEntity.entryFee * BigInt(poolEntity.currentPlayers),
    };
    context.Pool.set(updatedPool);
  }

  // Create Event entity
  const eventEntity = {
    id: `${poolId.toString()}-activated`,
    eventType: "POOL_ACTIVATED" as const,
    pool_id: poolId.toString(),
    player_id: undefined,
    creator_id: undefined,
    timestamp: timestamp,
    blockNumber: blockNumber,
    chainId: chainId,
    transactionHash: `${event.block.number}-${event.logIndex}`,
    logIndex: event.logIndex,
  };
  context.Event.set(eventEntity);

  // Update NetworkStats
  const networkStatsId = `network-${chainId}`;
  let networkStats = await context.NetworkStats.get(networkStatsId);
  if (networkStats) {
    const updatedStats = {
      ...networkStats,
      activePools: networkStats.activePools + 1,
      lastUpdated: timestamp,
    };
    context.NetworkStats.set(updatedStats);
  }
});

// GameCompleted Event Handler (correct name)
CoinToss.GameCompleted.handler(async ({ event, context }) => {
  const { poolId, winner, prizeAmount } = event.params;
  const timestamp = BigInt(event.block.timestamp);
  const blockNumber = BigInt(event.block.number);
  const chainId = event.chainId;

  // Update pool with winner
  const poolEntity = await context.Pool.get(poolId.toString());
  if (poolEntity) {
    const updatedPool = {
      ...poolEntity,
      status: "COMPLETED" as const,
      winner_id: winner.toLowerCase(),
      prizeAmount: prizeAmount,
      completedAt: timestamp,
      completedAtBlock: blockNumber,
    };
    context.Pool.set(updatedPool);

    // Update winner PlayerPool status
    const winnerPlayerPool = await context.PlayerPool.get(`${poolId.toString()}-${winner.toLowerCase()}`);
    if (winnerPlayerPool) {
      const updatedWinnerPool = {
        ...winnerPlayerPool,
        status: "WON" as const,
      };
      context.PlayerPool.set(updatedWinnerPool);
    }
  }

  // Create Event entity
  const eventEntity = {
    id: `${poolId.toString()}-completed`,
    eventType: "POOL_COMPLETED" as const,
    pool_id: poolId.toString(),
    player_id: winner.toLowerCase(),
    creator_id: undefined,
    timestamp: timestamp,
    blockNumber: blockNumber,
    chainId: chainId,
    transactionHash: `${event.block.number}-${event.logIndex}`,
    logIndex: event.logIndex,
  };
  context.Event.set(eventEntity);

  // Update winner's stats
  const winnerId = winner.toLowerCase();
  const playerEntity = await context.Player.get(winnerId);
  if (playerEntity) {
    const updatedPlayer = {
      ...playerEntity,
      totalPoolsWon: playerEntity.totalPoolsWon + 1,
      totalEarnings: playerEntity.totalEarnings + prizeAmount,
      lastActiveAt: timestamp,
    };
    context.Player.set(updatedPlayer);
  }

  // Update creator stats
  if (poolEntity) {
    const creatorEntity = await context.Creator.get(poolEntity.creator_id);
    if (creatorEntity) {
      const updatedCreator = {
        ...creatorEntity,
        completedPools: creatorEntity.completedPools + 1,
        lastActiveAt: timestamp,
      };
      context.Creator.set(updatedCreator);
    }
  }

  // Update NetworkStats
  const networkStatsId = `network-${chainId}`;
  let networkStats = await context.NetworkStats.get(networkStatsId);
  if (networkStats) {
    const updatedStats = {
      ...networkStats,
      activePools: networkStats.activePools - 1,
      completedPools: networkStats.completedPools + 1,
      lastUpdated: timestamp,
    };
    context.NetworkStats.set(updatedStats);
  }
});