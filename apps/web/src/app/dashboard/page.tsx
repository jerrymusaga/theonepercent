"use client";

import { useState, useEffect, useMemo } from "react";
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
  Wallet,
  Settings,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useCreatorInfo,
  useCreatorReward,
  useActivatePool,
  useCanActivatePool,
  useWatchPoolCreated,
  useWatchPoolActivated,
  useWatchGameCompleted,
  useWatchPlayerJoined,
  useUnstakeAndClaim,
  useStakingStats,
  useUserParticipation,
  useVerificationInfo,
  usePlayerClaimPrize,
  useClaimAbandonedPoolRefund,
  useCreatedPools,
  usePoolInfo,
} from "@/hooks";
// Use Envio hooks for better performance
import {
  useEnvioPlayer,
  useEnvioJoinedPoolsDetailed,
  useEnvioCreatedPools,
} from "@/hooks/use-envio-players";
import { useEnvioCreatorPools } from "@/hooks/use-envio-creators";
import { useToast } from "@/hooks/use-toast";
import {
  VerificationStatus,
  VerificationBadge,
} from "@/components/verification-status";
import { PoolStatus } from "@/lib/contract";

// Loading component
const LoadingSpinner = ({ className = "" }: { className?: string }) => (
  <div
    className={`animate-spin rounded-full border-b-2 border-current ${className}`}
  ></div>
);

// Error component
const ErrorBanner = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) => (
  <Card className="p-4 bg-red-900/20 border-red-800 text-red-300">
    <div className="flex items-center gap-3">
      <AlertTriangle className="w-5 h-5 text-red-400" />
      <div className="flex-1">
        <p className="font-medium text-red-200">Error</p>
        <p className="text-sm text-red-300">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="border-red-700 text-red-300"
        >
          Retry
        </Button>
      )}
    </div>
  </Card>
);

// Access control components
const WalletConnectionRequired = () => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
    <Card className="p-8 text-center max-w-md bg-gray-900 border-gray-800">
      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <Wallet className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">
        Connect Your Wallet
      </h2>
      <p className="text-gray-400 mb-6">
        You need to connect your wallet to access your creator dashboard.
      </p>
      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
        Connect Wallet
      </Button>
    </Card>
  </div>
);

const NoParticipationPrompt = ({ error }: { error?: any }) => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
    <Card className="p-8 text-center max-w-lg bg-gray-900 border-gray-800">
      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <Users className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">
        Welcome to The One Percent
      </h2>
      <p className="text-gray-400 mb-6">
        Get started by either joining a game pool or becoming a creator to host
        your own pools.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="p-4 bg-gray-800 border-gray-700 hover:border-blue-600 transition-colors">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Play className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-white mb-2">Join as Player</h3>
          <p className="text-sm text-gray-400 mb-3">
            Join existing pools, compete against others, and win prizes.
          </p>
          <Button
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
            onClick={() => (window.location.href = "/pools")}
          >
            Browse Pools
          </Button>
        </Card>

        <Card className="p-4 bg-gray-800 border-gray-700 hover:border-purple-600 transition-colors">
          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-white mb-2">Become Creator</h3>
          <p className="text-sm text-gray-400 mb-3">
            Stake CELO to create pools and earn creator rewards.
          </p>
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => (window.location.href = "/stake")}
          >
            Start Staking
          </Button>
        </Card>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
          <p className="text-sm text-red-300">
            Debug: {error.message || "Contract read error"}
          </p>
        </div>
      )}

      <p className="text-sm text-gray-500">
        Once you participate, return here to track your activity and manage your
        pools.
      </p>
    </Card>
  </div>
);

// Helper functions
const formatAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

const calculateStats = (pools: any[]) => {
  if (!pools || pools.length === 0) {
    return {
      averagePoolSize: "0",
      completionRate: "0%",
      totalPlayersHosted: 0,
      bestPerformingEntry: "0 CELO",
    };
  }

  const completedPools = pools.filter(
    (pool) => pool.status === PoolStatus.COMPLETED
  );
  const totalPlayers = pools.reduce(
    (sum, pool) => sum + Number(pool.currentPlayers),
    0
  );
  const averageSize =
    pools.length > 0 ? (totalPlayers / pools.length).toFixed(1) : "0";
  const completionRate =
    pools.length > 0
      ? ((completedPools.length / pools.length) * 100).toFixed(0)
      : "0";

  return {
    averagePoolSize: averageSize,
    completionRate: `${completionRate}%`,
    totalPlayersHosted: totalPlayers,
    bestPerformingEntry: "2.5 CELO", // TODO: Calculate from actual pool performance
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

const CreatorStatsOverview = ({
  creatorInfo,
  totalEarnings,
  activePools,
  stats,
  isLoading,
}: CreatorStatsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4 bg-gray-900 border-gray-800">
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div className="w-4 h-4 bg-gray-700 rounded"></div>
                <div className="w-3 h-3 bg-gray-700 rounded"></div>
              </div>
              <div className="h-3 bg-gray-700 rounded mb-2"></div>
              <div className="h-5 bg-gray-700 rounded mb-1"></div>
              <div className="h-3 bg-gray-700 rounded w-3/4"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }


  const earnings = totalEarnings ? formatEther(totalEarnings) : "0";
  const poolsCreated = creatorInfo?.poolsCreated
    ? Number(creatorInfo.poolsCreated)
    : 0;
  const poolsRemaining = creatorInfo?.poolsRemaining
    ? Number(creatorInfo.poolsRemaining)
    : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {/* Total earnings */}
      <Card className="p-4 bg-gray-900 border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <Coins className="w-4 h-4 text-green-400" />
          <TrendingUp className="w-3 h-3 text-green-400" />
        </div>
        <h3 className="text-xs font-medium text-gray-400 mb-1">
          Total Earnings
        </h3>
        <p className="text-lg font-bold text-white mb-1">
          {parseFloat(earnings).toFixed(4)}{" "}
          <span className="text-sm text-gray-400">CELO</span>
        </p>
        <p className="text-xs text-gray-500">{poolsCreated} pools</p>
      </Card>

      {/* Active pools */}
      <Card className="p-4 bg-gray-900 border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <Play className="w-4 h-4 text-blue-400" />
          <Users className="w-3 h-3 text-blue-400" />
        </div>
        <h3 className="text-xs font-medium text-gray-400 mb-1">Active Pools</h3>
        <p className="text-lg font-bold text-white mb-1">
          {activePools.length}
        </p>
        <p className="text-xs text-gray-500">{poolsRemaining} slots left</p>
      </Card>

      {/* Success rate */}
      <Card className="p-4 bg-gray-900 border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <Target className="w-4 h-4 text-purple-400" />
          <BarChart3 className="w-3 h-3 text-purple-400" />
        </div>
        <h3 className="text-xs font-medium text-gray-400 mb-1">Success Rate</h3>
        <p className="text-lg font-bold text-white mb-1">
          {stats.completionRate}
        </p>
        <p className="text-xs text-gray-500">completion rate</p>
      </Card>

      {/* Average pool size */}
      <Card className="p-4 bg-gray-900 border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <Trophy className="w-4 h-4 text-orange-400" />
          <Clock className="w-3 h-3 text-orange-400" />
        </div>
        <h3 className="text-xs font-medium text-gray-400 mb-1">
          Avg Pool Size
        </h3>
        <p className="text-lg font-bold text-white mb-1">
          {stats.averagePoolSize}
        </p>
        <p className="text-xs text-gray-500">players avg</p>
      </Card>
    </div>
  );
};

