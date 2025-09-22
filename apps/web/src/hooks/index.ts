// Export all hooks for easy importing
export * from './use-contract';
export * from './use-staking';
export * from './use-pools';
export * from './use-game';
export * from './use-events';
export * from './use-player';

// Re-export commonly used hooks for convenience
export { 
  useContractAddress,
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
  useCanActivatePool,
  useActivePools,
  useFormattedPoolInfo
} from './use-pools';

export {
  useGameProgress,
  useCurrentRound,
  useRemainingPlayers,
  usePlayerChoice,
  useHasPlayerChosen,
  useIsPlayerEliminated,
  useMakeSelection,
  useClaimPrize,
  useClaimRefund,
  usePlayerGameState,
  useFormattedPlayerChoice
} from './use-game';

export {
  useWatchPoolCreated,
  useWatchPlayerJoined,
  useWatchGameCompleted,
  useGameEventWatchers
} from './use-events';

export {
  usePlayerJoinedPools,
  usePlayerPoolsDetails,
  usePlayerPrizes,
  useHasJoinedPools,
  usePlayerStats,
  usePlayerClaimPrize,
  useClaimAbandonedPoolRefund,
  useUserParticipation,
  usePlayerGameResults,
  useCreatedPools,
  useHasCreatedPools,
  useHasClaimedPrize
} from './use-player';

export { useJoinedPlayers } from './use-joined-players';