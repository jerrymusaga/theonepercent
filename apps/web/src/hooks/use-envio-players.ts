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
        playerAddress: playerAddress.toLowerCase()
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

// Hook to invalidate all player-related queries
export function useInvalidatePlayers() {
  const queryClient = useQueryClient();

  return (playerAddress?: string) => {
    if (playerAddress) {
      queryClient.invalidateQueries({ queryKey: ['envio-player', playerAddress] });
      queryClient.invalidateQueries({ queryKey: ['envio-player-pools', playerAddress] });
      queryClient.invalidateQueries({ queryKey: ['envio-has-player-joined'] });
      queryClient.invalidateQueries({ queryKey: ['envio-player-pool'] });
    }
    queryClient.invalidateQueries({ queryKey: ['envio-top-players'] });
    queryClient.invalidateQueries({ queryKey: ['envio-joined-players'] });
    queryClient.invalidateQueries({ queryKey: ['envio-remaining-players'] });
  };
}