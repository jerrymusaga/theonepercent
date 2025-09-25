/**
 * Feature flags for the application
 */
export const FEATURE_FLAGS = {
  // Enable Envio indexer instead of manual event parsing
  USE_ENVIO_INDEXER: true,

  // Other feature flags can be added here
  // ENABLE_VERIFICATION: true,
  // ENABLE_ADVANCED_GAME_MODES: false,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;