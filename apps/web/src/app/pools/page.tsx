"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useBalance } from "wagmi";
import { formatEther } from "viem";
import {
  Search,
  Filter,
  Users,
  Coins,
  Clock,
  TrendingUp,
  Wallet,
  AlertTriangle,
  Gamepad2,
  Trophy,
  Zap,
  Target,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useAllPools,
  useJoinPool,
  useWatchPlayerJoined,
  useWatchPoolActivated,
  useWatchGameCompleted,
  usePoolInfo,
  useCurrentRound,
  useRemainingPlayers,
} from "@/hooks";
// Use Envio hooks for better performance
import {
  useEnvioJoinedPlayers,
  useEnvioHasPlayerJoined,
} from "@/hooks/use-envio-players";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useToast } from "@/hooks/use-toast";
import { PoolStatus } from "@/lib/contract";
import { VerificationBadge } from "@/components/verification-status";

// Loading component with gaming style
const LoadingSpinner = ({ className = "" }: { className?: string }) => (
  <div
    className={`animate-spin rounded-full border-2 border-t-cyan-400 border-r-transparent border-b-cyan-400 border-l-transparent ${className}`}
  ></div>
);

// Error component with gaming style
const ErrorBanner = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) => (
  <div className="border-l-4 border-l-red-500 bg-gray-900/80 border border-red-500/30 p-4 backdrop-blur-sm">
    <div className="flex items-center gap-3">
      <AlertTriangle className="w-5 h-5 text-red-400" />
      <div className="flex-1">
        <p className="font-semibold text-red-300 text-sm uppercase tracking-wide">
          SYSTEM ERROR
        </p>
        <p className="text-red-100 text-sm">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="border-red-500/50 text-red-300 hover:bg-red-500/20 hover:border-red-400"
        >
          RETRY
        </Button>
      )}
    </div>
  </div>
);

// Wallet connection component with gaming style
const WalletConnectionBanner = () => (
  <div className="border-l-4 border-l-blue-500 bg-gray-900/80 border border-blue-500/30 p-4 backdrop-blur-sm mb-6">
    <div className="flex items-center gap-3">
      <Wallet className="w-5 h-5 text-blue-400" />
      <div className="flex-1">
        <p className="font-semibold text-blue-300 text-sm uppercase tracking-wide">
          WALLET DISCONNECTED
        </p>
        <p className="text-blue-100 text-sm">
          Connect your wallet to join battles and compete for prizes
        </p>
      </div>
      <Button className="bg-blue-600 hover:bg-blue-700 border border-blue-500 text-white font-semibold">
        CONNECT WALLET
      </Button>
    </div>
  </div>
);

// Helper function to format pool status with gaming theme
const getPoolStatusInfo = (
  status: PoolStatus,
  currentRound?: number,
  remainingPlayers?: number
) => {
  switch (status) {
    case PoolStatus.OPENED:
      return {
        text: "OPEN TO JOIN",
        color: "bg-blue-500/20 text-blue-300 border-blue-500/50",
        icon: <Users className="w-3 h-3" />,
        borderColor: "border-blue-500",
      };
    case PoolStatus.ACTIVE:
      return {
        text: `ROUND ${currentRound} • ${remainingPlayers} PLAYERS LEFT`,
        color: "bg-green-500/20 text-green-300 border-green-500/50",
        icon: (
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        ),
        borderColor: "border-green-500",
      };
    case PoolStatus.COMPLETED:
      return {
        text: "COMPLETED",
        color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
        icon: <Trophy className="w-3 h-3" />,
        borderColor: "border-yellow-500",
      };
    case PoolStatus.ABANDONED:
      return {
        text: "ABANDONED",
        color: "bg-red-500/20 text-red-300 border-red-500/50",
        icon: <AlertTriangle className="w-3 h-3" />,
        borderColor: "border-red-500",
      };
    default:
      return {
        text: "UNKNOWN",
        color: "bg-gray-500/20 text-gray-300 border-gray-500/50",
        icon: <Clock className="w-3 h-3" />,
        borderColor: "border-gray-500",
      };
  }
};

