"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useBalance } from "wagmi";
import { formatEther } from "viem";
import {
  Crown,
  TrendingUp,
  Users,
  Coins,
  Clock,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  Trophy,
  Target,
  BarChart3,
  Zap,
  Download,
  RefreshCw,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useCreatorInfo,
  useCreatorReward,
  useActivePools,
  useActivatePool,
  useWatchPoolCreated,
  useWatchPoolActivated,
  useWatchGameCompleted,
  useWatchPlayerJoined,
  useUnstakeAndClaim,
  useStakingStats
} from "@/hooks";
import { useToast } from "@/hooks/use-toast";
import { PoolStatus } from "@/lib/contract";

// Loading component
const LoadingSpinner = ({ className = "" }: { className?: string }) => (
  <div className={`animate-spin rounded-full border-b-2 border-current ${className}`}></div>
);

// Error component
const ErrorBanner = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <Card className="p-4 bg-red-50 border-red-200">
    <div className="flex items-center gap-3">
      <AlertTriangle className="w-5 h-5 text-red-600" />
      <div className="flex-1">
        <p className="font-medium text-red-800">Error</p>
        <p className="text-sm text-red-700">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  </Card>
);

// Access control components
const WalletConnectionRequired = () => (
  <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
    <Card className="p-8 text-center max-w-md mx-4">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Wallet className="w-8 h-8 text-blue-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
      <p className="text-gray-600 mb-6">
        You need to connect your wallet to access your creator dashboard.
      </p>
      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
        Connect Wallet
      </Button>
    </Card>
  </div>
);

const StakingRequired = ({ error }: { error?: any }) => (
  <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
    <Card className="p-8 text-center max-w-md mx-4">
      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Crown className="w-8 h-8 text-purple-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Become a Creator</h2>
      <p className="text-gray-600 mb-6">
        You need to stake CELO first to access your creator dashboard and start creating game pools.
      </p>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            Debug: {error.message || 'Contract read error'}
          </p>
        </div>
      )}
      <Button
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
        onClick={() => window.location.href = '/stake'}
      >
        Start Staking
      </Button>
    </Card>
  </div>
);

// Helper functions
const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

const calculateStats = (pools: any[]) => {
  if (!pools || pools.length === 0) {
    return {
      averagePoolSize: "0",
      completionRate: "0%",
      totalPlayersHosted: 0,
      bestPerformingEntry: "0 CELO"
    };
  }

  const completedPools = pools.filter(pool => pool.status === PoolStatus.COMPLETED);
  const totalPlayers = pools.reduce((sum, pool) => sum + Number(pool.currentPlayers), 0);
  const averageSize = pools.length > 0 ? (totalPlayers / pools.length).toFixed(1) : "0";
  const completionRate = pools.length > 0 ? ((completedPools.length / pools.length) * 100).toFixed(0) : "0";

  return {
    averagePoolSize: averageSize,
    completionRate: `${completionRate}%`,
    totalPlayersHosted: totalPlayers,
    bestPerformingEntry: "2.5 CELO" // TODO: Calculate from actual pool performance
  };
};

interface CreatorStatsProps {
  creatorInfo?: {
    stakedAmount: bigint;
    poolsCreated: bigint;
    poolsRemaining: bigint;
    hasActiveStake: boolean;
  };
  totalEarnings?: bigint;
  activePools: any[];
  stats: {
    averagePoolSize: string;
    completionRate: string;
    totalPlayersHosted: number;
    bestPerformingEntry: string;
  };
  isLoading?: boolean;
}

