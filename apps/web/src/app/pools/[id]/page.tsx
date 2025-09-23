"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount, useBalance } from "wagmi";
import { formatEther } from "viem";
import { useMiniApp } from "@/contexts/miniapp-context";
import {
  ArrowLeft,
  Users,
  Coins,
  Trophy,
  AlertCircle,
  Play,
  Eye,
  Share2,
  CheckCircle2,
  Loader2,
  Wallet,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  usePoolInfo,
  useJoinPool,
  useCreatorInfo,
  useRemainingPlayers,
  useJoinedPlayers,
  useWatchPlayerJoined,
} from "@/hooks";
import { useToast } from "@/hooks/use-toast";
import { PoolStatus } from "@/lib/contract";

// Helper functions
const formatAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

const getStatusColor = (status: PoolStatus) => {
  switch (status) {
    case PoolStatus.OPENED:
      return "bg-blue-500";
    case PoolStatus.ACTIVE:
      return "bg-green-500";
    case PoolStatus.COMPLETED:
      return "bg-purple-500";
    case PoolStatus.ABANDONED:
      return "bg-red-500";
    default:
      return "bg-gray-400";
  }
};

const getStatusText = (status: PoolStatus) => {
  switch (status) {
    case PoolStatus.OPENED:
      return "Open for Players";
    case PoolStatus.ACTIVE:
      return "Game in Progress";
    case PoolStatus.COMPLETED:
      return "Completed";
    case PoolStatus.ABANDONED:
      return "Abandoned";
    default:
      return "Unknown";
  }
};

