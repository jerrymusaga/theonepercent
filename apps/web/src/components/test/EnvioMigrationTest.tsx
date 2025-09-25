'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';

// Old hooks (current implementation)
import { useAllPools as useOldAllPools } from '@/hooks/use-pools';
import { usePlayerStats } from '@/hooks/use-player';
import { useCreatorInfo as useCreatorStats } from '@/hooks/use-staking';
import { useGameResults } from '@/hooks/use-events';

// New Envio hooks
import {
  useAllPools as useEnvioAllPools,
  useEnvioActivePools,
  useEnvioOpenPools,
} from '@/hooks/use-envio-pools';

import {
  useEnvioPlayer,
  useEnvioTopPlayers,
  useEnvioPlayerPools,
} from '@/hooks/use-envio-players';

import {
  useCreatorInfo,
  useEnvioTopCreators,
  useEnvioCreatorPools,
} from '@/hooks/use-envio-creators';

import {
  useEnvioGameResults,
  useEnvioGameProgress,
} from '@/hooks/use-envio-games';

interface ComparisonSectionProps {
  title: string;
  children: React.ReactNode;
}

const ComparisonSection: React.FC<ComparisonSectionProps> = ({ title, children }) => (
  <div className="border border-gray-300 rounded-lg p-4 mb-6">
    <h3 className="text-lg font-semibold mb-3 text-gray-800">{title}</h3>
    {children}
  </div>
);

interface DataDisplayProps {
  title: string;
  data: any;
  isLoading: boolean;
  error: any;
  variant: 'old' | 'new';
}

const DataDisplay: React.FC<DataDisplayProps> = ({ title, data, isLoading, error, variant }) => (
  <div className={`p-3 rounded border-2 ${
    variant === 'old'
      ? 'border-blue-200 bg-blue-50'
      : 'border-green-200 bg-green-50'
  }`}>
    <h4 className={`font-medium mb-2 ${
      variant === 'old' ? 'text-blue-800' : 'text-green-800'
    }`}>
      {variant === 'old' ? '🔵 Current (RPC)' : '🟢 New (Envio)'} - {title}
    </h4>

    <div className="space-y-1 text-sm">
      <div className="flex items-center gap-2">
        <span className="font-medium">Status:</span>
        {isLoading && <span className="text-yellow-600">Loading...</span>}
        {error && <span className="text-red-600">Error: {error.message}</span>}
        {!isLoading && !error && <span className="text-green-600">Success</span>}
      </div>

      <div className="flex items-center gap-2">
        <span className="font-medium">Data Count:</span>
        <span>{Array.isArray(data) ? data.length : data ? 1 : 0}</span>
      </div>

      {data && (
        <details className="mt-2">
          <summary className="cursor-pointer font-medium text-gray-700">
            View Data Structure
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      )}
    </div>
  </div>
);