const CreatorStatsOverview = ({ creatorInfo, totalEarnings, activePools, stats, isLoading }: CreatorStatsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="w-5 h-5 bg-gray-200 rounded"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const earnings = totalEarnings ? formatEther(totalEarnings) : "0";
  const poolsCreated = creatorInfo?.poolsCreated ? Number(creatorInfo.poolsCreated) : 0;
  const poolsRemaining = creatorInfo?.poolsRemaining ? Number(creatorInfo.poolsRemaining) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total earnings */}
      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-green-500 rounded-full">
            <Coins className="w-6 h-6 text-white" />
          </div>
          <TrendingUp className="w-5 h-5 text-green-600" />
        </div>
        <h3 className="text-sm font-medium text-green-800 mb-1">Total Earnings</h3>
        <p className="text-2xl font-bold text-green-600">{parseFloat(earnings).toFixed(4)} CELO</p>
        <p className="text-xs text-green-700 mt-1">From {poolsCreated} pools created</p>
      </Card>

      {/* Active pools */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-500 rounded-full">
            <Play className="w-6 h-6 text-white" />
          </div>
          <Users className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-sm font-medium text-blue-800 mb-1">Active Pools</h3>
        <p className="text-2xl font-bold text-blue-600">{activePools.length}</p>
        <p className="text-xs text-blue-700 mt-1">{poolsRemaining} slots remaining</p>
      </Card>

      {/* Success rate */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-purple-500 rounded-full">
            <Target className="w-6 h-6 text-white" />
          </div>
          <BarChart3 className="w-5 h-5 text-purple-600" />
        </div>
        <h3 className="text-sm font-medium text-purple-800 mb-1">Success Rate</h3>
        <p className="text-2xl font-bold text-purple-600">{stats.completionRate}</p>
        <p className="text-xs text-purple-700 mt-1">Pools completed successfully</p>
      </Card>

      {/* Average pool size */}
      <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-orange-500 rounded-full">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <Clock className="w-5 h-5 text-orange-600" />
        </div>
        <h3 className="text-sm font-medium text-orange-800 mb-1">Avg Pool Size</h3>
        <p className="text-2xl font-bold text-orange-600">{stats.averagePoolSize}</p>
        <p className="text-xs text-orange-700 mt-1">Players per pool</p>
      </Card>
    </div>
  );
};

