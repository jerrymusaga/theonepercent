import { useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/graphql/client';
import {
  GET_PLAYER,
  GET_PLAYER_POOLS,
  GET_TOP_PLAYERS,
} from '@/lib/graphql/queries';
import type {
  Player,
  PlayerResponse,
  PlayerPool,
} from '@/lib/graphql/types';

// Get a specific player by address
export function useEnvioPlayer(address: string | undefined) {
  return useQuery({
    queryKey: ['envio-player', address],
    queryFn: async () => {
      if (!address) return null;
      const response = await request<any>(GET_PLAYER, {
        id: address.toLowerCase()
      });
      return response.Player_by_pk;
    },
    enabled: !!address,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
}

// Get player's pool participation history
export function useEnvioPlayerPools(playerAddress: string | undefined) {
  return useQuery({
    queryKey: ['envio-player-pools', playerAddress],
    queryFn: async () => {
      if (!playerAddress) return [];

      const query = `
        query GetPlayerPools($playerAddress: String!) {
          PlayerPool(where: { player_id: { _eq: $playerAddress } }) {
            id
            pool_id
            player_id
            status
            joinedAt
            eliminatedAt
            eliminatedInRound
            chainId
          }
        }
      `;

      const response = await request<{ PlayerPool: any[] }>(query, {
        playerAddress: playerAddress.toLowerCase(),
      });
      return response.PlayerPool;
    },
    enabled: !!playerAddress,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
}

// Get top players leaderboard
export function useEnvioTopPlayers(limit = 10, chainId?: number) {
  return useQuery({
    queryKey: ['envio-top-players', limit, chainId],
    queryFn: async () => {
      const response = await request<any>(GET_TOP_PLAYERS, {
        limit,
      });
      return response.Player;
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
  });
}

// Check if player has joined a specific pool
export function useEnvioHasPlayerJoined(poolId: string | undefined, playerAddress: string | undefined) {
  return useQuery({
    queryKey: ['envio-has-player-joined', poolId, playerAddress],
    queryFn: async () => {
      if (!poolId || !playerAddress) return false;

      const query = `
        query HasPlayerJoined($poolId: String!, $playerAddress: String!) {
          PlayerPool(
            where: {
              pool_id: { _eq: $poolId },
              player_id: { _eq: $playerAddress }
            }
            limit: 1
          ) {
            id
          }
        }
      `;

      const response = await request<{ PlayerPool: { id: string }[] }>(query, {
        poolId,
        playerAddress: playerAddress.toLowerCase(),
      });

      return response.PlayerPool.length > 0;
    },
    enabled: !!(poolId && playerAddress),
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // 30 seconds
  });
}

// Get player statistics for a specific pool
export function useEnvioPlayerPool(poolId: string | undefined, playerAddress: string | undefined) {
  return useQuery({
    queryKey: ['envio-player-pool', poolId, playerAddress],
    queryFn: async () => {
      if (!poolId || !playerAddress) return null;

      const query = `
        query GetPlayerPool($poolId: String!, $playerAddress: String!) {
          playerPools(
            where: {
              pool: $poolId,
              player: $playerAddress
            }
            first: 1
          ) {
            id
            player {
              id
              address
              totalPoolsJoined
              totalPoolsWon
              totalEarnings
            }
            isEliminated
            hasWon
            eliminatedInRound
            joinedAt
            entryFeePaid
            prizeAmount
            prizeClaimed
          }
        }
      `;

      const response = await request<{ playerPools: PlayerPool[] }>(query, {
        poolId,
        playerAddress: playerAddress.toLowerCase(),
      });

      return response.playerPools[0] || null;
    },
    enabled: !!(poolId && playerAddress),
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // 30 seconds
  });
}

// Get joined players for a specific pool
export function useEnvioJoinedPlayers(poolId: string | undefined) {
  return useQuery({
    queryKey: ['envio-joined-players', poolId],
    queryFn: async () => {
      if (!poolId) return [];

      const query = `
        query GetJoinedPlayers($poolId: String!) {
          PlayerPool(where: { pool_id: { _eq: $poolId } }) {
            id
            player_id
            pool_id
            status
            joinedAt
            eliminatedAt
            eliminatedInRound
            chainId
          }
        }
      `;

      const response = await request<{ PlayerPool: any[] }>(query, {
        poolId,
      });

      return response.PlayerPool;
    },
    enabled: !!poolId,
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // 30 seconds
  });
}

// Get remaining players in an active pool
export function useEnvioRemainingPlayers(poolId: string | undefined) {
  return useQuery({
    queryKey: ['envio-remaining-players', poolId],
    queryFn: async () => {
      if (!poolId) return [];

      const query = `
        query GetRemainingPlayers($poolId: String!) {
          playerPools(
            where: {
              pool: $poolId,
              isEliminated: false
            }
          ) {
            id
            player {
              id
              address
              totalPoolsJoined
              totalPoolsWon
            }
            joinedAt
            entryFeePaid
          }
        }
      `;

      const response = await request<{ playerPools: PlayerPool[] }>(query, {
        poolId,
      });

      return response.playerPools;
    },
    enabled: !!poolId,
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // 30 seconds
  });
}

// Get detailed joined pools data with pool information
export function useEnvioJoinedPoolsDetailed(playerAddress: string | undefined) {
  return useQuery({
    queryKey: ['envio-joined-pools-detailed', playerAddress],
    queryFn: async () => {
      console.log('🔍 useEnvioJoinedPoolsDetailed called with playerAddress:', playerAddress);

      if (!playerAddress) {
        console.log('❌ No playerAddress provided');
        return [];
      }

      const query = `
        query GetJoinedPoolsDetailed($playerAddress: String!) {
          PlayerPool(where: { player_id: { _eq: $playerAddress } }) {
            id
            pool_id
            player_id
            status
            joinedAt
            eliminatedAt
            eliminatedInRound
            chainId
          }
        }
      `;

      console.log('📡 Fetching PlayerPool data for:', playerAddress.toLowerCase());

      const response = await request<{ PlayerPool: any[] }>(query, {
        playerAddress: playerAddress.toLowerCase(),
      });

      console.log('✅ PlayerPool response:', response);
      console.log('📊 Found', response.PlayerPool.length, 'PlayerPool entries');

      // Now fetch pool details for each joined pool
      if (response.PlayerPool.length === 0) {
        console.log('🚫 No PlayerPool entries found, returning empty array');
        return [];
      }

      const poolIds = response.PlayerPool.map((pp: any) => pp.pool_id);
      console.log('🎯 Pool IDs to fetch:', poolIds);

      const poolQuery = `
        query GetPoolsDetails($poolIds: [String!]!) {
          Pool(where: { id: { _in: $poolIds } }) {
            id
            creator_id
            status
            entryFee
            maxPlayers
            currentPlayers
            prizePool
            currentRound
            winner_id
            prizeAmount
            createdAt
            activatedAt
            completedAt
            chainId
          }
        }
      `;

      console.log('📡 Fetching Pool details for IDs:', poolIds);

      const poolsResponse = await request<{ Pool: any[] }>(poolQuery, {
        poolIds,
      });

      console.log('✅ Pool response:', poolsResponse);
      console.log('📊 Found', poolsResponse.Pool.length, 'Pool entries');

      // Combine PlayerPool and Pool data
      const combinedData = response.PlayerPool.map((playerPool: any) => {
        const pool = poolsResponse.Pool.find((p: any) => p.id === playerPool.pool_id);

        if (!pool) {
          console.log('⚠️ No pool found for PlayerPool:', playerPool.pool_id);
          return null;
        }

        const hasWon = pool.winner_id === playerPool.player_id;
        const prizePoolBigInt = BigInt(pool.prizePool || 0);

        // Calculate prize amount (95% of total pool, same as old hook logic)
        const prizeAmount = hasWon ?
          prizePoolBigInt - (prizePoolBigInt * BigInt(5) / BigInt(100)) :
          BigInt(0);

        // Check if prize has been claimed by checking if prizePool is 0
        // This works because when a winner claims, the contract sets prizePool to 0
        const hasClaimed = hasWon && prizePoolBigInt === BigInt(0);

        // Debug logging for claim status
        if (hasWon) {
          console.log('🏆 Winner found for pool', playerPool.pool_id);
          console.log('   - Player:', playerPool.player_id);
          console.log('   - Prize Amount:', prizeAmount.toString());
          console.log('   - Prize Pool (from Pool):', prizePoolBigInt.toString());
          console.log('   - Pool Status (from Envio):', pool.status);
          console.log('   - Pool Status (numeric):', pool.status === 'WAITING_FOR_PLAYERS' ? 0 :
                     pool.status === 'ACTIVE' ? 1 :
                     pool.status === 'COMPLETED' ? 2 :
                     pool.status === 'ABANDONED' ? 3 : 'UNKNOWN');
          console.log('   - hasClaimed (computed):', hasClaimed);
          console.log('   - Can Claim:', !hasClaimed);
        }

        const combined = {
          id: playerPool.pool_id,
          pool_id: playerPool.pool_id,
          player_id: playerPool.player_id,
          status: playerPool.status,
          joinedAt: playerPool.joinedAt,
          eliminatedAt: playerPool.eliminatedAt,
          eliminatedInRound: playerPool.eliminatedInRound,
          chainId: playerPool.chainId,
          hasWon,
          hasClaimed,
          prizeAmount,
          isEliminated: playerPool.status === 'ELIMINATED',
          formattedData: {
            entryFee: (parseFloat(pool.entryFee) / 1e18).toFixed(4),
            status: pool.status === 'WAITING_FOR_PLAYERS' ? 0 :
                   pool.status === 'ACTIVE' ? 1 :
                   pool.status === 'COMPLETED' ? 2 :
                   pool.status === 'ABANDONED' ? 3 : 0,
            prizePool: (parseFloat(pool.prizePool) / 1e18).toFixed(4),
            currentPlayers: pool.currentPlayers,
            maxPlayers: pool.maxPlayers,
            isWinner: hasWon,
            canClaim: hasWon && !hasClaimed,
          },
          poolInfo: {
            status: pool.status === 'WAITING_FOR_PLAYERS' ? 0 :
                   pool.status === 'ACTIVE' ? 1 :
                   pool.status === 'COMPLETED' ? 2 :
                   pool.status === 'ABANDONED' ? 3 : 0,
            entryFee: BigInt(pool.entryFee || 0),
            prizePool: prizePoolBigInt,
            creator: pool.creator_id,
            currentPlayers: BigInt(pool.currentPlayers || 0),
            maxPlayers: BigInt(pool.maxPlayers || 0),
          }
        };

        console.log('🔄 Combined data for pool', playerPool.pool_id, ':', combined);
        return combined;
      }).filter((item): item is NonNullable<typeof item> => item !== null);

      console.log('🎉 Final combined data array length:', combinedData.length);
      console.log('🎉 Final combined data:', combinedData);

      return combinedData;
    },
    enabled: !!playerAddress,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
}

// Get a single pool by ID with full details
export function useEnvioPoolInfo(poolId: string | number | undefined) {
  return useQuery({
    queryKey: ['envio-pool-info', poolId],
    queryFn: async () => {
      if (!poolId) return null;

      const query = `
        query GetPoolInfo($poolId: String!) {
          Pool_by_pk(id: $poolId) {
            id
            creator_id
            status
            entryFee
            maxPlayers
            currentPlayers
            prizePool
            currentRound
            winner_id
            prizeAmount
            createdAt
            activatedAt
            completedAt
            chainId
          }
        }
      `;

      console.log('📡 Fetching pool info for:', poolId.toString());

      const response = await request<{ Pool_by_pk: any }>(query, {
        poolId: poolId.toString(),
      });

      console.log('✅ Pool info response:', response);

      return response.Pool_by_pk;
    },
    enabled: !!poolId,
    staleTime: 15000, // 15 seconds - pool data changes frequently
    refetchInterval: 30000, // 30 seconds
  });
}

// Get remaining players in an active pool (specifically for pool detail page)
export function useEnvioRemainingPlayersForPool(poolId: string | undefined) {
  return useQuery({
    queryKey: ['envio-remaining-players-for-pool', poolId],
    queryFn: async () => {
      if (!poolId) return [];

      const query = `
        query GetRemainingPlayersForPool($poolId: String!) {
          PlayerPool(where: {
            pool_id: { _eq: $poolId },
            status: { _eq: "ACTIVE" }
          }) {
            id
            player_id
            pool_id
            status
            joinedAt
            eliminatedAt
            eliminatedInRound
            chainId
          }
        }
      `;

      console.log('📡 Fetching remaining players for pool:', poolId);

      const response = await request<{ PlayerPool: any[] }>(query, {
        poolId,
      });

      console.log('✅ Remaining players response:', response);
      console.log('📊 Found', response.PlayerPool.length, 'remaining players');

      return response.PlayerPool;
    },
    enabled: !!poolId,
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // 30 seconds
  });
}

// Get all joined players for a specific pool (for pool detail page)
export function useEnvioJoinedPlayersForPool(poolId: string | undefined) {
  return useQuery({
    queryKey: ['envio-joined-players-for-pool', poolId],
    queryFn: async () => {
      if (!poolId) return [];

      const query = `
        query GetJoinedPlayersForPool($poolId: String!) {
          PlayerPool(where: { pool_id: { _eq: $poolId } }) {
            id
            player_id
            pool_id
            status
            joinedAt
            eliminatedAt
            eliminatedInRound
            chainId
          }
        }
      `;

      console.log('📡 Fetching joined players for pool:', poolId);

      const response = await request<{ PlayerPool: any[] }>(query, {
        poolId,
      });

      console.log('✅ Joined players response:', response);
      console.log('📊 Found', response.PlayerPool.length, 'joined players');

      return response.PlayerPool;
    },
    enabled: !!poolId,
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // 30 seconds
  });
}

// Get pools created by a specific creator
export function useEnvioCreatedPools(creatorAddress: string | undefined) {
  return useQuery({
    queryKey: ['envio-created-pools', creatorAddress],
    queryFn: async () => {
      if (!creatorAddress) return [];

      const query = `
        query GetCreatedPools($creatorAddress: String!) {
          Pool(where: { creator_id: { _eq: $creatorAddress } }) {
            id
            creator_id
            status
            entryFee
            maxPlayers
            currentPlayers
            prizePool
            currentRound
            winner_id
            prizeAmount
            createdAt
            activatedAt
            completedAt
            chainId
          }
        }
      `;

      console.log('📡 Fetching created pools for creator:', creatorAddress.toLowerCase());

      const response = await request<{ Pool: any[] }>(query, {
        creatorAddress: creatorAddress.toLowerCase(),
      });

      console.log('✅ Created pools response:', response);
      console.log('📊 Found', response.Pool.length, 'created pools');

      return response.Pool;
    },
    enabled: !!creatorAddress,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
}

// Get game progress information for a specific pool
export function useEnvioGameProgress(poolId: string | undefined) {
  return useQuery({
    queryKey: ['envio-game-progress', poolId],
    queryFn: async () => {
      if (!poolId) return null;

      const query = `
        query GetGameProgress($poolId: String!) {
          Pool_by_pk(id: $poolId) {
            id
            currentRound
            currentPlayers
            maxPlayers
            status
            winner_id
            prizeAmount
          }
        }
      `;

      console.log('📡 Fetching game progress for pool:', poolId);

      const response = await request<{ Pool_by_pk: any }>(query, {
        poolId,
      });

      console.log('✅ Game progress response:', response);

      if (!response.Pool_by_pk) return null;

      const pool = response.Pool_by_pk;

      // Transform to match expected useGameProgress format
      return {
        currentRound: BigInt(pool.currentRound),
        totalPlayersCount: BigInt(pool.maxPlayers),
        remainingPlayersCount: BigInt(pool.currentPlayers),
        isGameComplete: pool.status === 'COMPLETED',
        winner: pool.winner_id,
        prizeAmount: pool.prizeAmount ? BigInt(pool.prizeAmount) : BigInt(0),
      };
    },
    enabled: !!poolId,
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // 30 seconds
  });
}

// Check if a player has made a choice for the current round
export function useEnvioHasPlayerChosen(poolId: string | undefined, playerAddress: string | undefined) {
  return useQuery({
    queryKey: ['envio-has-player-chosen', poolId, playerAddress],
    queryFn: async () => {
      if (!poolId || !playerAddress) return false;

      // First get the current round
      const poolQuery = `
        query GetPoolCurrentRound($poolId: String!) {
          Pool_by_pk(id: $poolId) {
            currentRound
          }
        }
      `;

      const poolResponse = await request<{ Pool_by_pk: any }>(poolQuery, {
        poolId,
      });

      if (!poolResponse.Pool_by_pk) return false;

      const currentRound = poolResponse.Pool_by_pk.currentRound;

      // Then check if player has made a choice for this round
      const choiceQuery = `
        query HasPlayerChosen($poolId: String!, $playerAddress: String!, $roundNumber: Int!) {
          PlayerChoice(where: {
            pool_id: { _eq: $poolId },
            player_id: { _eq: $playerAddress },
            round_id: { _eq: $roundNumber }
          }, limit: 1) {
            id
          }
        }
      `;

      const choiceResponse = await request<{ PlayerChoice: any[] }>(choiceQuery, {
        poolId,
        playerAddress: playerAddress.toLowerCase(),
        roundNumber: currentRound,
      });

      console.log('📡 Has player chosen check:', { poolId, playerAddress, currentRound, hasChosen: choiceResponse.PlayerChoice.length > 0 });

      return choiceResponse.PlayerChoice.length > 0;
    },
    enabled: !!(poolId && playerAddress),
    staleTime: 10000, // 10 seconds - choices change frequently
    refetchInterval: 15000, // 15 seconds
  });
}

// Get a player's choice for the current round
export function useEnvioPlayerChoice(poolId: string | undefined, playerAddress: string | undefined) {
  return useQuery({
    queryKey: ['envio-player-choice', poolId, playerAddress],
    queryFn: async () => {
      if (!poolId || !playerAddress) return null;

      // First get the current round
      const poolQuery = `
        query GetPoolCurrentRound($poolId: String!) {
          Pool_by_pk(id: $poolId) {
            currentRound
          }
        }
      `;

      const poolResponse = await request<{ Pool_by_pk: any }>(poolQuery, {
        poolId,
      });

      if (!poolResponse.Pool_by_pk) return null;

      const currentRound = poolResponse.Pool_by_pk.currentRound;

      // Then get the player's choice for this round
      const choiceQuery = `
        query GetPlayerChoice($poolId: String!, $playerAddress: String!, $roundNumber: Int!) {
          PlayerChoice(where: {
            pool_id: { _eq: $poolId },
            player_id: { _eq: $playerAddress },
            round_id: { _eq: $roundNumber }
          }, limit: 1) {
            id
            choice
          }
        }
      `;

      const choiceResponse = await request<{ PlayerChoice: any[] }>(choiceQuery, {
        poolId,
        playerAddress: playerAddress.toLowerCase(),
        roundNumber: currentRound,
      });

      console.log('📡 Player choice check:', { poolId, playerAddress, currentRound, choices: choiceResponse.PlayerChoice });

      if (choiceResponse.PlayerChoice.length === 0) return null;

      // Map Envio choice to PlayerChoice enum
      const envioChoice = choiceResponse.PlayerChoice[0].choice;
      return envioChoice === 'HEADS' ? 0 : 1; // 0 for HEADS, 1 for TAILS to match PlayerChoice enum
    },
    enabled: !!(poolId && playerAddress),
    staleTime: 10000, // 10 seconds
    refetchInterval: 15000, // 15 seconds
  });
}

// Check if a player is eliminated from a pool
export function useEnvioIsPlayerEliminated(poolId: string | undefined, playerAddress: string | undefined) {
  return useQuery({
    queryKey: ['envio-is-player-eliminated', poolId, playerAddress],
    queryFn: async () => {
      if (!poolId || !playerAddress) return false;

      const query = `
        query IsPlayerEliminated($poolId: String!, $playerAddress: String!) {
          PlayerPool(where: {
            pool_id: { _eq: $poolId },
            player_id: { _eq: $playerAddress }
          }, limit: 1) {
            status
          }
        }
      `;

      const response = await request<{ PlayerPool: any[] }>(query, {
        poolId,
        playerAddress: playerAddress.toLowerCase(),
      });

      console.log('📡 Player elimination check:', { poolId, playerAddress, playerPools: response.PlayerPool });

      if (response.PlayerPool.length === 0) return false;

      const playerStatus = response.PlayerPool[0].status;
      return playerStatus === 'ELIMINATED';
    },
    enabled: !!(poolId && playerAddress),
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // 30 seconds
  });
}

// Get game results for a specific pool (winner info, rounds, etc.)
export function useEnvioGameResults(poolId: string | undefined) {
  return useQuery({
    queryKey: ['envio-game-results', poolId],
    queryFn: async () => {
      if (!poolId) return { winner: null, rounds: [], isLoading: false };

      const poolQuery = `
        query GetGameResults($poolId: String!) {
          Pool_by_pk(id: $poolId) {
            id
            status
            winner_id
            prizeAmount
            currentRound
          }
        }
      `;

      const response = await request<{ Pool_by_pk: any }>(poolQuery, {
        poolId,
      });

      console.log('📡 Game results response:', response);

      if (!response.Pool_by_pk) {
        return { winner: null, rounds: [], isLoading: false };
      }

      const pool = response.Pool_by_pk;
      let winner = null;

      // If there's a winner, get their details
      if (pool.winner_id && pool.prizeAmount) {
        winner = {
          address: pool.winner_id,
          prizeAmount: BigInt(pool.prizeAmount),
        };
      }

      // Get rounds information (basic implementation - could be expanded)
      const rounds = Array.from({ length: pool.currentRound }, (_, i) => ({
        round: i + 1,
        // Additional round details could be fetched here if needed
      }));

      return {
        winner,
        rounds,
        isLoading: false,
      };
    },
    enabled: !!poolId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
}

// Get the latest round result (choices and winning choice)
export function useEnvioLatestRoundResult(poolId: string | undefined) {
  return useQuery({
    queryKey: ['envio-latest-round-result', poolId],
    queryFn: async () => {
      if (!poolId) return { data: null };

      // First get the current round
      const poolQuery = `
        query GetPoolCurrentRound($poolId: String!) {
          Pool_by_pk(id: $poolId) {
            currentRound
          }
        }
      `;

      const poolResponse = await request<{ Pool_by_pk: any }>(poolQuery, {
        poolId,
      });

      if (!poolResponse.Pool_by_pk) return { data: null };

      const currentRound = poolResponse.Pool_by_pk.currentRound;

      // Get choices for the latest completed round
      const choicesQuery = `
        query GetRoundChoices($poolId: String!, $roundNumber: Int!) {
          PlayerChoice(where: {
            pool_id: { _eq: $poolId },
            round_id: { _eq: $roundNumber }
          }) {
            id
            choice
            player_id
          }
        }
      `;

      const choicesResponse = await request<{ PlayerChoice: any[] }>(choicesQuery, {
        poolId,
        roundNumber: Math.max(1, currentRound - 1), // Get the last completed round
      });

      console.log('📡 Latest round choices:', choicesResponse.PlayerChoice);

      // Process choices into format expected by UI
      const choices = {
        HEADS: { count: 0, players: [] as any[] },
        TAILS: { count: 0, players: [] as any[] },
      };

      choicesResponse.PlayerChoice.forEach((playerChoice: any) => {
        const choice = playerChoice.choice === 'HEADS' ? 'HEADS' : 'TAILS';
        choices[choice].count++;
        choices[choice].players.push({
          address: playerChoice.player_id,
          choice: playerChoice.choice,
        });
      });

      // Determine winning choice (minority wins)
      const winningChoice = choices.HEADS.count < choices.TAILS.count ? 'HEADS' : 'TAILS';

      return {
        data: {
          winningChoice,
          choices,
        },
      };
    },
    enabled: !!poolId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
}

// Get tie scenarios for a pool (rounds where all players chose the same option)
export function useEnvioTieScenarios(poolId: string | undefined) {
  return useQuery({
    queryKey: ['envio-tie-scenarios', poolId],
    queryFn: async () => {
      if (!poolId) return [];

      const query = `
        query GetTieScenarios($poolId: String!) {
          GameRound(
            where: {
              pool_id: { _eq: $poolId },
              eliminatedPlayers: { _eq: 0 }
            }
            order_by: { roundNumber: desc }
          ) {
            id
            roundNumber
            eliminatedPlayers
            remainingPlayers
            roundWinners
            createdAt
            createdAtBlock
            chainId
          }
        }
      `;

      const response = await request<{ GameRound: any[] }>(query, { poolId });
      return response.GameRound.map(round => ({
        roundNumber: round.roundNumber,
        playerCount: round.remainingPlayers,
        timestamp: new Date(Number(round.createdAt) * 1000),
        blockNumber: round.createdAtBlock
      }));
    },
    enabled: !!poolId,
    refetchInterval: 2000,
  });
}

// Get round repeated events (tie rounds where the round needs to be replayed)
export function useEnvioRoundRepeatedEvents(poolId: string | undefined) {
  return useQuery({
    queryKey: ['envio-round-repeated-events', poolId],
    queryFn: async () => {
      if (!poolId) return [];

      const query = `
        query GetRoundRepeatedEvents($poolId: String!) {
          GameRound(
            where: {
              pool_id: { _eq: $poolId },
              id: { _like: "%-tie" }
            }
            order_by: { roundNumber: desc }
          ) {
            id
            roundNumber
            remainingPlayers
            createdAt
            createdAtBlock
          }
        }
      `;

      const response = await request<{ GameRound: any[] }>(query, { poolId });

      return response.GameRound.map(round => ({
        roundNumber: round.roundNumber,
        playerCount: round.remainingPlayers,
        timestamp: new Date(Number(round.createdAt) * 1000),
        blockNumber: round.createdAtBlock,
        isTie: true
      }));
    },
    enabled: !!poolId,
    refetchInterval: 1000, // More frequent polling for real-time tie detection
  });
}

// Check if the current round has a tie (all players chose the same option)
export function useEnvioCurrentRoundTieStatus(poolId: string | undefined, currentRound: number) {
  return useQuery({
    queryKey: ['envio-current-round-tie-status', poolId, currentRound],
    queryFn: async () => {
      if (!poolId) return { hasTie: false, tieCount: 0 };

      const query = `
        query GetCurrentRoundTieStatus($poolId: String!, $roundNumber: Int!) {
          GameRound(
            where: {
              pool_id: { _eq: $poolId },
              roundNumber: { _eq: $roundNumber },
              eliminatedPlayers: { _eq: 0 }
            }
          ) {
            id
            roundNumber
            remainingPlayers
            eliminatedPlayers
          }
        }
      `;

      const response = await request<{ GameRound: any[] }>(query, {
        poolId,
        roundNumber: currentRound
      });

      const tieRounds = response.GameRound.filter(round => round.eliminatedPlayers === 0);

      return {
        hasTie: tieRounds.length > 0,
        tieCount: tieRounds.length,
        latestTieRound: tieRounds[0] || null
      };
    },
    enabled: !!poolId && currentRound > 0,
    refetchInterval: 1000,
  });
}

// Get the latest GameRound result for real-time updates
export function useEnvioLatestGameRound(poolId: string | undefined) {
  return useQuery({
    queryKey: ['envio-latest-game-round', poolId],
    queryFn: async () => {
      if (!poolId) return null;

      const query = `
        query GetLatestGameRound($poolId: String!) {
          GameRound(
            where: { pool_id: { _eq: $poolId } }
            order_by: { roundNumber: desc }
            limit: 1
          ) {
            id
            roundNumber
            eliminatedPlayers
            remainingPlayers
            roundWinners
            createdAt
            createdAtBlock
            chainId
          }
        }
      `;

      const response = await request<{ GameRound: any[] }>(query, { poolId });
      const gameRound = response.GameRound[0];

      if (!gameRound) return null;

      return {
        roundNumber: gameRound.roundNumber,
        eliminatedPlayers: gameRound.eliminatedPlayers,
        remainingPlayers: gameRound.remainingPlayers,
        roundWinners: gameRound.roundWinners,
        timestamp: new Date(Number(gameRound.createdAt) * 1000),
        blockNumber: gameRound.createdAtBlock,
        isTie: gameRound.eliminatedPlayers === 0 && gameRound.id.endsWith('-tie')
      };
    },
    enabled: !!poolId,
    refetchInterval: 2000, // Poll every 2 seconds for real-time updates
  });
}

// Hook to invalidate all player-related queries
export function useInvalidatePlayers() {
  const queryClient = useQueryClient();

  return (playerAddress?: string) => {
    if (playerAddress) {
      queryClient.invalidateQueries({ queryKey: ['envio-player', playerAddress] });
      queryClient.invalidateQueries({ queryKey: ['envio-player-pools', playerAddress] });
      queryClient.invalidateQueries({ queryKey: ['envio-has-player-joined'] });
      queryClient.invalidateQueries({ queryKey: ['envio-player-pool'] });
      queryClient.invalidateQueries({ queryKey: ['envio-joined-pools-detailed', playerAddress] });
      queryClient.invalidateQueries({ queryKey: ['envio-game-progress'] });
      queryClient.invalidateQueries({ queryKey: ['envio-has-player-chosen'] });
      queryClient.invalidateQueries({ queryKey: ['envio-player-choice'] });
      queryClient.invalidateQueries({ queryKey: ['envio-is-player-eliminated'] });
      queryClient.invalidateQueries({ queryKey: ['envio-game-results'] });
      queryClient.invalidateQueries({ queryKey: ['envio-latest-round-result'] });
    }
    queryClient.invalidateQueries({ queryKey: ['envio-top-players'] });
    queryClient.invalidateQueries({ queryKey: ['envio-joined-players'] });
    queryClient.invalidateQueries({ queryKey: ['envio-remaining-players'] });
  };
}