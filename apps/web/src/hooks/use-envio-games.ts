import { useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/graphql/client';
import {
  GET_POOL_ROUNDS,
  GET_LATEST_ROUND_RESULT,
  GET_PLAYER_CHOICES,
} from '@/lib/graphql/queries';
import type {
  GameRound,
  PlayerChoice,
  GameRoundsResponse,
  PlayerChoicesResponse,
} from '@/lib/graphql/types';

// Get all rounds for a specific pool
export function useEnvioPoolRounds(poolId: string | undefined) {
  return useQuery({
    queryKey: ['envio-pool-rounds', poolId],
    queryFn: async () => {
      if (!poolId) return [];
      const response = await request<GameRoundsResponse>(GET_POOL_ROUNDS, {
        poolId,
      });
      return response.gameRounds;
    },
    enabled: !!poolId,
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // 30 seconds
  });
}

// Get the latest round result for a pool
export function useEnvioLatestRoundResult(poolId: string | undefined) {
  return useQuery({
    queryKey: ['envio-latest-round-result', poolId],
    queryFn: async () => {
      if (!poolId) return null;
      const response = await request<GameRoundsResponse>(GET_LATEST_ROUND_RESULT, {
        poolId,
      });
      return response.gameRounds[0] || null;
    },
    enabled: !!poolId,
    staleTime: 10000, // 10 seconds
    refetchInterval: 20000, // 20 seconds
  });
}

// Get player choices for a specific pool
export function useEnvioPlayerChoices(poolId: string | undefined, playerAddress: string | undefined) {
  return useQuery({
    queryKey: ['envio-player-choices', poolId, playerAddress],
    queryFn: async () => {
      if (!poolId || !playerAddress) return [];
      const response = await request<PlayerChoicesResponse>(GET_PLAYER_CHOICES, {
        poolId,
        playerAddress: playerAddress.toLowerCase(),
      });
      return response.playerChoices;
    },
    enabled: !!(poolId && playerAddress),
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // 30 seconds
  });
}

// Get current round for a pool (based on latest round + 1)
export function useEnvioCurrentRound(poolId: string | undefined) {
  return useQuery({
    queryKey: ['envio-current-round', poolId],
    queryFn: async () => {
      if (!poolId) return 1;

      const query = `
        query GetCurrentRound($poolId: String!) {
          gameRounds(
            where: { pool: $poolId }
            orderBy: roundNumber
            orderDirection: desc
            first: 1
          ) {
            roundNumber
          }
          pool(id: $poolId) {
            currentRound
            status
          }
        }
      `;

      const response = await request<{
        gameRounds: { roundNumber: number }[];
        pool: { currentRound: number; status: string } | null;
      }>(query, { poolId });

      // If pool has a currentRound field, use that
      if (response.pool?.currentRound) {
        return response.pool.currentRound;
      }

      // Otherwise, calculate based on latest completed round
      const latestRound = response.gameRounds[0];
      return latestRound ? latestRound.roundNumber + 1 : 1;
    },
    enabled: !!poolId,
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // 30 seconds
  });
}

// Get game progress for a pool
export function useEnvioGameProgress(poolId: string | undefined) {
  return useQuery({
    queryKey: ['envio-game-progress', poolId],
    queryFn: async () => {
      if (!poolId) return null;

      const query = `
        query GetGameProgress($poolId: String!) {
          pool(id: $poolId) {
            id
            status
            currentRound
            maxPlayers
            currentPlayers
            players {
              id
              isEliminated
              hasWon
              eliminatedInRound
            }
          }
          gameRounds(
            where: { pool: $poolId }
            orderBy: roundNumber
            orderDirection: desc
            first: 1
          ) {
            roundNumber
            remainingCount
            eliminatedCount
          }
        }
      `;

      const response = await request<{
        pool: any;
        gameRounds: any[];
      }>(query, { poolId });

      const pool = response.pool;
      const latestRound = response.gameRounds[0];

      return {
        poolId,
        status: pool?.status,
        currentRound: pool?.currentRound || 1,
        maxPlayers: pool?.maxPlayers || 0,
        currentPlayers: pool?.currentPlayers || 0,
        remainingPlayers: latestRound?.remainingCount || pool?.currentPlayers || 0,
        eliminatedPlayers: latestRound?.eliminatedCount || 0,
        activePlayers: pool?.players?.filter((p: any) => !p.isEliminated) || [],
        eliminatedPlayersData: pool?.players?.filter((p: any) => p.isEliminated) || [],
      };
    },
    enabled: !!poolId,
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // 30 seconds
  });
}

// Check if player has made choice in current round
export function useEnvioHasPlayerChosen(
  poolId: string | undefined,
  playerAddress: string | undefined,
  currentRound?: number
) {
  return useQuery({
    queryKey: ['envio-has-player-chosen', poolId, playerAddress, currentRound],
    queryFn: async () => {
      if (!poolId || !playerAddress || !currentRound) return false;

      const query = `
        query HasPlayerChosen($poolId: String!, $playerAddress: String!, $roundNumber: Int!) {
          playerChoices(
            where: {
              pool: $poolId,
              player: $playerAddress,
              round_: { roundNumber: $roundNumber }
            }
            first: 1
          ) {
            id
          }
        }
      `;

      const response = await request<{ playerChoices: { id: string }[] }>(query, {
        poolId,
        playerAddress: playerAddress.toLowerCase(),
        roundNumber: currentRound,
      });

      return response.playerChoices.length > 0;
    },
    enabled: !!(poolId && playerAddress && currentRound),
    staleTime: 10000, // 10 seconds
    refetchInterval: 20000, // 20 seconds
  });
}

// Get player's choice for a specific round
export function useEnvioPlayerChoice(
  poolId: string | undefined,
  playerAddress: string | undefined,
  roundNumber: number | undefined
) {
  return useQuery({
    queryKey: ['envio-player-choice', poolId, playerAddress, roundNumber],
    queryFn: async () => {
      if (!poolId || !playerAddress || roundNumber === undefined) return null;

      const query = `
        query GetPlayerChoice($poolId: String!, $playerAddress: String!, $roundNumber: Int!) {
          playerChoices(
            where: {
              pool: $poolId,
              player: $playerAddress,
              round_: { roundNumber: $roundNumber }
            }
            first: 1
          ) {
            id
            choice
            wasWinningChoice
            madeAt
          }
        }
      `;

      const response = await request<{ playerChoices: PlayerChoice[] }>(query, {
        poolId,
        playerAddress: playerAddress.toLowerCase(),
        roundNumber,
      });

      return response.playerChoices[0] || null;
    },
    enabled: !!(poolId && playerAddress && roundNumber !== undefined),
    staleTime: 30000, // 30 seconds - choices don't change
  });
}

// Check if player is eliminated
export function useEnvioIsPlayerEliminated(poolId: string | undefined, playerAddress: string | undefined) {
  return useQuery({
    queryKey: ['envio-is-player-eliminated', poolId, playerAddress],
    queryFn: async () => {
      if (!poolId || !playerAddress) return false;

      const query = `
        query IsPlayerEliminated($poolId: String!, $playerAddress: String!) {
          playerPools(
            where: {
              pool: $poolId,
              player: $playerAddress
            }
            first: 1
          ) {
            isEliminated
            eliminatedInRound
          }
        }
      `;

      const response = await request<{
        playerPools: { isEliminated: boolean; eliminatedInRound?: number }[]
      }>(query, {
        poolId,
        playerAddress: playerAddress.toLowerCase(),
      });

      const playerPool = response.playerPools[0];
      return playerPool ? playerPool.isEliminated : false;
    },
    enabled: !!(poolId && playerAddress),
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // 30 seconds
  });
}

// Get game results (replacement for useGameResults)
export function useEnvioGameResults(poolId: string | undefined) {
  const roundsQuery = useEnvioPoolRounds(poolId);

  return {
    rounds: roundsQuery.data || [],
    playerChoices: roundsQuery.data?.flatMap(round => round.playerChoices || []) || [],
    winner: null, // Would need to fetch from pool data
    isLoading: roundsQuery.isLoading,
    error: roundsQuery.error,
  };
}

// Hook to invalidate all game-related queries
export function useInvalidateGames() {
  const queryClient = useQueryClient();

  return (poolId?: string) => {
    if (poolId) {
      queryClient.invalidateQueries({ queryKey: ['envio-pool-rounds', poolId] });
      queryClient.invalidateQueries({ queryKey: ['envio-latest-round-result', poolId] });
      queryClient.invalidateQueries({ queryKey: ['envio-player-choices', poolId] });
      queryClient.invalidateQueries({ queryKey: ['envio-current-round', poolId] });
      queryClient.invalidateQueries({ queryKey: ['envio-game-progress', poolId] });
      queryClient.invalidateQueries({ queryKey: ['envio-has-player-chosen', poolId] });
      queryClient.invalidateQueries({ queryKey: ['envio-is-player-eliminated', poolId] });
    }
    queryClient.invalidateQueries({ queryKey: ['envio-pool-rounds'] });
    queryClient.invalidateQueries({ queryKey: ['envio-latest-round-result'] });
    queryClient.invalidateQueries({ queryKey: ['envio-game-progress'] });
  };
}