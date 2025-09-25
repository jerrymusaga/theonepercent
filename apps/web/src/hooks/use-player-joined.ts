import { useQuery } from '@tanstack/react-query';
import { useAccount, usePublicClient, useChainId } from 'wagmi';
import { CONTRACT_CONFIG } from '@/lib/contract';
import { useContractAddress } from './use-contract';

/**
 * Direct hook to check if current user has joined a specific pool
 * More reliable than relying on event indexing
 */
export function useHasPlayerJoined(poolId: number) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const contractAddress = useContractAddress();
  const chainId = useChainId();
  const isMainnet = chainId === 42220;

  const {
    data: hasJoined = false,
    isLoading,
    error
  } = useQuery({
    queryKey: ['hasPlayerJoined', poolId, address, contractAddress, chainId],
    queryFn: async () => {
      if (!publicClient || !contractAddress || !address || poolId <= 0) {
        return false;
      }

      try {
        // Strategy 1: Check if user is in remaining players (fastest)
        const remainingPlayers = await publicClient.readContract({
          address: contractAddress,
          abi: CONTRACT_CONFIG.abi,
          functionName: 'getRemainingPlayers',
          args: [BigInt(poolId)]
        }) as `0x${string}`[];

        const isInRemaining = remainingPlayers.some(
          player => player.toLowerCase() === address.toLowerCase()
        );

        if (isInRemaining) {
          return true;
        }

        // Strategy 2: Check if user was eliminated (slower but reliable)
        const isEliminated = await publicClient.readContract({
          address: contractAddress,
          abi: CONTRACT_CONFIG.abi,
          functionName: 'isPlayerEliminated',
          args: [BigInt(poolId), address]
        }) as boolean;

        if (isEliminated) {
          return true; // Player was eliminated, so they must have joined
        }

        // Strategy 3: Check recent PlayerJoined events as final check
        if (isMainnet) {
          // Only try events on mainnet as a last resort with short range
          const currentBlock = await publicClient.getBlockNumber();

          try {
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
                args: { poolId: BigInt(poolId), player: address },
                fromBlock: currentBlock - BigInt(50000), // Recent blocks only
                toBlock: 'latest',
              }),
              // Longer timeout for mainnet events (6x block time)
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Event timeout')), 30000)
              )
            ]) as any[];

            return logs.length > 0;
          } catch (eventError) {
            console.warn('Event check failed, but contract state methods worked');
            return false;
          }
        }

        return false;
      } catch (error) {
        console.error('Failed to check if player joined pool:', error);
        return false;
      }
    },
    enabled: !!publicClient && !!contractAddress && !!address && poolId > 0,
    staleTime: isMainnet ? 60000 : 15000, // 60s on mainnet (12x block time), 15s on testnet
    gcTime: isMainnet ? 10 * 60 * 1000 : 2 * 60 * 1000, // 10min on mainnet, 2min on testnet
    refetchOnWindowFocus: true,
    refetchInterval: isMainnet ? 90000 : false, // Auto-refetch every 90s on mainnet
    retry: isMainnet ? 5 : 2, // More retries on mainnet
    retryDelay: attemptIndex => Math.min(5000 * 2 ** attemptIndex, 30000), // Longer delays
  });

  return {
    hasJoined,
    isLoading,
    error
  };
}