const JoinPoolModal = ({
  isOpen,
  onClose,
  poolId,
  entryFee,
  prizePool,
}: {
  isOpen: boolean;
  onClose: () => void;
  poolId: string;
  entryFee: string;
  prizePool: string;
}) => {
  const { joinPool, isPending: isJoining } = useJoinPool();
  const { success, error } = useToast();

  if (!isOpen) return null;

  const handleJoin = () => {
    try {
      joinPool({
        poolId: Number(poolId),
        entryFee: entryFee,
      });
      success("Joining pool...", "Your transaction is being processed.");
    } catch (err) {
      console.error("Join pool error:", err);
      error("Failed to join", "Could not join the pool. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800 text-white">
        <div className="p-6">
          <h3 className="text-xl font-bold mb-6 text-center">
            Join Pool #{poolId}
          </h3>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center p-4 bg-gray-800 rounded-lg border border-gray-700">
              <span className="text-gray-300">Entry Fee</span>
              <span className="font-bold text-white">{entryFee} CELO</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-800 rounded-lg border border-gray-700">
              <span className="text-gray-300">Potential Prize</span>
              <span className="font-bold text-green-400">
                {(
                  (parseFloat(prizePool) + parseFloat(entryFee)) *
                  0.95
                ).toFixed(2)}{" "}
                CELO
              </span>
            </div>

            <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-700/50">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-200">
                  <p className="font-medium mb-2">Game Rules:</p>
                  <ul className="text-xs space-y-1 text-blue-300">
                    <li>• Choose HEADS or TAILS each round</li>
                    <li>• Minority choice wins, majority eliminated</li>
                    <li>• Last player standing wins the prize</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isJoining}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              {isJoining ? "Processing..." : "Cancel"}
            </Button>
            <Button
              onClick={handleJoin}
              disabled={isJoining}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isJoining ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Joining...
                </>
              ) : (
                "Join Pool"
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default function PoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Wallet and balance
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  // Join pool state for loading indication
  const { isPending: isJoining } = useJoinPool();

  // Farcaster context for usernames
  const { context } = useMiniApp();
  const currentUser = context?.user;

  // Helper function to get display name for a player address
  const getPlayerDisplayName = (playerAddress: `0x${string}`) => {
    // Check if this address belongs to the current Farcaster user
    const userAddresses = [
      currentUser?.custody,
      ...(currentUser?.verifications || []),
      address, // Also check the connected wallet address
    ]
      .filter(Boolean)
      .map((addr) => addr?.toLowerCase());

    const isCurrentUser = userAddresses.some(
      (userAddr) => userAddr === playerAddress.toLowerCase()
    );

    if (isCurrentUser && currentUser) {
      // Return Farcaster username or display name
      if (currentUser.username) return `@${currentUser.username}`;
      if (currentUser.displayName) return currentUser.displayName;
    }

    // Fallback to formatted wallet address
    return formatAddress(playerAddress);
  };

  // Helper function to get player label (You vs Player)
  const getPlayerLabel = (playerAddress: `0x${string}`) => {
    const userAddresses = [
      currentUser?.custody,
      ...(currentUser?.verifications || []),
      address,
    ]
      .filter(Boolean)
      .map((addr) => addr?.toLowerCase());

    const isCurrentUser = userAddresses.some(
      (userAddr) => userAddr === playerAddress.toLowerCase()
    );

    return isCurrentUser ? "You" : "Player";
  };

  const poolId = params?.id as string;

  // Fetch pool data
  const {
    data: poolData,
    isLoading: isLoadingPool,
    error: poolError,
    refetch: refetchPool,
  } = usePoolInfo(poolId ? parseInt(poolId) : 0);

  // Fetch creator info
  const { data: creatorInfo, isLoading: isLoadingCreator } = useCreatorInfo();

  // Fetch current players (only if pool is active/opened)
  const { data: playerAddresses, isLoading: isLoadingPlayers } =
    useRemainingPlayers(poolId ? parseInt(poolId) : 0);

  // Fetch joined players using events (works for all pool states)
  const {
    joinedPlayers,
    isLoading: isLoadingJoinedPlayers,
    count: joinedPlayersCount,
  } = useJoinedPlayers(poolId ? parseInt(poolId) : 0);

  // Watch for new players joining to refresh the data
  useWatchPlayerJoined({
    poolId: parseInt(poolId || "0"),
    onLogs: () => {
      // Force refresh of all pool-related data
      refetchPool();
    },
  });

  // Loading state
  if (isLoadingPool || isLoadingCreator) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
            <p className="text-gray-400">Loading pool details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (poolError || !poolData) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="flex items-center justify-center h-64">
          <Card className="p-8 text-center bg-gray-900 border-gray-800">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              Pool Not Found
            </h2>
            <p className="text-gray-400 mb-4">
              Pool #{poolId} doesn't exist or couldn't be loaded.
            </p>
            <Button
              onClick={() => router.push("/pools")}
              variant="outline"
              className="border-gray-600 text-gray-300"
            >
              Back to Pools
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Format pool data
  const pool = {
    id: poolId,
    creator: poolData.creator,
    entryFee: formatEther(poolData.entryFee),
    maxPlayers: Number(poolData.maxPlayers),
    currentPlayers: Number(poolData.currentPlayers),
    prizePool: formatEther(poolData.prizePool),
    status: poolData.status,
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/pools/${poolId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join Pool #${poolId} - theonepercent`,
          text: `Join this CoinToss game pool! Entry fee: ${pool.entryFee} CELO, Prize pool: ${pool.prizePool} CELO`,
          url: url,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isCreator = address?.toLowerCase() === pool.creator.toLowerCase();
  const hasEnoughBalance = balance
    ? parseFloat(formatEther(balance.value)) >= parseFloat(pool.entryFee)
    : false;

  // Check if current user has already joined the pool
  const hasJoined =
    joinedPlayers && joinedPlayers.length > 0
      ? joinedPlayers.some((playerAddress) => {
          const userAddresses = [
            currentUser?.custody,
            ...(currentUser?.verifications || []),
            address,
          ]
            .filter(Boolean)
            .map((addr) => addr?.toLowerCase());

          return userAddresses.some(
            (userAddr) => userAddr === playerAddress.toLowerCase()
          );
        })
      : false;

  const canJoin =
    pool.status === PoolStatus.OPENED &&
    pool.currentPlayers < pool.maxPlayers &&
    isConnected &&
    !isCreator &&
    !hasJoined &&
    hasEnoughBalance;
  const canActivate = pool.currentPlayers >= Math.ceil(pool.maxPlayers / 2);
  const fillPercentage = (pool.currentPlayers / pool.maxPlayers) * 100;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Pool #{poolId}</h1>
            <p className="text-sm text-gray-400">
              Minority-wins elimination game
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </>
          )}
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Main Pool Card */}
        <Card className="bg-gray-900 border-gray-700 overflow-hidden">
          <div className="p-6">
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${getStatusColor(
                    pool.status
                  )}`}
                ></div>
                <span className="text-sm font-medium text-gray-300">
                  {getStatusText(pool.status)}
                </span>
              </div>
              {pool.status === PoolStatus.OPENED && (
                <div className="flex items-center gap-1 text-xs text-blue-400">
                  <Users className="w-3 h-3" />
                  <span>ACCEPTING PLAYERS</span>
                </div>
              )}
            </div>

            {/* Prize Pool Display */}
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-white mb-1">
                {parseFloat(pool.prizePool).toFixed(2)}
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-wider">
                TOTAL PRIZE POOL
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {pool.entryFee}
                </div>
                <div className="text-xs text-gray-400 uppercase">ENTRY FEE</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {pool.currentPlayers}/{pool.maxPlayers}
                </div>
                <div className="text-xs text-gray-400 uppercase">PLAYERS</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {fillPercentage.toFixed(0)}%
                </div>
                <div className="text-xs text-gray-400 uppercase">FILLED</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    canActivate ? "bg-green-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${fillPercentage}%` }}
                ></div>
              </div>
              {canActivate && pool.status === PoolStatus.OPENED && (
                <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Ready to activate
                </p>
              )}
            </div>

            {/* Action Button */}
            <div className="space-y-3">
              {!isConnected ? (
                <Button
                  disabled
                  className="w-full bg-gray-700 text-gray-400"
                  size="lg"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet to Join
                </Button>
              ) : !hasEnoughBalance && pool.status === PoolStatus.OPENED ? (
                <Button
                  disabled
                  className="w-full bg-gray-700 text-gray-400"
                  size="lg"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Insufficient Balance
                </Button>
              ) : isCreator && pool.status === PoolStatus.OPENED ? (
                <Button
                  disabled
                  className="w-full bg-yellow-600 text-black"
                  size="lg"
                >
                  👑 Your Pool
                </Button>
              ) : hasJoined && pool.status === PoolStatus.OPENED ? (
                <Button
                  disabled
                  className="w-full bg-green-600 text-white"
                  size="lg"
                >
                  ✅ Joined - Waiting for Game
                </Button>
              ) : canJoin ? (
                <Button
                  onClick={() => setShowJoinModal(true)}
                  disabled={isJoining}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Join Game ({pool.entryFee} CELO)
                    </>
                  )}
                </Button>
              ) : pool.status === PoolStatus.ACTIVE ? (
                <Button
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                  size="lg"
                  onClick={() => router.push(`/game/${poolId}`)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Watch Game
                </Button>
              ) : (
                <Button
                  disabled
                  className="w-full bg-gray-700 text-gray-400"
                  size="lg"
                >
                  Pool Unavailable
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Players Card */}
        <Card className="bg-gray-900 border-gray-700">
          <div className="p-4">
            <h3 className="text-lg font-bold mb-4 text-white">
              Players ({pool.currentPlayers}/{pool.maxPlayers})
            </h3>
            <div className="space-y-3">
              {isLoadingPlayers || isLoadingJoinedPlayers ? (
                <div className="text-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2 text-blue-400" />
                  <p className="text-sm text-gray-500">Loading players...</p>
                </div>
              ) : joinedPlayers && joinedPlayers.length > 0 ? (
                <>
                  {joinedPlayers.map((playerAddress) => {
                    const generateAvatar = (addr: string) => {
                      const colors = [
                        "bg-red-500",
                        "bg-blue-500",
                        "bg-green-500",
                        "bg-purple-500",
                        "bg-yellow-500",
                        "bg-pink-500",
                        "bg-indigo-500",
                        "bg-teal-500",
                      ];
                      const colorIndex =
                        parseInt(addr.slice(-1), 16) % colors.length;
                      return colors[colorIndex];
                    };

                    return (
                      <div
                        key={playerAddress}
                        className="flex items-center gap-3 p-2 rounded-lg bg-gray-800"
                      >
                        <div
                          className={`w-8 h-8 rounded-full ${generateAvatar(
                            playerAddress
                          )} flex items-center justify-center text-white font-bold text-xs`}
                        >
                          {playerAddress.slice(2, 4).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">
                            {getPlayerDisplayName(playerAddress)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {getPlayerLabel(playerAddress)}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty slots */}
                  {Array.from(
                    { length: pool.maxPlayers - joinedPlayers.length },
                    (_, index) => (
                      <div
                        key={`empty-${index}`}
                        className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50 border border-dashed border-gray-600"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                          <Users className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">
                            Waiting for player...
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </>
              ) : (
                Array.from({ length: pool.maxPlayers }, (_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50 border border-dashed border-gray-600"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      <Users className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">
                        Waiting for player...
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        {/* Game Rules Card */}
        <Card className="bg-gray-900 border-gray-700">
          <div className="p-4">
            <h3 className="text-lg font-bold mb-4 text-white">Game Rules</h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-start gap-3">
                <Target className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <p>Choose HEADS or TAILS each round</p>
              </div>
              <div className="flex items-start gap-3">
                <Trophy className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <p>Minority choice wins, majority gets eliminated</p>
              </div>
              <div className="flex items-start gap-3">
                <Coins className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <p>Last player standing wins 95% of prize pool</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Creator Info Card */}
        <Card className="bg-gray-900 border-gray-700">
          <div className="p-4">
            <h3 className="text-lg font-bold mb-4 text-white">Pool Creator</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {pool.creator.slice(2, 4).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-white">
                  {formatAddress(pool.creator)}
                </p>
                <p className="text-xs text-gray-500">Pool Creator</p>
              </div>
            </div>

            {creatorInfo && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Pools Remaining</span>
                  <span className="font-medium text-white">
                    {creatorInfo.poolsRemaining?.toString() || "0"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">CELO Staked</span>
                  <span className="font-medium text-white">
                    {creatorInfo.stakedAmount
                      ? formatEther(creatorInfo.stakedAmount)
                      : "0"}{" "}
                    CELO
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Verified</span>
                  <span
                    className={`font-medium ${
                      creatorInfo.isVerified ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {creatorInfo.isVerified ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Join Modal */}
      <JoinPoolModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        poolId={poolId}
        entryFee={pool.entryFee}
        prizePool={pool.prizePool}
      />
    </div>
  );
}