const PoolCardWithActivation = ({
  poolId,
  onActivate,
  onViewPool,
}: {
  poolId: number;
  onActivate: (poolId: number) => void;
  onViewPool?: (poolId: number, status: number) => void;
}) => {
  const { data: canActivate = false } = useCanActivatePool(poolId);

  return (
    <PoolCard
      poolId={poolId}
      canActivate={canActivate}
      onActivate={() => onActivate(poolId)}
      onViewPool={onViewPool}
    />
  );
};

const PlayerPoolCard = ({
  pool,
  onClaimPrize,
  onClaimRefund,
  onViewPool,
  isClaimingRefund,
  isClaimingPrize,
}: {
  pool: any; // JoinedPool type
  onClaimPrize?: (poolId: number) => void;
  onClaimRefund?: (poolId: number) => void;
  onViewPool?: (poolId: number, status: number) => void;
  isClaimingRefund?: boolean;
  isClaimingPrize?: boolean;
}) => {
  const getStatusColor = (status: number) => {
    switch (status) {
      case PoolStatus.OPENED:
        return "text-blue-400 bg-blue-900/20 border-blue-800";
      case PoolStatus.ACTIVE:
        return "text-green-400 bg-green-900/20 border-green-800";
      case PoolStatus.COMPLETED:
        return "text-purple-400 bg-purple-900/20 border-purple-800";
      case PoolStatus.ABANDONED:
        return "text-red-400 bg-red-900/20 border-red-800";
      default:
        return "text-gray-400 bg-gray-800 border-gray-700";
    }
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case PoolStatus.OPENED:
        return <Users className="w-4 h-4" />;
      case PoolStatus.ACTIVE:
        return <Play className="w-4 h-4" />;
      case PoolStatus.COMPLETED:
        return <CheckCircle2 className="w-4 h-4" />;
      case PoolStatus.ABANDONED:
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case PoolStatus.OPENED:
        return "OPENED";
      case PoolStatus.ACTIVE:
        return "ACTIVE";
      case PoolStatus.COMPLETED:
        return "COMPLETED";
      case PoolStatus.ABANDONED:
        return "ABANDONED";
      default:
        return "UNKNOWN";
    }
  };

  const getResultColor = () => {
    if (pool.hasWon) return "bg-green-900/20 border-green-800";
    if (pool.isEliminated) return "bg-red-900/20 border-red-800";
    return "bg-gray-800 border-gray-700";
  };

  const getResultText = () => {
    if (pool.hasWon) return "WON";
    if (pool.isEliminated) return "ELIMINATED";
    return "PLAYING";
  };

  return (
    <Card className="p-6 bg-gray-900 border-gray-800 hover:border-gray-700 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
            #{pool.id}
          </div>
          <div>
            <p className="font-medium text-white">Pool #{pool.id}</p>
            <p className="text-sm text-gray-400">
              Entry: {pool.formattedData.entryFee} CELO
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 border ${getStatusColor(
              pool.formattedData.status
            )}`}
          >
            {getStatusIcon(pool.formattedData.status)}
            {getStatusText(pool.formattedData.status)}
          </div>

          {pool.poolInfo.status === PoolStatus.COMPLETED && (
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium border ${getResultColor()}`}
            >
              {getResultText()}
            </div>
          )}
        </div>
      </div>

      {/* Pool details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-gray-300">
              Prize Pool
            </span>
          </div>
          <p className="font-bold text-white">
            {pool.formattedData.prizePool} CELO
          </p>
        </div>

        {pool.hasWon && pool.prizeAmount && (
          <div className="p-3 bg-green-900/20 rounded-lg border border-green-800">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-300">
                Your Prize
              </span>
            </div>
            <p className="font-bold text-green-400">
              {formatEther(pool.prizeAmount)} CELO
            </p>
          </div>
        )}
      </div>

      {/* Status-specific info */}
      {pool.hasWon && !pool.hasClaimed && (
        <div className="p-3 bg-green-900/20 rounded-lg mb-4 border border-green-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-green-300">
              🎉 Congratulations! You won!
            </span>
            <span className="font-bold text-green-400">
              {formatEther(pool.prizeAmount || BigInt(0))} CELO
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => onClaimPrize?.(pool.id)}
            disabled={isClaimingPrize}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isClaimingPrize ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Claiming...
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4 mr-2" />
                Claim Prize
              </>
            )}
          </Button>
        </div>
      )}

      {pool.poolInfo.status === PoolStatus.ABANDONED && (
        <div className="p-3 bg-orange-900/20 rounded-lg mb-4 border border-orange-800">
          {pool.poolInfo.prizePool === BigInt(0) ? (
            // Automatic refund was processed
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium text-green-300">
                  Pool Abandoned - Refund Processed
                </span>
              </div>
              <div className="text-sm text-green-400">
                <p>
                  Your entry fee of{" "}
                  <span className="font-bold">
                    {pool.formattedData.entryFee} CELO
                  </span>{" "}
                  was automatically refunded to your wallet.
                </p>
              </div>
            </div>
          ) : (
            // Manual refund needed
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <span className="text-sm font-medium text-orange-300">
                  Pool Abandoned - Refund Available
                </span>
              </div>
              <div className="text-sm text-orange-400 mb-3">
                <p>
                  This pool was abandoned and you can claim your{" "}
                  <span className="font-bold">
                    {pool.formattedData.entryFee} CELO
                  </span>{" "}
                  entry fee refund.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => onClaimRefund?.(pool.id)}
                disabled={isClaimingRefund}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isClaimingRefund ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Claim Refund
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {pool.isEliminated && pool.poolInfo.status !== PoolStatus.ABANDONED && (
        <div className="p-3 bg-red-900/20 rounded-lg mb-4 border border-red-800">
          <div className="flex justify-between items-center">
            <span className="text-sm text-red-300">Eliminated</span>
            <span className="text-red-400">Better luck next time!</span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {pool.poolInfo.status === PoolStatus.ACTIVE && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-blue-600 text-blue-300 hover:bg-blue-800"
            onClick={() => onViewPool?.(pool.id, pool.poolInfo.status)}
          >
            <Play className="w-4 h-4 mr-2" />
            Play Game
          </Button>
        )}

        {pool.poolInfo.status === PoolStatus.COMPLETED && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            onClick={() => onViewPool?.(pool.id, pool.poolInfo.status)}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Results
          </Button>
        )}
      </div>
    </Card>
  );
};

const PoolCard = ({
  poolId,
  canActivate,
  onActivate,
  onViewPool,
}: {
  poolId: number;
  canActivate?: boolean;
  onActivate?: () => void;
  onViewPool?: (poolId: number, status: number) => void;
}) => {
  const { data: pool, isLoading } = usePoolInfo(poolId);

  if (isLoading) {
    return (
      <Card className="p-6 bg-gray-900 border-gray-800">
        <div className="animate-pulse">
          <div className="h-20 bg-gray-700 rounded mb-4"></div>
          <div className="h-16 bg-gray-700 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!pool) {
    return (
      <Card className="p-6 bg-gray-900 border-gray-800">
        <div className="text-center text-gray-500">
          <p>Pool #{poolId} not found</p>
        </div>
      </Card>
    );
  }
  const getStatusColor = (status: number) => {
    switch (status) {
      case PoolStatus.OPENED:
        return "text-blue-400 bg-blue-900/20 border-blue-800";
      case PoolStatus.ACTIVE:
        return "text-green-400 bg-green-900/20 border-green-800";
      case PoolStatus.COMPLETED:
        return "text-purple-400 bg-purple-900/20 border-purple-800";
      case PoolStatus.ABANDONED:
        return "text-red-400 bg-red-900/20 border-red-800";
      default:
        return "text-gray-400 bg-gray-800 border-gray-700";
    }
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case PoolStatus.OPENED:
        return <Users className="w-4 h-4" />;
      case PoolStatus.ACTIVE:
        return <Play className="w-4 h-4" />;
      case PoolStatus.COMPLETED:
        return <CheckCircle2 className="w-4 h-4" />;
      case PoolStatus.ABANDONED:
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case PoolStatus.OPENED:
        return "OPENED";
      case PoolStatus.ACTIVE:
        return "ACTIVE";
      case PoolStatus.COMPLETED:
        return "COMPLETED";
      case PoolStatus.ABANDONED:
        return "ABANDONED";
      default:
        return "UNKNOWN";
    }
  };

  return (
    <Card className="p-6 bg-gray-900 border-gray-800 hover:border-gray-700 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
            #{poolId}
          </div>
          <div>
            <p className="font-medium text-white">Pool #{poolId}</p>
            <p className="text-sm text-gray-400">Created by you</p>
          </div>
        </div>

        <div
          className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 border ${getStatusColor(
            Number(pool.status)
          )}`}
        >
          {getStatusIcon(Number(pool.status))}
          {getStatusText(Number(pool.status))}
        </div>
      </div>

      {/* Pool details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-gray-300">Entry Fee</span>
          </div>
          <p className="font-bold text-white">
            {formatEther(pool.entryFee)} CELO
          </p>
        </div>

        <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-gray-300">Players</span>
          </div>
          <p className="font-bold text-white">
            {Number(pool.currentPlayers)}/{Number(pool.maxPlayers)}
          </p>
        </div>
      </div>

      {/* Status-specific info */}
      {Number(pool.status) === PoolStatus.OPENED && (
        <div className="p-3 bg-blue-900/20 rounded-lg mb-4 border border-blue-800">
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-300">Waiting for players</span>
            <span className="font-bold text-blue-400">
              {Number(pool.maxPlayers) - Number(pool.currentPlayers)} slots left
            </span>
          </div>

          {/* Show activation options */}
          {Number(pool.currentPlayers) >= Number(pool.maxPlayers) ? (
            // Pool is 100% full - auto-activation
            <div className="mt-2">
              <div className="p-2 bg-green-900/20 rounded-lg mb-2 border border-green-800">
                <div className="text-sm text-green-300 text-center">
                  🎉 Pool is full! Game will start automatically.
                </div>
              </div>
            </div>
          ) : canActivate ? (
            // Pool is 50%+ full - manual activation available
            <div className="mt-2">
              <div className="p-2 bg-orange-900/20 rounded-lg mb-2 border border-orange-800">
                <div className="text-sm text-orange-300 text-center">
                  ⚡ Pool is 50% full - you can start the game now!
                </div>
              </div>
              <Button
                size="sm"
                onClick={onActivate}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Zap className="w-4 h-4 mr-2" />
                Start Game Now
              </Button>
            </div>
          ) : (
            // Show progress towards 50% threshold
            <div className="mt-2">
              <div className="p-2 bg-gray-800 rounded-lg border border-gray-700">
                <div className="text-sm text-gray-400 text-center">
                  Need{" "}
                  {Math.ceil(Number(pool.maxPlayers) / 2) -
                    Number(pool.currentPlayers)}{" "}
                  more players to enable manual start
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {Number(pool.status) === PoolStatus.ACTIVE && (
        <div className="p-3 bg-green-900/20 rounded-lg mb-4 border border-green-800">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-green-300">Game in progress</span>
            <span className="font-bold text-green-400">
              {Number(pool.currentPlayers)} players active
            </span>
          </div>
        </div>
      )}

      {Number(pool.status) === PoolStatus.COMPLETED && (
        <div className="p-3 bg-green-900/20 rounded-lg mb-4 border border-green-800">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-300">Status:</span>
              <span className="font-bold text-green-400">Game Completed</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-300">Final Players:</span>
              <span className="font-mono text-green-400">
                {Number(pool.currentPlayers)}
              </span>
            </div>
          </div>
        </div>
      )}

      {Number(pool.status) === PoolStatus.ABANDONED && (
        <div className="p-3 bg-red-900/20 rounded-lg mb-4 border border-red-800">
          <div className="flex justify-between items-center">
            <span className="text-sm text-red-300">Status:</span>
            <span className="text-red-400">Abandoned</span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {Number(pool.status) === PoolStatus.OPENED && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            onClick={() =>
              (window.location.href = `/pools?highlight=${poolId}`)
            }
          >
            <Eye className="w-4 h-4 mr-2" />
            View on Pools Page
          </Button>
        )}

        {Number(pool.status) === PoolStatus.ACTIVE && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-blue-600 text-blue-300 hover:bg-blue-800"
            onClick={() => onViewPool?.(poolId, Number(pool.status))}
          >
            <Play className="w-4 h-4 mr-2" />
            Play Game
          </Button>
        )}

        {Number(pool.status) === PoolStatus.COMPLETED && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            onClick={() => onViewPool?.(poolId, Number(pool.status))}
          >
            <Trophy className="w-4 h-4 mr-2" />
            View Results
          </Button>
        )}
      </div>
    </Card>
  );
};

export default function UniversalDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [showUnstakeConfirm, setShowUnstakeConfirm] = useState(false);

  // Wallet connection check
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  // User participation detection
  const {
    userType,
    isCreator,
    isPlayer,
    hasParticipation,
    isLoading: participationLoading,
  } = useUserParticipation(address);

  // Creator-specific hooks
  const {
    data: creatorInfo,
    isLoading: creatorLoading,
    refetch: refetchCreator,
    error: creatorError,
  } = useCreatorInfo();
  // Use Envio creator pools to calculate earnings from completed pools
  const { data: creatorPools, isLoading: earningsLoading } = useEnvioCreatorPools(address);

  // Calculate total earnings from completed pools (prizePool - prizeAmount = creator reward)
  const totalEarnings = useMemo(() => {
    if (!creatorPools) return BigInt(0);

    return creatorPools
      .filter(pool => pool.status === 'COMPLETED' && pool.prizePool && pool.prizeAmount)
      .reduce((total, pool) => {
        const prizePool = BigInt(pool.prizePool);
        const prizeAmount = BigInt(pool.prizeAmount);
        const creatorReward = prizePool - prizeAmount;
        return total + creatorReward;
      }, BigInt(0));
  }, [creatorPools]);
  const {
    data: createdPoolIds = [],
    isLoading: poolsLoading,
    refetch: refetchPools,
  } = useCreatedPools(address);

  // Player-specific hooks (Envio-powered)
  const { data: joinedPools = [], isLoading: joinedPoolsLoading } =
    useEnvioJoinedPoolsDetailed(address);
  const { data: player, isLoading: playerDataLoading } =
    useEnvioPlayer(address);

  // Creator-specific hooks (Envio-powered)
  const { data: envioCreatedPools = [], isLoading: envioCreatedPoolsLoading } =
    useEnvioCreatedPools(address);

  // For creators, show ALL pools they've ever created (regardless of current stake status)
  // This ensures pool history persists even after unstaking
  // Use Envio data when available, fallback to old manual indexing
  const activePools = envioCreatedPools.length > 0 ?
    envioCreatedPools.map(pool => pool.id) :
    createdPoolIds;

  const {
    activatePool,
    isPending: isActivating,
    isConfirming: isActivateConfirming,
    isConfirmed: isActivateConfirmed,
    error: activateError,
  } = useActivatePool();

  // Debug logging
  console.log('🏠 Dashboard - address:', address);
  console.log('🏠 Dashboard - joinedPools:', joinedPools);
  console.log('🏠 Dashboard - joinedPoolsLoading:', joinedPoolsLoading);
  console.log('🏠 Dashboard - player:', player);
  console.log('🏠 Dashboard - playerDataLoading:', playerDataLoading);
  console.log('🏠 Dashboard - envioCreatedPools:', envioCreatedPools);
  console.log('🏠 Dashboard - envioCreatedPoolsLoading:', envioCreatedPoolsLoading);

  // Compute player stats and prizes from Envio data
  const playerStats = {
    totalPoolsJoined: player?.totalPoolsJoined || 0,
    totalPoolsWon: player?.totalPoolsWon || 0,
    totalPoolsEliminated: player?.totalPoolsEliminated || 0,
    totalEarnings: formatEther(player?.totalEarnings || '0'),
    totalSpent: formatEther(player?.totalSpent || '0'),
    winRate: player?.totalPoolsJoined ?
      ((player.totalPoolsWon / player.totalPoolsJoined) * 100).toFixed(1) + '%' :
      '0%',
    totalGamesWon: player?.totalPoolsWon || 0, // Alias for totalPoolsWon
    activePools: joinedPools.filter((pool: any) => pool.status === 'ACTIVE').length,
  };

  // TODO: Compute claimable prizes from player pools data
  const claimablePrizes: any[] = []; // Will be computed from joinedPools
  const totalClaimableFormatted = '0.00';
  const prizesLoading = playerDataLoading;
  const {
    claimPrize,
    isPending: isClaimingPrize,
    isConfirming: isClaimConfirming,
    isConfirmed: isClaimConfirmed,
    error: claimError,
  } = usePlayerClaimPrize();
  const {
    claimRefund,
    isPending: isClaimingRefund,
    isConfirming: isRefundConfirming,
    isConfirmed: isRefundConfirmed,
    error: refundError,
  } = useClaimAbandonedPoolRefund();

  // Verification status
  const { data: verificationInfo } = useVerificationInfo(address);

  // Unstaking hooks (creator only)
  const {
    unstake,
    unstakeAsync,
    isPending: isUnstaking,
    isConfirming: isUnstakeConfirming,
    isConfirmed: isUnstakeConfirmed,
    error: unstakeError,
  } = useUnstakeAndClaim();
  const stakingStats = useStakingStats();

  // Handle unstaking success
  useEffect(() => {
    if (isUnstakeConfirmed) {
      const stakedAmount = creatorInfo
        ? parseFloat(formatEther(creatorInfo.stakedAmount))
        : 0;
      const rewardsAmount = totalEarnings
        ? parseFloat(formatEther(totalEarnings))
        : 0;
      const totalWithdrawn = stakedAmount + rewardsAmount;

      toast({
        title: "🎉 Unstaking Successful!",
        description: `${totalWithdrawn.toFixed(
          4
        )} CELO has been withdrawn to your wallet. Page will refresh automatically.`,
        type: "success",
      });

      // Auto-refresh the page after a short delay to show the toast
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  }, [isUnstakeConfirmed, toast, creatorInfo, totalEarnings]);

  // Handle prize claiming success
  useEffect(() => {
    if (isClaimConfirmed) {
      toast({
        title: "🎉 Prize Claimed!",
        description:
          "Your prize has been successfully claimed and sent to your wallet.",
        type: "success",
      });

      // Refresh player data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }, [isClaimConfirmed, toast]);

  // Handle refund claiming success
  useEffect(() => {
    if (isRefundConfirmed) {
      toast({
        title: "💰 Refund Claimed!",
        description:
          "Your entry fee has been successfully refunded to your wallet.",
        type: "success",
      });

      // Refresh player data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }, [isRefundConfirmed, toast]);

  // Handle pool activation success
  useEffect(() => {
    if (isActivateConfirmed) {
      toast({
        title: "🎮 Pool Activated!",
        description: "The pool has been activated and the game has started!",
        type: "success",
      });

      // Refresh creator data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }, [isActivateConfirmed, toast]);

  // Handle unstaking errors
  useEffect(() => {
    if (unstakeError) {
      console.error("Unstaking error details:", unstakeError);

      let errorMessage = "Transaction failed. Please try again.";

      // Provide more specific error messages
      if (unstakeError.message?.includes("User rejected")) {
        errorMessage = "Transaction was cancelled by user.";
      } else if (unstakeError.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas fees.";
      } else if (unstakeError.message?.includes("execution reverted")) {
        errorMessage =
          "Transaction failed. You may not be eligible to unstake yet.";
      } else if (unstakeError.message) {
        errorMessage = unstakeError.message;
      }

      toast({
        title: "❌ Unstaking Failed",
        description: errorMessage,
        type: "error",
      });
    }
  }, [unstakeError, toast]);

  // Real-time event watching
  useWatchPoolCreated((poolId, creator) => {
    if (creator === address) {
      toast({
        title: "Pool Created!",
        description: `Your pool #${poolId} has been created successfully.`,
        type: "success",
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
            type: "success",
          });
          refetchPools();
        }
      });
    },
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
            type: isWinner ? "success" : "info",
          });
          refetchPools();
          refetchCreator();
        }
      });
    },
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
              type: "success",
            });
            refetchPools();
          }
        }
      });
    },
  });

  // Access control
  if (!isConnected) {
    return <WalletConnectionRequired />;
  }

  // Check if user has any participation (creator or player)
  if (!participationLoading && !hasParticipation) {
    return <NoParticipationPrompt error={creatorError} />;
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchCreator(), refetchPools()]);
      toast({
        title: "Dashboard refreshed",
        description: "All data has been updated.",
        type: "success",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to update dashboard data.",
        type: "error",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleActivatePool = async (poolId: number) => {
    try {
      await activatePool(poolId);
      toast({
        title: "Pool activated",
        description: `Pool #${poolId} has been activated successfully.`,
        type: "success",
      });
      refetchPools();
    } catch (error) {
      console.error("Pool activation error:", error);
      toast({
        title: "Activation failed",
        description: "Failed to activate the pool.",
        type: "error",
      });
    }
  };

  const handleViewPool = (poolId: number, status: number) => {
    if (status === PoolStatus.OPENED) {
      router.push(`/pools?highlight=${poolId}`);
    } else if (status === PoolStatus.ACTIVE) {
      router.push(`/game/${poolId}`);
    } else if (status === PoolStatus.COMPLETED) {
      router.push(`/game/${poolId}`);
    }
  };

  const handleCreatePool = () => {
    if (
      !creatorInfo?.poolsRemaining ||
      Number(creatorInfo.poolsRemaining) <= 0
    ) {
      toast({
        title: "No pools remaining",
        description:
          "You have used all your pool slots. Complete active pools or stake more CELO.",
        type: "warning",
      });
      return;
    }
    router.push("/create-pool");
  };

  const handleClaimPrize = async (poolId: number) => {
    try {
      await claimPrize(poolId);
      toast({
        title: "Prize Claiming",
        description: `Claiming prize from pool #${poolId}. Please confirm the transaction.`,
        type: "info",
      });
    } catch (error: any) {
      console.error("Prize claiming error:", error);
      toast({
        title: "Claim Failed",
        description:
          error?.message || "Failed to claim prize. Please try again.",
        type: "error",
      });
    }
  };

  const handleClaimRefund = async (poolId: number) => {
    try {
      await claimRefund(poolId);
      toast({
        title: "Refund Claiming",
        description: `Claiming refund from abandoned pool #${poolId}. Please confirm the transaction.`,
        type: "info",
      });
    } catch (error: any) {
      console.error("Refund claiming error:", error);
      toast({
        title: "Refund Failed",
        description:
          error?.message || "Failed to claim refund. Please try again.",
        type: "error",
      });
    }
  };

  const handleUnstake = () => {
    setShowUnstakeConfirm(true);
  };

  const confirmUnstake = async () => {
    try {
      setShowUnstakeConfirm(false);

      // Calculate withdrawal amount for the message
      const stakedAmount = creatorInfo
        ? parseFloat(formatEther(creatorInfo.stakedAmount))
        : 0;
      const rewardsAmount = totalEarnings
        ? parseFloat(formatEther(totalEarnings))
        : 0;
      const withdrawalAmount = stakingStats.canUnstake
        ? stakedAmount + rewardsAmount
        : stakedAmount * 0.7 + rewardsAmount; // Apply 30% penalty if early unstaking

      await unstakeAsync();

      toast({
        title: "🔄 Transaction Submitted",
        description: `Unstaking ${withdrawalAmount.toFixed(
          4
        )} CELO. Please wait for blockchain confirmation...`,
        type: "info",
      });
    } catch (error: any) {
      console.error("Unstaking error:", error);

      let errorMessage = "Failed to unstake. Please try again.";

      // Provide more specific error messages for submission errors too
      if (error?.message?.includes("User rejected")) {
        errorMessage = "Transaction was cancelled by user.";
      } else if (error?.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas fees.";
      } else if (error?.message?.includes("execution reverted")) {
        errorMessage =
          "Transaction failed. You may not be eligible to unstake yet.";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: "❌ Transaction Failed",
        description: errorMessage,
        type: "error",
      });
    }
  };

  // Fix isPlayer based on Envio data - override the old hook logic
  const isPlayerWithPools = isPlayer || joinedPools.length > 0;

  // Fix isCreator based on Envio data - override the old hook logic
  const isCreatorWithPools = isCreator || envioCreatedPools.length > 0;

  // Loading state
  const isLoading =
    participationLoading ||
    (isCreatorWithPools && (creatorLoading || earningsLoading || poolsLoading)) ||
    (isPlayerWithPools && (joinedPoolsLoading || prizesLoading));


  // Calculate basic stats from pool IDs (simplified for now)
  const stats = {
    averagePoolSize: "0",
    completionRate: "0%",
    totalPlayersHosted: 0,
    bestPerformingEntry: "0 CELO",
  };
  const celoBalance = balance ? formatEther(balance.value) : "0";

  // Determine dashboard title and icon based on user type
  const getDashboardTitle = () => {
    switch (userType) {
      case "both":
        return {
          title: "Creator & Player Dashboard",
          icon: <Crown className="w-6 h-6 text-yellow-400" />,
        };
      case "creator":
        return {
          title: "Creator Dashboard",
          icon: <Crown className="w-6 h-6 text-yellow-400" />,
        };
      case "player":
        return {
          title: "Player Dashboard",
          icon: <Users className="w-6 h-6 text-blue-400" />,
        };
      default:
        return {
          title: "Dashboard",
          icon: <Users className="w-6 h-6 text-gray-400" />,
        };
    }
  };

  const { title: dashboardTitle, icon: dashboardIcon } = getDashboardTitle();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800/50 bg-black/95 backdrop-blur-sm">
        <div className="container mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Brand/Logo Area */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {address
                    ? formatAddress(address).slice(0, 2).toUpperCase()
                    : "??"}
                </div>
                <div className="flex items-center gap-2">
                  {dashboardIcon}
                  <h1 className="text-lg font-bold text-white">
                    Creator Dashboard
                  </h1>
                </div>
              </div>
            </div>

            {/* Center: User Info */}
            <div className="hidden md:flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/50 rounded-lg border border-gray-800">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-300">
                  {address ? formatAddress(address) : "Not connected"}
                </span>
              </div>

              <div className="flex items-center gap-4 text-gray-400">
                <span className="flex items-center gap-1">
                  <Wallet className="w-4 h-4" />
                  {parseFloat(celoBalance).toFixed(2)} CELO
                </span>
                {isCreatorWithPools && (
                  <span className="flex items-center gap-1">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    {creatorInfo?.stakedAmount
                      ? formatEther(creatorInfo.stakedAmount).slice(0, 6)
                      : "0"}{" "}
                    Staked
                  </span>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Desktop Actions */}
              <div className="hidden lg:flex items-center gap-2">
                {!isCreator && (
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 h-9"
                    onClick={() => router.push("/stake")}
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Become Creator
                  </Button>
                )}

                {isPlayerWithPools && (
                  <Button
                    variant="outline"
                    onClick={() => router.push("/pools")}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800 px-4 py-2 h-9"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Browse Pools
                  </Button>
                )}

                {isCreatorWithPools && (
                  <>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 h-9"
                      onClick={handleCreatePool}
                      disabled={
                        !creatorInfo?.poolsRemaining ||
                        Number(creatorInfo.poolsRemaining) <= 0
                      }
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Create Pool
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleUnstake}
                      disabled={
                        isUnstaking ||
                        isUnstakeConfirming ||
                        !creatorInfo?.hasActiveStake
                      }
                      className="border-gray-700 text-gray-300 hover:bg-gray-800 px-4 py-2 h-9"
                    >
                      {isUnstaking || isUnstakeConfirming ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      {isUnstaking
                        ? "Submitting..."
                        : isUnstakeConfirming
                        ? "Confirming..."
                        : "Unstake"}
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="border-gray-700 text-gray-400 hover:bg-gray-800 px-3 py-2 h-9"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>

              {/* Mobile Menu Button */}
              <div className="lg:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-400 hover:bg-gray-800 p-2"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile User Info */}
          <div className="md:hidden mt-3 pt-3 border-t border-gray-800/50">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-300">
                  {address ? formatAddress(address) : "Not connected"}
                </span>
              </div>

              <div className="flex items-center gap-3 text-gray-400">
                <span className="flex items-center gap-1">
                  <Wallet className="w-3 h-3" />
                  {parseFloat(celoBalance).toFixed(2)}
                </span>
                {isCreatorWithPools && (
                  <span className="flex items-center gap-1">
                    <Crown className="w-3 h-3 text-yellow-400" />
                    {creatorInfo?.stakedAmount
                      ? formatEther(creatorInfo.stakedAmount).slice(0, 4)
                      : "0"}
                  </span>
                )}
              </div>
            </div>

            {/* Mobile Action Buttons */}
            <div className="flex gap-2 mt-3">
              {!isCreator && (
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white flex-1"
                  onClick={() => router.push("/stake")}
                >
                  <Crown className="w-4 h-4 mr-1" />
                  Creator
                </Button>
              )}

              {isPlayerWithPools && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/pools")}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 flex-1"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Pools
                </Button>
              )}

              {isCreatorWithPools && (
                <>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                    onClick={handleCreatePool}
                    disabled={
                      !creatorInfo?.poolsRemaining ||
                      Number(creatorInfo.poolsRemaining) <= 0
                    }
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Create
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUnstake}
                    disabled={
                      isUnstaking ||
                      isUnstakeConfirming ||
                      !creatorInfo?.hasActiveStake
                    }
                    className="border-gray-700 text-gray-300 hover:bg-gray-800 px-3"
                  >
                    {isUnstaking || isUnstakeConfirming ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>
                </>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-gray-700 text-gray-400 hover:bg-gray-800 px-3"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Stats overview - Adaptive based on user type */}
        {userType === "both" ? (
          // Show combined stats for users who are both creators and players
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {/* Creator earnings */}
            <Card className="p-4 bg-gray-900 border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <Crown className="w-4 h-4 text-yellow-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-400 mb-1">
                Creator Earnings
              </h3>
              <p className="text-lg font-bold text-white mb-1">
                {totalEarnings
                  ? parseFloat(formatEther(totalEarnings)).toFixed(4)
                  : "0"}{" "}
                <span className="text-sm text-gray-400">CELO</span>
              </p>
              <p className="text-xs text-gray-500">
                {creatorInfo?.poolsCreated
                  ? Number(creatorInfo.poolsCreated)
                  : 0}{" "}
                pools
              </p>
            </Card>

            {/* Player winnings */}
            <Card className="p-4 bg-gray-900 border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="w-4 h-4 text-blue-400" />
                <Target className="w-3 h-3 text-blue-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-400 mb-1">
                Player Winnings
              </h3>
              <p className="text-lg font-bold text-white mb-1">
                {playerStats?.totalEarnings || "0"}{" "}
                <span className="text-sm text-gray-400">CELO</span>
              </p>
              <p className="text-xs text-gray-500">
                {playerStats?.winRate || "0"}% win rate
              </p>
            </Card>

            {/* Total pools */}
            <Card className="p-4 bg-gray-900 border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-4 h-4 text-purple-400" />
                <BarChart3 className="w-3 h-3 text-purple-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-400 mb-1">
                Total Activity
              </h3>
              <p className="text-lg font-bold text-white mb-1">
                {activePools.length + (playerStats?.totalPoolsJoined || 0)}
              </p>
              <p className="text-xs text-gray-500">
                {activePools.length}+{playerStats?.totalPoolsJoined || 0}
              </p>
            </Card>

            {/* Claimable prizes */}
            <Card className="p-4 bg-gray-900 border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <Coins className="w-4 h-4 text-orange-400" />
                <Zap className="w-3 h-3 text-orange-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-400 mb-1">
                Claimable
              </h3>
              <p className="text-lg font-bold text-white mb-1">
                {totalClaimableFormatted}{" "}
                <span className="text-sm text-gray-400">CELO</span>
              </p>
              <p className="text-xs text-gray-500">
                {claimablePrizes.length} prizes
              </p>
            </Card>
          </div>
        ) : userType === "creator" ? (
          // Show creator-focused stats
          <CreatorStatsOverview
            creatorInfo={creatorInfo}
            totalEarnings={totalEarnings}
            activePools={activePools}
            stats={stats}
            isLoading={isLoading}
          />
        ) : userType === "player" ? (
          // Show player-focused stats
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {/* Total winnings */}
            <Card className="p-4 bg-gray-900 border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="w-4 h-4 text-green-400" />
                <TrendingUp className="w-3 h-3 text-green-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-400 mb-1">
                Total Winnings
              </h3>
              <p className="text-lg font-bold text-white mb-1">
                {playerStats?.totalEarnings || "0"}{" "}
                <span className="text-sm text-gray-400">CELO</span>
              </p>
              <p className="text-xs text-gray-500">
                {playerStats?.totalGamesWon || 0} wins
              </p>
            </Card>

            {/* Games played */}
            <Card className="p-4 bg-gray-900 border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-4 h-4 text-blue-400" />
                <Play className="w-3 h-3 text-blue-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-400 mb-1">
                Games Played
              </h3>
              <p className="text-lg font-bold text-white mb-1">
                {playerStats?.totalPoolsJoined || 0}
              </p>
              <p className="text-xs text-gray-500">
                {playerStats?.activePools || 0} active
              </p>
            </Card>

            {/* Win rate */}
            <Card className="p-4 bg-gray-900 border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-4 h-4 text-purple-400" />
                <BarChart3 className="w-3 h-3 text-purple-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-400 mb-1">
                Win Rate
              </h3>
              <p className="text-lg font-bold text-white mb-1">
                {playerStats?.winRate || "0"}%
              </p>
              <p className="text-xs text-gray-500">
                {playerStats?.totalGamesWon || 0} total wins
              </p>
            </Card>

            {/* Claimable prizes */}
            <Card className="p-4 bg-gray-900 border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <Coins className="w-4 h-4 text-orange-400" />
                <Zap className="w-3 h-3 text-orange-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-400 mb-1">
                Claimable
              </h3>
              <p className="text-lg font-bold text-white mb-1">
                {totalClaimableFormatted}{" "}
                <span className="text-sm text-gray-400">CELO</span>
              </p>
              <p className="text-xs text-gray-500">
                {claimablePrizes.length} prizes
              </p>
            </Card>
          </div>
        ) : null}

        {/* No pools remaining warning */}
        {creatorInfo && Number(creatorInfo.poolsRemaining) <= 0 && (
          <Card className="p-4 mb-6 bg-orange-900/20 border-orange-800">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <div>
                <p className="font-medium text-orange-300">
                  All pool slots used
                </p>
                <p className="text-sm text-orange-400">
                  Complete your active pools to free up slots, or consider
                  staking more CELO for additional pools.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Creator Pools - Show if user is a creator */}
          {isCreatorWithPools && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-purple-400" />
                  My Created Pools ({activePools.length})
                </h2>
              </div>

              <div className="space-y-4">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="p-6 bg-gray-900 border-gray-800">
                        <div className="animate-pulse">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                            <div className="space-y-2 flex-1">
                              <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="h-16 bg-gray-700 rounded"></div>
                            <div className="h-16 bg-gray-700 rounded"></div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : activePools.length > 0 ? (
                  activePools.map((poolId) => (
                    <PoolCardWithActivation
                      key={poolId}
                      poolId={poolId}
                      onActivate={handleActivatePool}
                      onViewPool={handleViewPool}
                    />
                  ))
                ) : (
                  <Card className="p-8 text-center bg-gray-900 border-gray-800">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      No active pools
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Create a new pool to start earning creator rewards.
                    </p>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleCreatePool}
                      disabled={
                        !creatorInfo?.poolsRemaining ||
                        Number(creatorInfo.poolsRemaining) <= 0
                      }
                    >
                      Create Your First Pool
                    </Button>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Player Pools - Show if user is a player */}
          {isPlayerWithPools && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Pools I Joined ({joinedPools.length})
                </h2>
              </div>

              <div className="space-y-4">
                {/* DEBUG: Render condition logging */}
                {(() => {
                  console.log('🎯 RENDER DEBUG:');
                  console.log('  - isLoading:', isLoading);
                  console.log('  - joinedPools.length:', joinedPools.length);
                  console.log('  - joinedPools.length > 0:', joinedPools.length > 0);
                  console.log('  - Will render:',
                    isLoading ? 'LOADING SKELETON' :
                    joinedPools.length > 0 ? 'JOINED POOLS' :
                    'EMPTY STATE'
                  );
                  return null;
                })()}
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="p-6 bg-gray-900 border-gray-800">
                        <div className="animate-pulse">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                            <div className="space-y-2 flex-1">
                              <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="h-16 bg-gray-700 rounded"></div>
                            <div className="h-16 bg-gray-700 rounded"></div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : joinedPools.length > 0 ? (
                  joinedPools.map((pool) => (
                    <PlayerPoolCard
                      key={pool.id}
                      pool={pool}
                      onClaimPrize={handleClaimPrize}
                      onClaimRefund={handleClaimRefund}
                      onViewPool={handleViewPool}
                      isClaimingRefund={isClaimingRefund}
                      isClaimingPrize={isClaimingPrize}
                    />
                  ))
                ) : (
                  <Card className="p-8 text-center bg-gray-900 border-gray-800">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      No pools joined yet
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Join a pool to start playing and winning prizes.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/pools")}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      Browse Available Pools
                    </Button>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Claimable Prizes or Recent Activity */}
          <div>
            {isPlayerWithPools && claimablePrizes.length > 0 ? (
              // Show claimable prizes if user has any
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-green-400" />
                    Claimable Prizes ({claimablePrizes.length})
                  </h2>
                </div>

                <div className="space-y-4">
                  {claimablePrizes.map((prize) => (
                    <Card
                      key={prize.poolId}
                      className="p-6 bg-green-900/20 border-green-800"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                            <Trophy className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-medium text-green-300">
                              Pool #{prize.poolId} Winner!
                            </p>
                            <p className="text-sm text-green-400">
                              Prize: {prize.formattedAmount} CELO
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleClaimPrize(prize.poolId)}
                          disabled={isClaimingPrize}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isClaimingPrize ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Claiming...
                            </>
                          ) : (
                            <>
                              <Trophy className="w-4 h-4 mr-2" />
                              Claim Prize
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="p-3 bg-green-900/30 rounded-lg border border-green-800">
                        <p className="text-sm text-green-300">
                          Total claimable:{" "}
                          <span className="font-bold">
                            {totalClaimableFormatted} CELO
                          </span>
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              // Show recent activity or creator history
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    {isCreator ? "Recent Pools" : "Activity History"}
                  </h2>
                </div>

                <div className="space-y-4">
                  <Card className="p-8 text-center bg-gray-900 border-gray-800">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                      <Clock className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      {isCreator
                        ? "Pool History Coming Soon"
                        : "Activity History Coming Soon"}
                    </h3>
                    <p className="text-gray-400 mb-4">
                      {isCreator
                        ? "Historical pool data and analytics will be available in a future update."
                        : "Your gaming history and performance analytics will be available soon."}
                    </p>
                    <Button
                      variant="outline"
                      disabled
                      className="border-gray-600 text-gray-400"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      {isCreator ? "View Pool History" : "View Game History"}
                    </Button>
                  </Card>
                </div>

                {/* View all history */}
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    {isCreator ? "View All Pool History" : "View All Activity"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Performance insights */}
        <Card className="p-6 mt-8 bg-gray-900 border-gray-800">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
            Performance Insights
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-800">
              <h4 className="font-medium text-blue-300 mb-2">Best Entry Fee</h4>
              <p className="text-2xl font-bold text-blue-400">
                {stats.bestPerformingEntry}
              </p>
              <p className="text-sm text-blue-400">Highest completion rate</p>
            </div>

            <div className="p-4 bg-green-900/20 rounded-lg border border-green-800">
              <h4 className="font-medium text-green-300 mb-2">Total Pools</h4>
              <p className="text-2xl font-bold text-green-400">
                {creatorInfo?.poolsCreated
                  ? Number(creatorInfo.poolsCreated)
                  : 0}
              </p>
              <p className="text-sm text-green-400">Lifetime pools created</p>
            </div>

            <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-800">
              <h4 className="font-medium text-purple-300 mb-2">
                Players Hosted
              </h4>
              <p className="text-2xl font-bold text-purple-400">
                {stats.totalPlayersHosted}
              </p>
              <p className="text-sm text-purple-400">Total across all pools</p>
            </div>
          </div>
        </Card>

        {/* Unstaking Confirmation Dialog */}
        {showUnstakeConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg bg-gray-900 border-gray-800">
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-orange-600 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Confirm Unstaking
                  </h3>
                  <p className="text-gray-400">
                    You are about to unstake your CELO and withdraw all rewards.
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-300">
                        Staked Amount:
                      </span>
                      <span className="font-bold text-white">
                        {creatorInfo
                          ? formatEther(creatorInfo.stakedAmount)
                          : "0"}{" "}
                        CELO
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-300">
                        Creator Rewards:
                      </span>
                      <span className="font-bold text-green-400">
                        {totalEarnings ? formatEther(totalEarnings) : "0"} CELO
                      </span>
                    </div>

                    {!stakingStats.canUnstake && (
                      <div className="border-t border-gray-700 pt-2 mt-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-300">
                            Penalty (30%):
                          </span>
                          <span className="font-bold text-red-400">
                            -
                            {creatorInfo
                              ? (
                                  parseFloat(
                                    formatEther(creatorInfo.stakedAmount)
                                  ) * 0.3
                                ).toFixed(4)
                              : "0"}{" "}
                            CELO
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-white">
                            Total Withdrawal:
                          </span>
                          <span className="font-bold text-lg text-white">
                            {(() => {
                              const stakedAmount = creatorInfo
                                ? parseFloat(
                                    formatEther(creatorInfo.stakedAmount)
                                  )
                                : 0;
                              const rewardsAmount = totalEarnings
                                ? parseFloat(formatEther(totalEarnings))
                                : 0;
                              const penaltyAmount = stakedAmount * 0.3;
                              const finalAmount =
                                stakedAmount - penaltyAmount + rewardsAmount;
                              return finalAmount.toFixed(4);
                            })()}{" "}
                            CELO
                          </span>
                        </div>
                      </div>
                    )}

                    {stakingStats.canUnstake && (
                      <div className="border-t border-gray-700 pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-white">
                            Total Withdrawal:
                          </span>
                          <span className="font-bold text-lg text-green-400">
                            {(() => {
                              const stakedAmount = creatorInfo
                                ? parseFloat(
                                    formatEther(creatorInfo.stakedAmount)
                                  )
                                : 0;
                              const rewardsAmount = totalEarnings
                                ? parseFloat(formatEther(totalEarnings))
                                : 0;
                              const finalAmount = stakedAmount + rewardsAmount;
                              return finalAmount.toFixed(4);
                            })()}{" "}
                            CELO
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {!stakingStats.canUnstake && (
                    <div className="p-4 bg-orange-900/20 border border-orange-800 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-orange-300 mb-1">
                            Early Unstaking Penalty
                          </p>
                          <p className="text-sm text-orange-400">
                            You have active pools that are not completed. Early
                            unstaking will incur a 30% penalty and automatically
                            abandon your incomplete pools, refunding players.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {stakingStats.canUnstake && (
                    <div className="p-4 bg-green-900/20 border border-green-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="font-medium text-green-300">
                            No Penalty
                          </p>
                          <p className="text-sm text-green-400">
                            All your pools are completed. You can unstake
                            without any penalties.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                    onClick={() => setShowUnstakeConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={confirmUnstake}
                  >
                    {stakingStats.canUnstake
                      ? "Confirm Unstake"
                      : "Unstake with Penalty"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