export default function EnvioMigrationTest() {
  const { address } = useAccount();
  const [testPoolId, setTestPoolId] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Old hooks
  const oldPools = useOldAllPools();
  const oldPlayerStats = usePlayerStats(address);
  const oldCreatorStats = useCreatorStats(address);
  const oldGameResults = useGameResults(testPoolId ? parseInt(testPoolId) : 0);

  // New Envio hooks - Pools
  const newAllPools = useEnvioAllPools();
  const newActivePools = useEnvioActivePools();
  const newOpenPools = useEnvioOpenPools();

  // New Envio hooks - Players
  const newPlayer = useEnvioPlayer(address);
  const newTopPlayers = useEnvioTopPlayers(10);
  const newPlayerPools = useEnvioPlayerPools(address);

  // New Envio hooks - Creators
  const newCreatorInfo = useCreatorInfo(address);
  const newTopCreators = useEnvioTopCreators(10);
  const newCreatorPools = useEnvioCreatorPools(address);

  // New Envio hooks - Games
  const newGameResults = useEnvioGameResults(testPoolId || undefined);
  const newGameProgress = useEnvioGameProgress(testPoolId || undefined);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">
          🔄 Envio Migration Test Dashboard
        </h1>
        <p className="text-gray-600 mb-4">
          This component compares the current RPC-based event hooks with the new Envio-based hooks.
          Use this to validate that the migration maintains data consistency and improves performance.
        </p>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Note:</strong> The Envio hooks will show loading/error states until the indexer is running.
                This is expected during development setup.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <label htmlFor="poolId" className="font-medium text-gray-700">
              Test Pool ID:
            </label>
            <input
              id="poolId"
              type="text"
              value={testPoolId}
              onChange={(e) => setTestPoolId(e.target.value)}
              placeholder="Enter pool ID for game testing"
              className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Tests
          </button>
        </div>

        {address && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-6">
            <p className="text-blue-800">
              <strong>Connected Address:</strong> {address}
            </p>
          </div>
        )}
      </div>

      {/* Pool Data Comparison */}
      <ComparisonSection title="📊 Pool Data Comparison">
        <div className="grid md:grid-cols-2 gap-4">
          <DataDisplay
            title="All Pools"
            data={oldPools.pools}
            isLoading={oldPools.isLoading}
            error={oldPools.hasError ? new Error('Pool loading error') : null}
            variant="old"
          />
          <DataDisplay
            title="All Pools"
            data={newAllPools.data}
            isLoading={newAllPools.isLoading}
            error={newAllPools.error}
            variant="new"
          />
        </div>
      </ComparisonSection>

      {/* Player Data Comparison */}
      <ComparisonSection title="👤 Player Data Comparison">
        <div className="grid md:grid-cols-2 gap-4">
          <DataDisplay
            title="Player Stats"
            data={oldPlayerStats.stats}
            isLoading={oldPlayerStats.isLoading}
            error={null}
            variant="old"
          />
          <DataDisplay
            title="Player Info"
            data={newPlayer.data}
            isLoading={newPlayer.isLoading}
            error={newPlayer.error}
            variant="new"
          />
        </div>

        <div className="mt-4">
          <h4 className="font-medium mb-2 text-gray-800">🏆 Top Players (New Feature)</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 rounded border-2 border-gray-200 bg-gray-50">
              <p className="text-gray-600 text-sm">Not available in old system</p>
            </div>
            <DataDisplay
              title="Top 10 Players"
              data={newTopPlayers.data}
              isLoading={newTopPlayers.isLoading}
              error={newTopPlayers.error}
              variant="new"
            />
          </div>
        </div>
      </ComparisonSection>

      {/* Creator Data Comparison */}
      <ComparisonSection title="🎯 Creator Data Comparison">
        <div className="grid md:grid-cols-2 gap-4">
          <DataDisplay
            title="Creator Stats"
            data={oldCreatorStats.data}
            isLoading={oldCreatorStats.isLoading}
            error={oldCreatorStats.error}
            variant="old"
          />
          <DataDisplay
            title="Creator Info"
            data={newCreatorInfo.data}
            isLoading={newCreatorInfo.isLoading}
            error={newCreatorInfo.error}
            variant="new"
          />
        </div>

        <div className="mt-4">
          <h4 className="font-medium mb-2 text-gray-800">🏆 Top Creators (New Feature)</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 rounded border-2 border-gray-200 bg-gray-50">
              <p className="text-gray-600 text-sm">Not available in old system</p>
            </div>
            <DataDisplay
              title="Top 10 Creators"
              data={newTopCreators.data}
              isLoading={newTopCreators.isLoading}
              error={newTopCreators.error}
              variant="new"
            />
          </div>
        </div>
      </ComparisonSection>

      {/* Game Data Comparison */}
      {testPoolId && (
        <ComparisonSection title="🎮 Game Data Comparison">
          <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded">
            <p className="text-indigo-800">
              <strong>Testing with Pool ID:</strong> {testPoolId}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <DataDisplay
              title="Game Results"
              data={oldGameResults}
              isLoading={oldGameResults.isLoading}
              error={oldGameResults.error}
              variant="old"
            />
            <DataDisplay
              title="Game Results"
              data={newGameResults}
              isLoading={newGameResults.isLoading}
              error={newGameResults.error}
              variant="new"
            />
          </div>

          <div className="mt-4">
            <h4 className="font-medium mb-2 text-gray-800">📈 Game Progress (Enhanced)</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-3 rounded border-2 border-gray-200 bg-gray-50">
                <p className="text-gray-600 text-sm">Limited progress tracking in old system</p>
              </div>
              <DataDisplay
                title="Game Progress"
                data={newGameProgress.data}
                isLoading={newGameProgress.isLoading}
                error={newGameProgress.error}
                variant="new"
              />
            </div>
          </div>
        </ComparisonSection>
      )}

      {/* Advanced Tests */}
      {showAdvanced && (
        <ComparisonSection title="⚡ Advanced Features & Performance">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2 text-gray-800">🚀 New Envio-Only Features</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <DataDisplay
                  title="Active Pools"
                  data={newActivePools.data}
                  isLoading={newActivePools.isLoading}
                  error={newActivePools.error}
                  variant="new"
                />
                <DataDisplay
                  title="Open Pools"
                  data={newOpenPools.data}
                  isLoading={newOpenPools.isLoading}
                  error={newOpenPools.error}
                  variant="new"
                />
                <DataDisplay
                  title="Player Pool History"
                  data={newPlayerPools.data}
                  isLoading={newPlayerPools.isLoading}
                  error={newPlayerPools.error}
                  variant="new"
                />
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2 text-gray-800">📊 Performance Metrics</h4>
              <div className="bg-gray-50 p-4 rounded">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-blue-800 mb-2">Old System (RPC)</h5>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Manual event watching with timeouts</li>
                      <li>• Network-specific polling (8s mainnet, 30s testnet)</li>
                      <li>• Limited to active connection data</li>
                      <li>• No historical aggregation</li>
                      <li>• Potential RPC rate limiting</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-green-800 mb-2">New System (Envio)</h5>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Real-time indexing with GraphQL caching</li>
                      <li>• 15-30 second stale time optimization</li>
                      <li>• Full historical data access</li>
                      <li>• Aggregated statistics and leaderboards</li>
                      <li>• No RPC rate limiting concerns</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ComparisonSection>
      )}

      {/* Usage Instructions */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">📋 Testing Instructions</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p><strong>1. Connect Wallet:</strong> Connect your wallet to see personalized data comparisons</p>
          <p><strong>2. Test Pool Data:</strong> Enter a known pool ID to test game-specific functionality</p>
          <p><strong>3. Monitor Status:</strong> Watch for loading states and error handling differences</p>
          <p><strong>4. Compare Data:</strong> Verify data consistency between old and new systems</p>
          <p><strong>5. Performance:</strong> Notice improved loading times once Envio indexer is running</p>
        </div>
      </div>
    </div>
  );
}