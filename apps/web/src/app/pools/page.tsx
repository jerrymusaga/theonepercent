"use client";

import { useState, useEffect } from "react";
import { useAccount, useBalance } from "wagmi";
import { formatEther } from "viem";
import { Search, Filter, Users, Coins, Clock, TrendingUp, Wallet, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useActivePools,
  useJoinPool,
  useWatchPlayerJoined,
  useWatchPoolActivated,
  useWatchGameCompleted,
  usePoolInfo
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

// Wallet connection component
const WalletConnectionBanner = () => (
  <Card className="p-4 bg-blue-50 border-blue-200 mb-6">
    <div className="flex items-center gap-3">
      <Wallet className="w-5 h-5 text-blue-600" />
      <div className="flex-1">
        <p className="font-medium text-blue-800">Connect your wallet to join games</p>
        <p className="text-sm text-blue-700">
          You can view all pools, but you'll need to connect your wallet to join and play.
        </p>
      </div>
      <Button className="bg-blue-600 hover:bg-blue-700">
        Connect Wallet
      </Button>
    </div>
  </Card>
);

// Helper function to format pool status
const getPoolStatusInfo = (status: PoolStatus, currentRound?: number, remainingPlayers?: number) => {
  switch (status) {
    case PoolStatus.OPENED:
      return {
        text: "Waiting for players",
        color: "bg-blue-100 text-blue-800",
        icon: <Users className="w-3 h-3" />
      };
    case PoolStatus.ACTIVE:
      return {
        text: `Round ${currentRound} • ${remainingPlayers} left`,
        color: "bg-green-100 text-green-800",
        icon: <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      };
    case PoolStatus.COMPLETED:
      return {
        text: "Completed",
        color: "bg-gray-100 text-gray-600",
        icon: <Clock className="w-3 h-3" />
      };
    default:
      return {
        text: "Unknown",
        color: "bg-gray-100 text-gray-600",
        icon: <Clock className="w-3 h-3" />
      };
  }
};

const StatusBadge = ({
  status,
  currentRound,
  remainingPlayers
}: {
  status: PoolStatus;
  currentRound?: number;
  remainingPlayers?: number;
}) => {
  const statusInfo = getPoolStatusInfo(status, currentRound, remainingPlayers);

  return (
    <div className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
      {statusInfo.icon}
      {statusInfo.text}
    </div>
  );
};

interface PoolCardProps {
  poolId: bigint;
  creator: `0x${string}`;
  entryFee: bigint;
  maxPlayers: bigint;
  currentPlayers: bigint;
  prizePool: bigint;
  status: PoolStatus;
  address?: `0x${string}`;
  balance?: bigint;
}

const PoolCard = ({ poolId, creator, entryFee, maxPlayers, currentPlayers, prizePool, status, address, balance }: PoolCardProps) => {
  const { joinPool, isPending: isJoining, error: joinError } = useJoinPool();
  const { success, error } = useToast();

  const fillPercentage = (Number(currentPlayers) / Number(maxPlayers)) * 100;
  const canActivate = fillPercentage >= 50;
  const entryFeeFormatted = formatEther(entryFee);
  const prizePoolFormatted = formatEther(prizePool);
  const hasEnoughBalance = balance ? balance >= entryFee : false;
  const canJoin = address && hasEnoughBalance && status === PoolStatus.OPENED && currentPlayers < maxPlayers;

  const handleJoinPool = async () => {
    if (!canJoin) return;

    try {
      await joinPool(poolId.toString(), entryFeeFormatted);
      success("Joining pool...", "Your transaction is being processed.");
    } catch (err) {
      console.error("Join pool error:", err);
      error("Failed to join", "Could not join the pool. Please try again.");
    }
  };

  // Format creator address
  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Get time display (for now, we'll show pool ID as we don't have creation timestamp from contract)
  const getTimeDisplay = () => {
    return `Pool #${poolId.toString()}`;
  };
  
  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 opacity-5">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
      </div>
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              #{poolId.toString()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{creator.slice(2, 4).toUpperCase()}</span>
                </div>
                <span className="text-sm font-medium text-gray-700">{formatAddress(creator)}</span>
              </div>
              <p className="text-xs text-gray-500">{getTimeDisplay()}</p>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Prize Pool & Entry Fee */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Coins className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Prize Pool</p>
              <p className="font-bold text-lg">{parseFloat(prizePoolFormatted).toFixed(2)} CELO</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-500">Entry Fee</p>
            <p className="font-semibold">{parseFloat(entryFeeFormatted).toFixed(2)} CELO</p>
          </div>
        </div>

        {/* Players Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">
              Players: {currentPlayers.toString()}/{maxPlayers.toString()}
            </span>
            <span className="text-gray-500">{fillPercentage.toFixed(0)}% full</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                canActivate
                  ? 'bg-gradient-to-r from-green-500 to-blue-500'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600'
              }`}
              style={{ width: `${fillPercentage}%` }}
            ></div>
          </div>

          {canActivate && status === PoolStatus.OPENED && (
            <p className="text-xs text-green-600 mt-1 font-medium">
              ✓ Can be activated (50%+ filled)
            </p>
          )}
        </div>

        {/* Insufficient balance warning */}
        {address && !hasEnoughBalance && status === PoolStatus.OPENED && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700">
              Insufficient balance. Need {parseFloat(entryFeeFormatted).toFixed(2)} CELO to join.
            </p>
          </div>
        )}

        {/* Join error */}
        {joinError && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700">
              {joinError.message || "Failed to join pool. Please try again."}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {status === PoolStatus.OPENED && (
            <>
              <Button
                onClick={handleJoinPool}
                disabled={!canJoin || isJoining || currentPlayers >= maxPlayers}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
              >
                {isJoining ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Joining...
                  </>
                ) : currentPlayers >= maxPlayers ? (
                  "Pool Full"
                ) : !address ? (
                  "Connect Wallet to Join"
                ) : !hasEnoughBalance ? (
                  "Insufficient Balance"
                ) : (
                  "Join Game"
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = `/pools/${poolId}`}
              >
                View Details
              </Button>
            </>
          )}

          {status === PoolStatus.ACTIVE && (
            <Button
              variant="outline"
              className="flex-1 border-green-200 hover:bg-green-50"
              onClick={() => window.location.href = `/game/${poolId}`}
            >
              Watch Game
            </Button>
          )}

          {status === PoolStatus.COMPLETED && (
            <Button
              variant="outline"
              className="flex-1 border-gray-200 hover:bg-gray-50"
              onClick={() => window.location.href = `/game/${poolId}/results`}
            >
              View Results
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default function PoolsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("recent");

  // Wallet hooks
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  // Contract hooks
  const {
    data: pools,
    isLoading: isLoadingPools,
    error: poolsError,
    refetch: refetchPools
  } = useActivePools();

  const { success } = useToast();

  // Real-time event watching for live updates
  useWatchPlayerJoined({
    onLogs: (logs) => {
      logs.forEach((log) => {
        success("Player joined!", `A player joined pool #${log.args.poolId}`);
        refetchPools(); // Refresh pools data
      });
    }
  });

  useWatchPoolActivated({
    onLogs: (logs) => {
      logs.forEach((log) => {
        success("Pool activated!", `Pool #${log.args.poolId} is now active!`);
        refetchPools(); // Refresh pools data
      });
    }
  });

  // Filter pools based on search and status
  const filteredPools = pools?.filter(pool => {
    const poolId = pool.id.toString();
    const creatorAddr = pool.creator.toLowerCase();

    const matchesSearch = poolId.includes(searchTerm) ||
                         creatorAddr.includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" ||
                         (statusFilter === "OPENED" && pool.status === PoolStatus.OPENED) ||
                         (statusFilter === "ACTIVE" && pool.status === PoolStatus.ACTIVE) ||
                         (statusFilter === "COMPLETED" && pool.status === PoolStatus.COMPLETED);

    return matchesSearch && matchesStatus;
  }) || [];

  // Loading state
  if (isLoadingPools) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Game Pools</h1>
          <p className="text-gray-600">Loading available pools...</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (poolsError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Game Pools</h1>
          <p className="text-gray-600">Failed to load pools</p>
        </div>
        <ErrorBanner
          message={poolsError.message || "Failed to load pools from the blockchain"}
          onRetry={refetchPools}
        />
      </div>
    );
  }

  // Calculate real stats from loaded pools
  const activePools = filteredPools.filter(pool => pool.status === PoolStatus.OPENED || pool.status === PoolStatus.ACTIVE);
  const totalPrizePool = filteredPools.reduce((sum, pool) => sum + Number(formatEther(pool.prizePool)), 0);
  const totalPlayers = filteredPools.reduce((sum, pool) => sum + Number(pool.currentPlayers), 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Wallet Connection Banner */}
      {!isConnected && <WalletConnectionBanner />}

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Game Pools</h1>
            <p className="text-gray-600">Join a game or watch others compete in the minority-wins challenge</p>
          </div>
          <Button
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            onClick={() => window.location.href = '/stake'}
          >
            Create New Pool
          </Button>
        </div>

        {/* Real-time Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Pools</p>
                <p className="text-xl font-bold">{activePools.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Players</p>
                <p className="text-xl font-bold">{totalPlayers}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Coins className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Prize Pool</p>
                <p className="text-xl font-bold">{totalPrizePool.toFixed(2)} CELO</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Pools</p>
                <p className="text-xl font-bold">{filteredPools.length}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by creator name or pool ID..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <select 
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="OPENED">Open</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
          </select>
          
          <select 
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="recent">Most Recent</option>
            <option value="prize">Highest Prize</option>
            <option value="players">Most Players</option>
            <option value="ending">Ending Soon</option>
          </select>
          
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Pool Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPools.map((pool) => (
          <PoolCard
            key={pool.id.toString()}
            poolId={pool.id}
            creator={pool.creator}
            entryFee={pool.entryFee}
            maxPlayers={pool.maxPlayers}
            currentPlayers={pool.currentPlayers}
            prizePool={pool.prizePool}
            status={pool.status}
            address={address}
            balance={balance?.value}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredPools.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Users className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pools found</h3>
          <p className="text-gray-500 mb-4">
            {pools?.length === 0
              ? "No pools have been created yet. Be the first to create a pool!"
              : "Try adjusting your search or filters to find pools."
            }
          </p>
          <Button
            className="bg-gradient-to-r from-purple-600 to-blue-600"
            onClick={() => window.location.href = '/stake'}
          >
            Create New Pool
          </Button>
        </div>
      )}

      {/* Refresh Button */}
      {filteredPools.length > 0 && (
        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={refetchPools}
            disabled={isLoadingPools}
          >
            {isLoadingPools ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Refreshing...
              </>
            ) : (
              "Refresh Pools"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}