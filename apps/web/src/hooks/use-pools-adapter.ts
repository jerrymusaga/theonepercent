/**
 * Smart adapter that switches between old and new pool implementations
 * based on feature flags. This allows for gradual migration and rollback.
 */

// For now, just use the original implementation until we have the Envio version ready
export {
  useAllPools,
  useActivePools,
  usePoolInfo,
  useFormattedPoolInfo,
} from './use-pools';

// Write operations always use the original hooks since they don't depend on indexing
export {
  useCreatePool,
  useJoinPool,
  useActivatePool,
  useCurrentPoolId,
  useCanActivatePool,
  useIsPoolAbandoned
} from './use-pools';