const PoolCard = ({
  pool,
  onActivate,
  onViewPool
}: {
  pool: any;
  onActivate?: () => void;
  onViewPool?: (poolId: number, status: number) => void;
}) => {
  const getStatusColor = (status: number) => {
    switch (status) {
      case PoolStatus.OPENED: return 'bg-blue-100 text-blue-800 border-blue-200';
      case PoolStatus.ACTIVE: return 'bg-green-100 text-green-800 border-green-200';
      case PoolStatus.COMPLETED: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case PoolStatus.ABANDONED: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case PoolStatus.OPENED: return <Users className="w-4 h-4" />;
      case PoolStatus.ACTIVE: return <Play className="w-4 h-4" />;
      case PoolStatus.COMPLETED: return <CheckCircle2 className="w-4 h-4" />;
      case PoolStatus.ABANDONED: return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case PoolStatus.OPENED: return 'OPENED';
      case PoolStatus.ACTIVE: return 'ACTIVE';
      case PoolStatus.COMPLETED: return 'COMPLETED';
      case PoolStatus.ABANDONED: return 'ABANDONED';
      default: return 'UNKNOWN';
    }
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            #{Number(pool.id)}
          </div>
          <div>
            <p className="font-medium text-gray-900">Pool #{Number(pool.id)}</p>
            <p className="text-sm text-gray-500">
              Created by you
            </p>
          </div>
        </div>

        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(Number(pool.status))}`}>
          {getStatusIcon(Number(pool.status))}
          {getStatusText(Number(pool.status))}
        </div>
      </div>

      {/* Pool details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium">Entry Fee</span>
          </div>
          <p className="font-bold">{formatEther(pool.entryFee)} CELO</p>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">Players</span>
          </div>
          <p className="font-bold">
            {Number(pool.currentPlayers)}/{Number(pool.maxPlayers)}
          </p>
        </div>
      </div>

      {/* Status-specific info */}
      {Number(pool.status) === PoolStatus.OPENED && (
        <div className="p-3 bg-blue-50 rounded-lg mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-800">Waiting for players</span>
            <span className="font-bold text-blue-600">
              {Number(pool.maxPlayers) - Number(pool.currentPlayers)} slots left
            </span>
          </div>
          {Number(pool.currentPlayers) >= Number(pool.maxPlayers) && (
            <div className="mt-2">
              <Button
                size="sm"
                onClick={onActivate}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                Activate Pool
              </Button>
            </div>
          )}
        </div>
      )}

      {Number(pool.status) === PoolStatus.ACTIVE && (
        <div className="p-3 bg-green-50 rounded-lg mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-green-800">Game in progress</span>
            <span className="font-bold text-green-600">{Number(pool.currentPlayers)} players active</span>
          </div>
        </div>
      )}

      {Number(pool.status) === PoolStatus.COMPLETED && (
        <div className="p-3 bg-green-50 rounded-lg mb-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-800">Status:</span>
              <span className="font-bold text-green-600">Game Completed</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-800">Final Players:</span>
              <span className="font-mono text-green-600">{Number(pool.currentPlayers)}</span>
            </div>
          </div>
        </div>
      )}

      {Number(pool.status) === PoolStatus.ABANDONED && (
        <div className="p-3 bg-red-50 rounded-lg mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-red-800">Status:</span>
            <span className="text-red-600">Abandoned</span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {Number(pool.status) === PoolStatus.OPENED && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => window.location.href = `/pools?highlight=${pool.id}`}
          >
            <Eye className="w-4 h-4 mr-2" />
            View on Pools Page
          </Button>
        )}

        {Number(pool.status) === PoolStatus.ACTIVE && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewPool?.(Number(pool.id), Number(pool.status))}
          >
            <Play className="w-4 h-4 mr-2" />
            Watch Game
          </Button>
        )}

        {Number(pool.status) === PoolStatus.COMPLETED && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewPool?.(Number(pool.id), Number(pool.status))}
          >
            <Trophy className="w-4 h-4 mr-2" />
            View Results
          </Button>
        )}
      </div>
    </Card>
  );
};

export default function CreatorDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [showUnstakeConfirm, setShowUnstakeConfirm] = useState(false);

  // Wallet connection check
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  // Contract hooks with error handling
  const { data: creatorInfo, isLoading: creatorLoading, refetch: refetchCreator, error: creatorError } = useCreatorInfo();
  const { data: totalEarnings, isLoading: earningsLoading } = useCreatorReward();
  const { pools: activePoolsData = [], isLoading: poolsLoading, refetch: refetchPools } = useActivePools();
  const activePools = activePoolsData
    .filter(pool => pool.data) // Filter out pools with no data first
    .map(pool => ({ id: pool.id, ...pool.data }))
    .filter(pool => pool.status !== undefined);
  const { activatePool } = useActivatePool();

  // Unstaking hooks
  const { unstake, isPending: isUnstaking, isConfirming: isUnstakeConfirming, isConfirmed: isUnstakeConfirmed, error: unstakeError } = useUnstakeAndClaim();
  const stakingStats = useStakingStats();

  // Real-time event watching
  useWatchPoolCreated((poolId, creator, entryFee, maxPlayers) => {
    if (creator === address) {
      toast({
        title: "Pool Created!",
        description: `Your pool #${poolId} has been created successfully.`,
        type: "success"
      });
      refetchPools();
      refetchCreator();
    }
  });

  useWatchPoolActivated({
    onLogs: (logs) => {
      logs.forEach((log) => {
        if (log.args) {
          const { poolId } = log.args;
          toast({
            title: "Pool Activated!",
            description: `Pool #${poolId} is now active and the game has started.`,
            type: "success"
          });
          refetchPools();
        }
      });
    }
  });

  useWatchGameCompleted({
    onLogs: (logs) => {
      logs.forEach((log) => {
        if (log.args) {
          const { poolId, winner, prizeAmount } = log.args;
          const isWinner = winner === address;
          toast({
            title: isWinner ? "Congratulations! 🎉" : "Game Completed",
            description: isWinner
              ? `You won ${formatEther(prizeAmount)} CELO in pool #${poolId}!`
              : `Pool #${poolId} has been completed.`,
            type: isWinner ? "success" : "info"
          });
          refetchPools();
          refetchCreator();
        }
      });
    }
  });

  useWatchPlayerJoined({
    onLogs: (logs) => {
      logs.forEach((log) => {
        if (log.args) {
          const { poolId, currentPlayers, maxPlayers } = log.args;
          if (Number(currentPlayers) === Number(maxPlayers)) {
            toast({
              title: "Pool Full!",
              description: `Pool #${poolId} is now full and ready to activate.`,
              type: "success"
            });
            refetchPools();
          }
        }
      });
    }
  });

  // Access control
  if (!isConnected) {
    return <WalletConnectionRequired />;
  }

  if (!creatorLoading && !creatorInfo?.hasActiveStake) {
    return <StakingRequired error={creatorError} />;
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchCreator(),
        refetchPools()
      ]);
      toast({ title: "Dashboard refreshed", description: "All data has been updated.", type: "success" });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to update dashboard data.",
        type: "error"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleActivatePool = async (poolId: number) => {
    try {
      await activatePool(poolId);
      toast({ title: "Pool activated", description: `Pool #${poolId} has been activated successfully.`, type: "success" });
      refetchPools();
    } catch (error) {
      console.error('Pool activation error:', error);
      toast({
        title: "Activation failed",
        description: "Failed to activate the pool.",
        type: "error"
      });
    }
  };

  const handleViewPool = (poolId: number, status: number) => {
    if (status === PoolStatus.OPENED) {
      window.location.href = `/pools?highlight=${poolId}`;
    } else if (status === PoolStatus.ACTIVE) {
      window.location.href = `/game/${poolId}`;
    } else if (status === PoolStatus.COMPLETED) {
      window.location.href = `/game/${poolId}`;
    }
  };

  const handleCreatePool = () => {
    if (!creatorInfo?.poolsRemaining || Number(creatorInfo.poolsRemaining) <= 0) {
      toast({
        title: "No pools remaining",
        description: "You have used all your pool slots. Complete active pools or stake more CELO.",
        type: "warning"
      });
      return;
    }
    router.push('/create-pool');
  };

  const handleUnstake = () => {
    toast({
      title: "Unstaking coming soon",
      description: "Unstaking functionality will be available in a future update.",
      type: "info"
    });
  };

  // Loading state
  const isLoading = creatorLoading || earningsLoading || poolsLoading;

  // Calculate stats from real data
  const stats = calculateStats(activePools);
  const celoBalance = balance ? formatEther(balance.value) : "0";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl border-4 border-white shadow-lg">
              {address ? formatAddress(address).slice(0, 2) : "??"}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Crown className="w-8 h-8 text-yellow-600" />
                Creator Dashboard
              </h1>
              <p className="text-gray-600">
                {address ? formatAddress(address) : "Not connected"} •
                Balance: {parseFloat(celoBalance).toFixed(4)} CELO •
                Staked: {creatorInfo?.stakedAmount ? formatEther(creatorInfo.stakedAmount) : "0"} CELO
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button
              className="bg-gradient-to-r from-purple-600 to-blue-600"
              onClick={handleCreatePool}
              disabled={!creatorInfo?.poolsRemaining || Number(creatorInfo.poolsRemaining) <= 0}
            >
              <Zap className="w-4 h-4 mr-2" />
              Create Pool ({creatorInfo?.poolsRemaining ? Number(creatorInfo.poolsRemaining) : 0} left)
            </Button>
            
            <Button
              variant="outline"
              onClick={handleUnstake}
            >
              Unstake & Withdraw
            </Button>
          </div>
        </div>

        {/* Stats overview */}
        <CreatorStatsOverview
          creatorInfo={creatorInfo}
          totalEarnings={totalEarnings}
          activePools={activePools}
          stats={stats}
          isLoading={isLoading}
        />

        {/* No pools remaining warning */}
        {creatorInfo && Number(creatorInfo.poolsRemaining) <= 0 && (
          <Card className="p-4 mb-6 bg-orange-50 border-orange-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">All pool slots used</p>
                <p className="text-sm text-orange-700">
                  Complete your active pools to free up slots, or consider staking more CELO for additional pools.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active pools */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Play className="w-5 h-5 text-green-600" />
                Active Pools ({activePools.length})
              </h2>
            </div>
            
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="p-6">
                      <div className="animate-pulse">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="h-16 bg-gray-200 rounded"></div>
                          <div className="h-16 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : activePools.length > 0 ? (
                activePools.map((pool) => (
                  <PoolCard
                    key={pool.id}
                    pool={pool}
                    onActivate={() => handleActivatePool(Number(pool.id))}
                    onViewPool={handleViewPool}
                  />
                ))
              ) : (
                <Card className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active pools</h3>
                  <p className="text-gray-500 mb-4">Create a new pool to start earning creator rewards.</p>
                  <Button
                    className="bg-gradient-to-r from-purple-600 to-blue-600"
                    onClick={handleCreatePool}
                    disabled={!creatorInfo?.poolsRemaining || Number(creatorInfo.poolsRemaining) <= 0}
                  >
                    Create Your First Pool
                  </Button>
                </Card>
              )}
            </div>
          </div>

          {/* Recent pools */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Recent Pools
              </h2>
            </div>
            
            <div className="space-y-4">
              <Card className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Pool History Coming Soon</h3>
                <p className="text-gray-500 mb-4">Historical pool data and analytics will be available in a future update.</p>
                <Button variant="outline" disabled>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Pool History
                </Button>
              </Card>
            </div>

            {/* View all pools */}
            <div className="mt-6 text-center">
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                View All Pool History
              </Button>
            </div>
          </div>
        </div>

        {/* Performance insights */}
        <Card className="p-6 mt-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Performance Insights
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Best Entry Fee</h4>
              <p className="text-2xl font-bold text-blue-600">{stats.bestPerformingEntry}</p>
              <p className="text-sm text-blue-700">Highest completion rate</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Total Pools</h4>
              <p className="text-2xl font-bold text-green-600">{creatorInfo?.poolsCreated ? Number(creatorInfo.poolsCreated) : 0}</p>
              <p className="text-sm text-green-700">Lifetime pools created</p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Players Hosted</h4>
              <p className="text-2xl font-bold text-purple-600">{stats.totalPlayersHosted}</p>
              <p className="text-sm text-purple-700">Total across all pools</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}