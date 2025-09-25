import { useQuery } from '@tanstack/react-query';
import { usePublicClient, useChainId } from 'wagmi';
import { CONTRACT_CONFIG } from '@/lib/contract';
import { useContractAddress } from './use-contract';

/**
 * Hook to get all players who have joined a pool by watching PlayerJoined events
 */
export function useJoinedPlayers(poolId: number) {
  const publicClient = usePublicClient();
  const contractAddress = useContractAddress();
  const chainId = useChainId();

  // Use more aggressive refresh strategy on mainnet due to indexing delays
  const isMainnet = chainId === 42220; // Celo mainnet

  const {
    data: joinedPlayers = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['joinedPlayers', poolId],
    queryFn: async () => {
      if (!publicClient || !contractAddress || poolId <= 0) {
        return [];
      }

      try {
        // Get current block for reasonable range calculation
        const currentBlock = await publicClient.getBlockNumber();

        // Use last 150k blocks for mainnet (about 3-4 weeks), earliest for testnet
        const fromBlock = isMainnet
          ? currentBlock - BigInt(150000)
          : 'earliest' as const;

        // First try to get events with timeout for faster fallback
        const logs = await Promise.race([
          publicClient.getLogs({
            address: contractAddress,
            event: {
              type: 'event',
              name: 'PlayerJoined',
              inputs: [
                { name: 'poolId', type: 'uint256', indexed: true },
                { name: 'player', type: 'address', indexed: true },
                { name: 'currentPlayers', type: 'uint256', indexed: false },
                { name: 'maxPlayers', type: 'uint256', indexed: false }
              ]
            },
            args: { poolId: BigInt(poolId) },
            fromBlock,
            toBlock: 'latest',
          }),
          // Much longer timeout on mainnet to account for slower block times and indexing delays
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Event fetch timeout')), isMainnet ? 60000 : 30000)
          )
        ]) as any[];

        const playersFromEvents = logs
          .map(log => log.args?.player)
          .filter((player): player is `0x${string}` => !!player)
          .filter((player, index, array) => array.indexOf(player) === index);

        // If events work, return them
        if (playersFromEvents.length > 0) {
          return playersFromEvents;
        }

        // Fallback 1: Get current remaining players (fast and reliable)
        const remainingPlayers = await publicClient.readContract({
          address: contractAddress,
          abi: CONTRACT_CONFIG.abi,
          functionName: 'getRemainingPlayers',
          args: [BigInt(poolId)]
        }) as `0x${string}`[];

        // Fallback 2: If we have remaining players, return them
        if (remainingPlayers && remainingPlayers.length > 0) {
          return remainingPlayers;
        }

        // Fallback 3: Check pool status to see if anyone has joined
        const poolInfo = await publicClient.readContract({
          address: contractAddress,
          abi: CONTRACT_CONFIG.abi,
          functionName: 'getPoolInfo',
          args: [BigInt(poolId)]
        }) as readonly [`0x${string}`, bigint, bigint, bigint, bigint, number];

        const currentPlayersCount = Number(poolInfo[3]); // currentPlayers is index 3

        // If pool shows players joined but no remaining (game completed/abandoned),
        // we can't determine specific players but we know someone joined
        if (currentPlayersCount > 0) {
          console.warn(`Pool ${poolId} has ${currentPlayersCount} players but events/remaining players failed to load`);

          // Return empty array but log the issue - the UI will handle this differently
          return [];
        }

        return [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!publicClient && !!contractAddress && poolId > 0,
    staleTime: isMainnet ? 90000 : 30000, // 90s on mainnet (18x block time), 30s on testnet
    gcTime: isMainnet ? 20 * 60 * 1000 : 10 * 60 * 1000, // 20min on mainnet, 10min on testnet
    refetchInterval: isMainnet ? 120000 : false, // Auto-refetch every 2min on mainnet (very slow)
    refetchOnWindowFocus: true,
    retry: isMainnet ? 8 : 5, // Many more retries on mainnet
    retryDelay: attemptIndex => Math.min(5000 * 2 ** attemptIndex, 60000), // Much longer retry delays
  });

  return {
    joinedPlayers,
    isLoading,
    error,
    count: joinedPlayers.length
  };
}