import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { useCoinTossRead, useContractAddress } from './use-contract';
import { PlayerChoice, GameProgress, CONTRACT_CONFIG } from '@/lib/contract';

/**
 * Hook to get game progress for a pool
 */
export function useGameProgress(poolId: number) {
  return useCoinTossRead('getGameProgress', [BigInt(poolId)], {
    enabled: poolId > 0,
  }) as {
    data: GameProgress | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
}

/**
 * Hook to get current round for a pool
 */
export function useCurrentRound(poolId: number) {
  return useCoinTossRead('getCurrentRound', [BigInt(poolId)], {
    enabled: poolId > 0,
  }) as {
    data: bigint | undefined;
    isLoading: boolean;
    error: Error | null;
  };
}

/**
 * Hook to get remaining players in a pool
 */
export function useRemainingPlayers(poolId: number) {
  return useCoinTossRead('getRemainingPlayers', [BigInt(poolId)], {
    enabled: poolId > 0,
  }) as {
    data: `0x${string}`[] | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
}

/**
 * Hook to get player's choice for a specific pool and round
 */
export function usePlayerChoice(poolId: number, playerAddress?: `0x${string}`) {
  const { address } = useAccount();
  const targetAddress = playerAddress || address;

  return useCoinTossRead(
    'getPlayerChoice',
    targetAddress ? [BigInt(poolId), targetAddress] : undefined,
    { enabled: poolId > 0 && !!targetAddress }
  ) as {
    data: PlayerChoice | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
}

/**
 * Hook to check if player has chosen in current round
 */
export function useHasPlayerChosen(poolId: number, playerAddress?: `0x${string}`) {
  const { address } = useAccount();
  const targetAddress = playerAddress || address;

  return useCoinTossRead(
    'hasPlayerChosen',
    targetAddress ? [BigInt(poolId), targetAddress] : undefined,
    { enabled: poolId > 0 && !!targetAddress }
  ) as {
    data: boolean | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
}

/**
 * Hook to check if player is eliminated
 */
export function useIsPlayerEliminated(poolId: number, playerAddress?: `0x${string}`) {
  const { address } = useAccount();
  const targetAddress = playerAddress || address;

  return useCoinTossRead(
    'isPlayerEliminated',
    targetAddress ? [BigInt(poolId), targetAddress] : undefined,
    { enabled: poolId > 0 && !!targetAddress }
  ) as {
    data: boolean | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
}

/**
 * Hook for making a selection (HEADS or TAILS)
 */
export function useMakeSelection() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const contractAddress = useContractAddress();
  const queryClient = useQueryClient();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const makeSelection = useMutation({
    mutationFn: async (params: { poolId: number; choice: PlayerChoice }) => {
      if (!writeContract || !contractAddress) throw new Error('Contract not available');
      if (params.choice === PlayerChoice.NONE) {
        throw new Error('Invalid choice');
      }
      
      return writeContract({
        address: contractAddress,
        abi: CONTRACT_CONFIG.abi,
        functionName: 'makeSelection',
        args: [BigInt(params.poolId), params.choice],
      });
    },
    onSuccess: (_, { poolId }) => {
      // Invalidate relevant queries to refresh game state
      queryClient.invalidateQueries({ queryKey: ['getGameProgress', poolId] });
      queryClient.invalidateQueries({ queryKey: ['getRemainingPlayers', poolId] });
      queryClient.invalidateQueries({ queryKey: ['hasPlayerChosen', poolId] });
      queryClient.invalidateQueries({ queryKey: ['getPlayerChoice', poolId] });
      queryClient.invalidateQueries({ queryKey: ['getPoolInfo', poolId] });
    },
  });

  return {
    makeSelection: makeSelection.mutate,
    makeSelectionAsync: makeSelection.mutateAsync,
    isPending: isPending || makeSelection.isPending,
    isConfirming,
    isConfirmed,
    error: error || makeSelection.error,
    hash,
  };
}

/**
 * Hook for claiming prize when game is completed
 */
export function useClaimPrize() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const contractAddress = useContractAddress();
  const queryClient = useQueryClient();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const claimPrize = useMutation({
    mutationFn: async (poolId: number) => {
      if (!writeContract || !contractAddress) throw new Error('Contract not available');
      
      return writeContract({
        address: contractAddress,
        abi: CONTRACT_CONFIG.abi,
        functionName: 'claimPrize',
        args: [BigInt(poolId)],
      });
    },
    onSuccess: (_, poolId) => {
      // Invalidate pool info to refresh the data
      queryClient.invalidateQueries({ queryKey: ['getPoolInfo', poolId] });
    },
  });

  return {
    claimPrize: claimPrize.mutate,
    claimPrizeAsync: claimPrize.mutateAsync,
    isPending: isPending || claimPrize.isPending,
    isConfirming,
    isConfirmed,
    error: error || claimPrize.error,
    hash,
  };
}

/**
 * Hook for claiming refund from abandoned pool
 */
export function useClaimRefund() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const contractAddress = useContractAddress();
  const queryClient = useQueryClient();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const claimRefund = useMutation({
    mutationFn: async (poolId: number) => {
      if (!writeContract || !contractAddress) throw new Error('Contract not available');
      
      return writeContract({
        address: contractAddress,
        abi: CONTRACT_CONFIG.abi,
        functionName: 'claimRefundFromAbandonedPool',
        args: [BigInt(poolId)],
      });
    },
    onSuccess: (_, poolId) => {
      // Invalidate pool info to refresh the data
      queryClient.invalidateQueries({ queryKey: ['getPoolInfo', poolId] });
    },
  });

  return {
    claimRefund: claimRefund.mutate,
    claimRefundAsync: claimRefund.mutateAsync,
    isPending: isPending || claimRefund.isPending,
    isConfirming,
    isConfirmed,
    error: error || claimRefund.error,
    hash,
  };
}

/**
 * Hook to get comprehensive game state for a player
 */
export function usePlayerGameState(poolId: number) {
  const { address } = useAccount();
  const gameProgress = useGameProgress(poolId);
  const remainingPlayers = useRemainingPlayers(poolId);
  const playerChoice = usePlayerChoice(poolId);
  const hasChosen = useHasPlayerChosen(poolId);
  const isEliminated = useIsPlayerEliminated(poolId);

  const isPlayerInGame = address && remainingPlayers.data?.includes(address);
  const canMakeChoice = !isEliminated.data && !hasChosen.data && isPlayerInGame;

  return {
    gameProgress: gameProgress.data,
    remainingPlayers: remainingPlayers.data || [],
    playerChoice: playerChoice.data,
    hasChosen: hasChosen.data || false,
    isEliminated: isEliminated.data || false,
    isPlayerInGame: !!isPlayerInGame,
    canMakeChoice,
    isLoading: gameProgress.isLoading || remainingPlayers.isLoading || 
               playerChoice.isLoading || hasChosen.isLoading || isEliminated.isLoading,
    error: gameProgress.error || remainingPlayers.error || 
           playerChoice.error || hasChosen.error || isEliminated.error,
    refetch: () => {
      gameProgress.refetch();
      remainingPlayers.refetch();
    },
  };
}

/**
 * Helper hook to format player choice as string
 */
export function useFormattedPlayerChoice(choice: PlayerChoice | undefined) {
  if (choice === undefined || choice === PlayerChoice.NONE) return 'Not chosen';
  return choice === PlayerChoice.HEADS ? 'HEADS' : 'TAILS';
}