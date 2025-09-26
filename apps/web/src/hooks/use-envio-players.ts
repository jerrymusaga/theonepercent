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

        const combined = {
          id: playerPool.pool_id,
          pool_id: playerPool.pool_id,
          player_id: playerPool.player_id,
          status: playerPool.status,
          joinedAt: playerPool.joinedAt,
          eliminatedAt: playerPool.eliminatedAt,
          eliminatedInRound: playerPool.eliminatedInRound,
          chainId: playerPool.chainId,
          hasWon: pool.winner_id === playerPool.player_id,
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
          },
          poolInfo: {
            status: pool.status === 'WAITING_FOR_PLAYERS' ? 0 :
                   pool.status === 'ACTIVE' ? 1 :
                   pool.status === 'COMPLETED' ? 2 :
                   pool.status === 'ABANDONED' ? 3 : 0,
            entryFee: pool.entryFee,
            prizeAmount: pool.prizeAmount,
            winner: pool.winner_id,
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
    }
    queryClient.invalidateQueries({ queryKey: ['envio-top-players'] });
    queryClient.invalidateQueries({ queryKey: ['envio-joined-players'] });
    queryClient.invalidateQueries({ queryKey: ['envio-remaining-players'] });
  };
}