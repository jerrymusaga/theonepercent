/*
 * CoinToss Event Handlers - Minimal Working Version
 * Creates basic Pool, Player, Creator entities
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
    // Update existing creator
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

  // Create Event record
  const eventEntity = {
    id: `${chainId}_${event.block.number}_${event.logIndex}`,
    eventType: "POOL_CREATED" as const,
    pool_id: poolId.toString(),
    creator_id: creatorId,
    player_id: undefined,
    timestamp: timestamp,
    blockNumber: blockNumber,
    chainId: chainId,
    transactionHash: "unknown",
    logIndex: event.logIndex,
  };
  context.Event.set(eventEntity);
});

// PlayerJoined Event Handler
CoinToss.PlayerJoined.handler(async ({ event, context }) => {
  const { poolId, player, currentPlayers } = event.params;
  const chainId = event.chainId;
  const timestamp = BigInt(event.block.timestamp);
  const blockNumber = BigInt(event.block.number);

  const playerId = player.toLowerCase();

  // Create Player entity if it doesn't exist
  let playerEntity = await context.Player.get(playerId);
  if (!playerEntity) {
    playerEntity = {
      id: playerId,
      address: player,
      totalPoolsJoined: 1,
      totalPoolsWon: 0,
      totalPoolsEliminated: 0,
      totalEarnings: 0n,
      totalSpent: 0n,
      firstJoinedAt: timestamp,
      lastActiveAt: timestamp,
    };
    context.Player.set(playerEntity);
  } else {
    // Update existing player
    const updatedPlayer = {
      ...playerEntity,
      totalPoolsJoined: playerEntity.totalPoolsJoined + 1,
      lastActiveAt: timestamp,
    };
    context.Player.set(updatedPlayer);
  }

  // Update Pool entity
  const poolEntity = await context.Pool.get(poolId.toString());
  if (poolEntity) {
    const updatedPool = {
      ...poolEntity,
      currentPlayers: Number(currentPlayers),
      prizePool: BigInt(currentPlayers) * poolEntity.entryFee,
    };
    context.Pool.set(updatedPool);
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

  // Create Event record
  const eventEntity = {
    id: `${chainId}_${event.block.number}_${event.logIndex}`,
    eventType: "PLAYER_JOINED" as const,
    pool_id: poolId.toString(),
    player_id: playerId,
    creator_id: undefined,
    timestamp: timestamp,
    blockNumber: blockNumber,
    chainId: chainId,
    transactionHash: "unknown",
    logIndex: event.logIndex,
  };
  context.Event.set(eventEntity);
});

// PoolActivated Event Handler
CoinToss.PoolActivated.handler(async ({ event, context }) => {
  const { poolId, prizePool } = event.params;
  const chainId = event.chainId;
  const timestamp = BigInt(event.block.timestamp);
  const blockNumber = BigInt(event.block.number);

  // Update Pool entity
  const poolEntity = await context.Pool.get(poolId.toString());
  if (poolEntity) {
    const updatedPool = {
      ...poolEntity,
      status: "ACTIVE" as const,
      currentRound: 1,
      activatedAt: timestamp,
      activatedAtBlock: blockNumber,
      prizePool: prizePool,
    };
    context.Pool.set(updatedPool);
  }
});

// GameCompleted Event Handler
CoinToss.GameCompleted.handler(async ({ event, context }) => {
  const { poolId, winner, prizeAmount } = event.params;
  const chainId = event.chainId;
  const timestamp = BigInt(event.block.timestamp);
  const blockNumber = BigInt(event.block.number);

  const winnerId = winner.toLowerCase();

  // Update Pool entity
  const poolEntity = await context.Pool.get(poolId.toString());
  if (poolEntity) {
    const updatedPool = {
      ...poolEntity,
      status: "COMPLETED" as const,
      winner_id: winnerId,
      prizeAmount: prizeAmount,
      completedAt: timestamp,
      completedAtBlock: blockNumber,
    };
    context.Pool.set(updatedPool);
  }

  // Update winner's PlayerPool status
  const playerPoolEntity = await context.PlayerPool.get(`${poolId.toString()}-${winnerId}`);
  if (playerPoolEntity) {
    const updatedPlayerPool = {
      ...playerPoolEntity,
      status: "WON" as const,
    };
    context.PlayerPool.set(updatedPlayerPool);
  }

  // Update winner statistics
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

  // Update creator statistics
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
});

// PlayerMadeChoice Event Handler
CoinToss.PlayerMadeChoice.handler(async ({ event, context }) => {
  const { poolId, player, choice, round } = event.params;
  const chainId = event.chainId;
  const timestamp = BigInt(event.block.timestamp);
  const blockNumber = BigInt(event.block.number);

  const playerId = player.toLowerCase();
  const roundId = `${poolId.toString()}-${round.toString()}`;

  // Create GameRound if it doesn't exist
  let gameRound = await context.GameRound.get(roundId);
  if (!gameRound) {
    gameRound = {
      id: roundId,
      pool_id: poolId.toString(),
      roundNumber: Number(round),
      eliminatedPlayers: 0,
      remainingPlayers: 0,
      roundWinners: 0,
      createdAt: timestamp,
      createdAtBlock: blockNumber,
      chainId: chainId,
    };
    context.GameRound.set(gameRound);
  }

  // Create PlayerChoice
  const choiceEntity = {
    id: `${poolId.toString()}-${playerId}-${round.toString()}`,
    player_id: playerId,
    pool_id: poolId.toString(),
    round_id: roundId,
    choice: (Number(choice) === 0 ? "HEADS" : "TAILS") as "HEADS" | "TAILS",
    timestamp: timestamp,
    blockNumber: blockNumber,
    chainId: chainId,
  };
  context.PlayerChoice.set(choiceEntity);
});

// StakeDeposited Event Handler
CoinToss.StakeDeposited.handler(async ({ event, context }) => {
  const { creator, amount, poolsEligible } = event.params;
  const chainId = event.chainId;
  const timestamp = BigInt(event.block.timestamp);
  const blockNumber = BigInt(event.block.number);

  const creatorId = creator.toLowerCase();

  // Create StakeEvent
  const stakeEventEntity = {
    id: `${chainId}_${event.block.number}_${event.logIndex}`,
    eventType: "STAKE" as const,
    creator_id: creatorId,
    amount: amount,
    timestamp: timestamp,
    blockNumber: blockNumber,
    chainId: chainId,
    transactionHash: "unknown",
  };
  context.StakeEvent.set(stakeEventEntity);

  // Update creator statistics
  const creatorEntity = await context.Creator.get(creatorId);
  if (creatorEntity) {
    const updatedCreator = {
      ...creatorEntity,
      totalStaked: creatorEntity.totalStaked + amount,
      totalPoolsEligible: Number(poolsEligible),
      lastActiveAt: timestamp,
    };
    context.Creator.set(updatedCreator);
  }
});

// CreatorVerified Event Handler
CoinToss.CreatorVerified.handler(async ({ event, context }) => {
  const { creator, attestationId } = event.params;
  const chainId = event.chainId;
  const timestamp = BigInt(event.block.timestamp);

  const creatorId = creator.toLowerCase();

  // Update creator verification status
  const creatorEntity = await context.Creator.get(creatorId);
  if (creatorEntity) {
    const updatedCreator = {
      ...creatorEntity,
      isVerified: true,
      verifiedAt: timestamp,
      attestationId: attestationId,
      lastActiveAt: timestamp,
    };
    context.Creator.set(updatedCreator);
  }
});

// PoolAbandoned Event Handler
CoinToss.PoolAbandoned.handler(async ({ event, context }) => {
  const { poolId } = event.params;
  const timestamp = BigInt(event.block.timestamp);
  const blockNumber = BigInt(event.block.number);

  const poolEntity = await context.Pool.get(poolId.toString());
  if (poolEntity) {
    const updatedPool = {
      ...poolEntity,
      status: "ABANDONED" as const,
      completedAt: timestamp,
      completedAtBlock: blockNumber,
    };
    context.Pool.set(updatedPool);

    // Update creator stats
    const creatorEntity = await context.Creator.get(poolEntity.creator_id);
    if (creatorEntity) {
      const updatedCreator = {
        ...creatorEntity,
        abandonedPools: creatorEntity.abandonedPools + 1,
      };
      context.Creator.set(updatedCreator);
    }
  }
});

// Placeholder handlers for remaining events
CoinToss.RoundResolved.handler(async ({ event, context }) => {
  // Basic logging only
});

CoinToss.StakeWithdrawn.handler(async ({ event, context }) => {
  // TODO: Update Creator stake amount and create StakeEvent
});

CoinToss.CreatorRewardClaimed.handler(async ({ event, context }) => {
  // TODO: Update Creator totalEarned
});

CoinToss.OwnershipTransferred.handler(async ({ event, context }) => {
  // System event - minimal logging
});

CoinToss.ProjectPoolUpdated.handler(async ({ event, context }) => {
  // System event - minimal logging
});

CoinToss.ScopeUpdated.handler(async ({ event, context }) => {
  // System event - minimal logging
});

CoinToss.VerificationBonusApplied.handler(async ({ event, context }) => {
  // TODO: Update Creator verificationBonusPools
});

CoinToss.RoundRepeated.handler(async ({ event, context }) => {
  // TODO: Handle round repetition logic
});