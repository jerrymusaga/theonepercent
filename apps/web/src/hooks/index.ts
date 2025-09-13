// Export all hooks for easy importing
export * from './use-contract';
export * from './use-staking';
export * from './use-pools';
export * from './use-game';
export * from './use-events';

// Re-export commonly used hooks for convenience
export { 
  useCoinTossContract,
  useContractAddress,
  useCoinTossWrite,
  useCoinTossRead 
} from './use-contract';

export {
  useCreatorInfo,
  useStakeForPoolCreation,
  useUnstakeAndClaim,
  useStakingStats
} from './use-staking';

export {
  usePoolInfo,
  useCreatePool,
  useJoinPool,
  useActivatePool,
  useActivePools,
  useFormattedPoolInfo
} from './use-pools';

export {
  useGameProgress,
  useMakeSelection,
  useClaimPrize,
  usePlayerGameState
} from './use-game';

export {
  useWatchPoolCreated,
  useWatchPlayerJoined,
  useWatchGameCompleted,
  useGameEventWatchers
} from './use-events';