const StatusBadge = ({
  status,
  currentRound,
  remainingPlayers,
}: {
  status: PoolStatus;
  currentRound?: number;
  remainingPlayers?: number;
}) => {
  const statusInfo = getPoolStatusInfo(status, currentRound, remainingPlayers);

  return (
    <div
      className={`flex items-center gap-1 px-3 py-1 text-xs font-bold uppercase tracking-wider border rounded ${statusInfo.color}`}
    >
      {statusInfo.icon}
      {statusInfo.text}
    </div>
  );
};

// Enhanced StatusBadge that fetches real-time game data for active pools
const EnhancedStatusBadge = ({
  status,
  poolId,
}: {
  status: PoolStatus;
  poolId: number;
}) => {
  const { data: currentRoundBigInt } = useCurrentRound(poolId);
  const { data: remainingPlayersArray } = useRemainingPlayers(poolId);

  const currentRound = currentRoundBigInt
    ? Number(currentRoundBigInt)
    : undefined;
  const remainingPlayers = remainingPlayersArray
    ? remainingPlayersArray.length
    : undefined;

  return (
    <StatusBadge
      status={status}
      currentRound={currentRound}
      remainingPlayers={remainingPlayers}
    />
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
  hasJoined?: boolean;
  currentUser?: any;
  router?: any;
}

const PoolCard = ({
  poolId,
  creator,
  entryFee,
  maxPlayers,
  currentPlayers,
  prizePool,
  status,
  address,
  balance,
  hasJoined = false,
  currentUser,
  router,
}: PoolCardProps) => {
  const { joinPool, isPending: isJoining, error: joinError } = useJoinPool();
  const { success, error } = useToast();

  const fillPercentage = (Number(currentPlayers) / Number(maxPlayers)) * 100;
  const canActivate = fillPercentage >= 50;
  const entryFeeFormatted = formatEther(entryFee);
  const prizePoolFormatted = formatEther(prizePool);
  const hasEnoughBalance = balance ? balance >= entryFee : false;
  const isCreator = address?.toLowerCase() === creator.toLowerCase();
  const canJoin =
    address &&
    hasEnoughBalance &&
    status === PoolStatus.OPENED &&
    currentPlayers < maxPlayers &&
    !isCreator &&
    !hasJoined;

  const statusInfo = getPoolStatusInfo(status);

  const handleJoinPool = () => {
    if (!canJoin) return;

    try {
      joinPool({ poolId: Number(poolId), entryFee: entryFeeFormatted });
      success("Joining battle...", "Your transaction is being processed.");
    } catch (err) {
      console.error("Join pool error:", err);
      error("Failed to join", "Could not join the battle. Please try again.");
    }
  };

  // Format creator address
  const formatAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Get time display
  const getTimeDisplay = () => {
    return `POOL #${poolId.toString()}`;
  };

  return (
    <div
      className={`bg-gray-900/90 border-l-4 ${statusInfo.borderColor} border border-gray-700/50 p-4 md:p-6 backdrop-blur-sm hover:border-gray-600/50 transition-all duration-200 relative overflow-hidden group`}
    >
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-6 h-6 md:w-8 md:h-8">
        <div
          className={`w-full h-full ${statusInfo.borderColor} border-l border-b opacity-30`}
        ></div>
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <div
              className={`w-8 h-8 md:w-10 md:h-10 border-2 ${statusInfo.borderColor} bg-gray-800 flex items-center justify-center text-white font-bold text-xs md:text-sm shrink-0`}
            >
              #{poolId.toString()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-5 h-5 md:w-6 md:h-6 bg-gray-700 border border-gray-600 flex items-center justify-center shrink-0">
                  <span className="text-xs text-gray-300 font-bold">
                    {creator.slice(2, 4).toUpperCase()}
                  </span>
                </div>
                <span className="text-xs md:text-sm font-medium text-gray-300 truncate">
                  {formatAddress(creator)}
                </span>
                <VerificationBadge
                  address={creator as `0x${string}`}
                  size="sm"
                  showText={false}
                />
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold truncate">
                {getTimeDisplay()}
              </p>
            </div>
          </div>
          <div className="shrink-0 ml-2">
            <EnhancedStatusBadge status={status} poolId={Number(poolId)} />
          </div>
        </div>

        {/* Prize Pool & Entry Fee */}
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <div className="p-1.5 md:p-2 bg-yellow-500/20 border border-yellow-500/50 shrink-0">
              <Trophy className="w-3 h-3 md:w-4 md:h-4 text-yellow-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                PRIZE POOL
              </p>
              <p className="font-bold text-base md:text-lg text-yellow-400 truncate">
                {parseFloat(prizePoolFormatted).toFixed(2)} CELO
              </p>
            </div>
          </div>

          <div className="text-right shrink-0 ml-2">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
              ENTRY FEE
            </p>
            <p className="font-semibold text-sm md:text-base text-gray-200">
              {parseFloat(entryFeeFormatted).toFixed(2)} CELO
            </p>
          </div>
        </div>

        {/* Players Progress */}
        <div className="mb-3 md:mb-4">
          <div className="flex items-center justify-between text-xs md:text-sm mb-2">
            <span className="text-gray-400 uppercase tracking-wide font-semibold truncate">
              PLAYERS: {currentPlayers.toString()}/{maxPlayers.toString()}
            </span>
            <span className="text-gray-500 shrink-0 ml-2">
              {fillPercentage.toFixed(0)}% FULL
            </span>
          </div>

          <div className="w-full bg-gray-800 border border-gray-700 h-2">
            <div
              className={`h-full transition-all duration-300 ${
                canActivate
                  ? "bg-green-500"
                  : statusInfo.borderColor.includes("blue")
                  ? "bg-blue-500"
                  : statusInfo.borderColor.includes("green")
                  ? "bg-green-500"
                  : statusInfo.borderColor.includes("yellow")
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${fillPercentage}%` }}
            ></div>
          </div>

          {canActivate && status === PoolStatus.OPENED && (
            <p className="text-xs text-green-400 mt-1 font-semibold uppercase tracking-wide">
              ✓ READY FOR ACTIVATION (50%+ FILLED)
            </p>
          )}
        </div>

        {/* Creator notice */}
        {isCreator && status === PoolStatus.OPENED && (
          <div className="mb-4 p-2 bg-blue-500/10 border border-blue-500/30">
            <p className="text-xs text-blue-400 font-semibold uppercase tracking-wide">
              👑 YOUR POOL - CREATORS CANNOT JOIN THEIR OWN POOLS
            </p>
          </div>
        )}

        {/* Already joined notice */}
        {hasJoined && status === PoolStatus.OPENED && !isCreator && (
          <div className="mb-4 p-2 bg-green-500/10 border border-green-500/30">
            <p className="text-xs text-green-400 font-semibold uppercase tracking-wide">
              ✅ JOINED - WAITING FOR POOL ACTIVATION
            </p>
          </div>
        )}

        {/* Insufficient balance warning */}
        {address &&
          !hasEnoughBalance &&
          status === PoolStatus.OPENED &&
          !isCreator && (
            <div className="mb-4 p-2 bg-red-500/10 border border-red-500/30">
              <p className="text-xs text-red-400 font-semibold uppercase tracking-wide">
                INSUFFICIENT FUNDS - NEED{" "}
                {parseFloat(entryFeeFormatted).toFixed(2)} CELO TO JOIN
              </p>
            </div>
          )}

        {/* Join error */}
        {joinError && (
          <div className="mb-4 p-2 bg-red-500/10 border border-red-500/30">
            <p className="text-xs text-red-400 font-semibold uppercase tracking-wide">
              {joinError.message || "FAILED TO JOIN BATTLE - TRY AGAIN"}
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
                className="flex-1 bg-blue-600 hover:bg-blue-700 border border-blue-500 disabled:opacity-50 disabled:border-gray-600 font-semibold uppercase tracking-wide text-xs md:text-sm py-2 md:py-2"
              >
                {isJoining ? (
                  <>
                    <LoadingSpinner className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">JOINING...</span>
                    <span className="sm:hidden">JOINING</span>
                  </>
                ) : currentPlayers >= maxPlayers ? (
                  <>
                    <span className="hidden sm:inline">BATTLE FULL</span>
                    <span className="sm:hidden">FULL</span>
                  </>
                ) : !address ? (
                  <>
                    <span className="hidden sm:inline">CONNECT WALLET</span>
                    <span className="sm:hidden">CONNECT</span>
                  </>
                ) : isCreator ? (
                  <>
                    <span className="hidden sm:inline">👑 YOUR POOL</span>
                    <span className="sm:hidden">👑 YOURS</span>
                  </>
                ) : hasJoined ? (
                  <>
                    <span className="hidden sm:inline">✅ JOINED</span>
                    <span className="sm:hidden">✅ IN</span>
                  </>
                ) : !hasEnoughBalance ? (
                  <>
                    <span className="hidden sm:inline">INSUFFICIENT FUNDS</span>
                    <span className="sm:hidden">NO FUNDS</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">JOIN POOL</span>
                    <span className="sm:hidden">JOIN</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/pools/${poolId}`)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500 font-semibold uppercase tracking-wide text-xs shrink-0 px-2 md:px-3"
              >
                <span className="hidden md:inline">DETAILS</span>
                <span className="md:hidden">INFO</span>
              </Button>
            </>
          )}

          {status === PoolStatus.ACTIVE && (
            <Button
              variant="outline"
              className={`flex-1 font-semibold uppercase tracking-wide text-xs md:text-sm py-2 ${
                hasJoined
                  ? "border-blue-500/50 text-blue-300 hover:bg-blue-500/20 hover:border-blue-400"
                  : "border-green-500/50 text-green-300 hover:bg-green-500/20 hover:border-green-400"
              }`}
              onClick={() => router.push(`/game/${poolId}`)}
            >
              <Zap className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              {hasJoined ? (
                <>
                  <span className="hidden sm:inline">PLAY GAME</span>
                  <span className="sm:hidden">PLAY</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">WATCH BATTLE</span>
                  <span className="sm:hidden">WATCH</span>
                </>
              )}
            </Button>
          )}

          {status === PoolStatus.COMPLETED && (
            <Button
              variant="outline"
              className="flex-1 border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/20 hover:border-yellow-400 font-semibold uppercase tracking-wide text-xs md:text-sm py-2"
              onClick={() => router.push(`/game/${poolId}/results`)}
            >
              <Trophy className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">VIEW RESULTS</span>
              <span className="sm:hidden">RESULTS</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Wrapper component for PoolCard that handles joined status
// MIGRATION: Now uses Envio hooks for 3-5x faster data loading!
const PoolCardWithJoinedStatus = ({
  pool,
  address,
  balance,
  currentUser,
  router,
}: {
  pool: any;
  address?: `0x${string}`;
  balance?: bigint;
  currentUser?: any;
  router?: any;
}) => {
  // Get joined players for this specific pool using Envio (much faster!)
  const { data: joinedPlayers = [] } = useEnvioJoinedPlayers(pool.id?.toString());

  // Check if current user has joined using Envio (real-time data!)
  const { data: directHasJoined, isLoading: joinedLoading } = useEnvioHasPlayerJoined(
    pool.id?.toString(),
    address
  );

  // Fallback to old method if new method is loading
  const fallbackHasJoined = joinedPlayers && joinedPlayers.length > 0 && address
    ? (() => {
        const userAddresses = [
          currentUser?.custody,
          ...(currentUser?.verifications || []),
          address,
        ]
          .filter(Boolean)
          .map((addr) => addr?.toLowerCase());

        // Envio returns PlayerPool objects with player_id field
        return joinedPlayers.some((playerPool: any) =>
          userAddresses.some(
            (userAddr) => userAddr === playerPool.player_id?.toLowerCase()
          )
        );
      })()
    : false;

  // Use direct method if available, fallback to old method
  const hasJoined = joinedLoading ? fallbackHasJoined : directHasJoined;

  return (
    <PoolCard
      poolId={BigInt(pool.id)}
      creator={pool.data.creator}
      entryFee={pool.data.entryFee}
      maxPlayers={pool.data.maxPlayers}
      currentPlayers={pool.data.currentPlayers}
      prizePool={pool.data.prizePool}
      status={pool.data.status}
      address={address}
      balance={balance}
      hasJoined={hasJoined}
      currentUser={currentUser}
      router={router}
    />
  );
};

export default function PoolsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("recent");

  // Wallet hooks
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  // Farcaster context
  const { context } = useMiniApp();
  const currentUser = context?.user;

  // Contract hooks
  const {
    pools,
    isLoading: isLoadingPools,
    hasError: poolsError,
    refetch: refetchPools,
  } = useAllPools();

  const { success } = useToast();

  // Real-time event watching for live updates
  useWatchPlayerJoined({
    onLogs: (logs) => {
      logs.forEach((log) => {
        success(
          "Player joined!",
          `A player joined battle #${log.args.poolId}`
        );
        refetchPools(); // Refresh pools data
      });
    },
  });

  useWatchPoolActivated({
    onLogs: (logs) => {
      logs.forEach((log) => {
        success(
          "Battle activated!",
          `Battle #${log.args.poolId} is now active!`
        );
        refetchPools(); // Refresh pools data
      });
    },
  });

  // Filter pools based on search and status
  const filteredPools =
    pools?.filter((pool: any) => {
      if (!pool.data) return false; // Skip pools without data

      const poolId = pool.id.toString();
      const creatorAddr = pool.data.creator.toLowerCase();

      const matchesSearch =
        poolId.includes(searchTerm) ||
        creatorAddr.includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "OPENED" && pool.data.status === PoolStatus.OPENED) ||
        (statusFilter === "ACTIVE" && pool.data.status === PoolStatus.ACTIVE) ||
        (statusFilter === "COMPLETED" &&
          pool.data.status === PoolStatus.COMPLETED) ||
        (statusFilter === "ABANDONED" &&
          pool.data.status === PoolStatus.ABANDONED);

      return matchesSearch && matchesStatus;
    }) || [];

  // Loading state
  if (isLoadingPools) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 uppercase tracking-wider">
              BATTLE ARENA
            </h1>
            <p className="text-gray-400 uppercase tracking-wide font-semibold">
              LOADING AVAILABLE POOLS...
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-900/90 border-l-4 border-l-blue-500 border border-gray-700/50 p-6"
              >
                <div className="animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-700 border border-gray-600"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-700 mb-2"></div>
                      <div className="h-3 bg-gray-700 w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-20 bg-gray-700 mb-4"></div>
                  <div className="h-10 bg-gray-700"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (poolsError) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 uppercase tracking-wider">
              BATTLE ARENA
            </h1>
            <p className="text-gray-400 uppercase tracking-wide font-semibold">
              FAILED TO LOAD POOLS
            </p>
          </div>
          <ErrorBanner
            message="Failed to load battles from the blockchain"
            onRetry={refetchPools}
          />
        </div>
      </div>
    );
  }

  // Calculate real stats from loaded pools
  const activePools = filteredPools.filter(
    (pool: any) =>
      pool.data &&
      (pool.data.status === PoolStatus.OPENED ||
        pool.data.status === PoolStatus.ACTIVE)
  );
  const totalPrizePool = filteredPools.reduce(
    (sum: any, pool: any) =>
      pool.data ? sum + Number(formatEther(pool.data.prizePool)) : sum,
    0
  );
  const totalPlayers = filteredPools.reduce(
    (sum: any, pool: any) =>
      pool.data ? sum + Number(pool.data.currentPlayers) : sum,
    0
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-6xl">
        {/* Wallet Connection Banner */}
        {!isConnected && <WalletConnectionBanner />}

        {/* Game Explanation Banner */}
        <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700/50 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/20 border border-blue-500/50 rounded shrink-0">
              <Info className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-200 mb-2">How The One Percent Works</h3>
              <p className="text-blue-100 text-sm leading-relaxed">
                <strong>The Goal:</strong> Be different to win! Join pools and make binary choices (Heads or Tails) each round.
                Players who choose the <strong>minority option advance</strong>, while majority players are eliminated.
                The last survivor wins the 95% prize pool. Pools can manually activate when 50%+ players join.
                <p><strong>Create pools</strong> to earn 5% of every prize pool as creator rewards!</p>
              </p>
            </div>
          </div>
        </div>

        {/* Page Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 uppercase tracking-wider">
                AVAILABLE POOLS
              </h1>
              <p className="text-gray-400 uppercase tracking-wide font-semibold text-sm md:text-base">
                Join pools and compete in the minority-wins challenge
              </p>
            </div>
            <Button
              className="bg-red-600 hover:bg-red-700 border border-red-500 text-white font-semibold uppercase tracking-wide text-sm md:text-base px-3 py-2 md:px-4 md:py-2 shrink-0"
              onClick={() => router.push("/stake")}
            >
              <Target className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">CREATE POOL</span>
              <span className="sm:hidden">CREATE POOL</span>
            </Button>
          </div>

          {/* Real-time Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
            <div className="bg-gray-900/90 border-l-4 border-l-blue-500 border border-gray-700/50 p-2 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1 md:p-2 bg-blue-500/20 border border-blue-500/50">
                  <Gamepad2 className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-gray-500 uppercase tracking-wide font-semibold truncate">
                    ACTIVE
                  </p>
                  <p className="text-lg md:text-xl font-bold text-blue-400">
                    {activePools.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/90 border-l-4 border-l-green-500 border border-gray-700/50 p-2 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1 md:p-2 bg-green-500/20 border border-green-500/50">
                  <Users className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-gray-500 uppercase tracking-wide font-semibold truncate">
                    PLAYERS
                  </p>
                  <p className="text-lg md:text-xl font-bold text-green-400">
                    {totalPlayers}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/90 border-l-4 border-l-yellow-500 border border-gray-700/50 p-2 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1 md:p-2 bg-yellow-500/20 border border-yellow-500/50">
                  <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-gray-500 uppercase tracking-wide font-semibold truncate">
                    PRIZES
                  </p>
                  <p className="text-lg md:text-xl font-bold text-yellow-400">
                    {totalPrizePool.toFixed(2)} CELO
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/90 border-l-4 border-l-purple-500 border border-gray-700/50 p-2 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1 md:p-2 bg-purple-500/20 border border-purple-500/50">
                  <Target className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-gray-500 uppercase tracking-wide font-semibold truncate">
                    TOTAL POOLS
                  </p>
                  <p className="text-lg md:text-xl font-bold text-purple-400">
                    {filteredPools.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-3 md:gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by creator or battle ID..."
              className="w-full pl-10 pr-4 py-2 md:py-3 bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase tracking-wide font-semibold text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto">
            <select
              className="px-3 py-2 bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 uppercase tracking-wide font-semibold text-xs md:text-sm shrink-0"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">ALL POOLS</option>
              <option value="OPENED">OPEN TO JOIN</option>
              <option value="ACTIVE">LIVE GAMES</option>
              <option value="COMPLETED">FINISHED</option>
              <option value="ABANDONED">ABANDONED</option>
            </select>

            <select
              className="px-3 py-2 bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 uppercase tracking-wide font-semibold text-xs md:text-sm shrink-0"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recent">RECENT</option>
              <option value="prize">HIGH PRIZE</option>
              <option value="players">MOST FIGHTERS</option>
              <option value="ending">ENDING SOON</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 text-gray-300 hover:bg-gray-800 shrink-0"
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Pool Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {filteredPools.map(
            (pool: any) =>
              pool.data && (
                <PoolCardWithJoinedStatus
                  key={pool.id.toString()}
                  pool={pool}
                  address={address}
                  balance={balance?.value}
                  currentUser={currentUser}
                  router={router}
                />
              )
          )}
        </div>

        {/* Empty State */}
        {filteredPools.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 border border-gray-700 flex items-center justify-center">
              <Gamepad2 className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">
              NO BATTLES FOUND
            </h3>
            <p className="text-gray-400 mb-4 uppercase tracking-wide font-semibold">
              {pools?.length === 0
                ? "No battles have been created yet. Be the first to create a battle!"
                : "Try adjusting your search or filters to find battles."}
            </p>
            <Button
              className="bg-red-600 hover:bg-red-700 border border-red-500 text-white font-semibold uppercase tracking-wide"
              onClick={() => router.push("/stake")}
            >
              <Target className="w-4 h-4 mr-2" />
              CREATE BATTLE
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
              className="border-gray-700 text-gray-300 hover:bg-gray-800 font-semibold uppercase tracking-wide"
            >
              {isLoadingPools ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  REFRESHING...
                </>
              ) : (
                "REFRESH BATTLES"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
