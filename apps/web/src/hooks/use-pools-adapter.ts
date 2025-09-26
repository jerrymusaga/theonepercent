import { FEATURE_FLAGS } from '@/config/features';

// Conditional imports based on feature flag
const usePoolsImpl = FEATURE_FLAGS.USE_ENVIO_INDEXER
  ? () => import('./use-pools-envio').then(m => m)
  : () => import('./use-pools').then(m => m);

/**
 * Smart adapter that switches between old and new pool implementations
 * based on feature flags. This allows for gradual migration and rollback.
 */
export async function useAllPools() {
  const impl = await usePoolsImpl();
  return impl.useAllPools();
}

export async function useActivePools() {
  const impl = await usePoolsImpl();
  return impl.useActivePools();
}

export async function usePoolInfo(poolId: number) {
  const impl = await usePoolsImpl();
  return impl.usePoolInfo(poolId);
}

export async function useFormattedPoolInfo(poolId: number) {
  const impl = await usePoolsImpl();
  return impl.useFormattedPoolInfo(poolId);
}

// Write operations always use the original hooks since they don't depend on indexing
export {
  useCreatePool,
  useJoinPool,
  useActivatePool,
  useCurrentPoolId,
  useCanActivatePool,
  useIsPoolAbandoned
} from './use-pools';