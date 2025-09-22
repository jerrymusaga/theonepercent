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
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePoolInfo, useJoinPool, useCreatorInfo, useRemainingPlayers, useJoinedPlayers, useWatchPlayerJoined } from "@/hooks";
import { useToast } from "@/hooks/use-toast";
import { PoolStatus } from "@/lib/contract";

// Helper functions
const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

const getStatusColor = (status: PoolStatus) => {
  switch (status) {
    case PoolStatus.OPENED: return "bg-blue-500";
    case PoolStatus.ACTIVE: return "bg-green-500 animate-pulse";
    case PoolStatus.COMPLETED: return "bg-purple-500";
    case PoolStatus.ABANDONED: return "bg-red-500";
    default: return "bg-gray-400";
  }
};

const getStatusText = (status: PoolStatus) => {
  switch (status) {
    case PoolStatus.OPENED: return "Open for Players";
    case PoolStatus.ACTIVE: return "Game in Progress";
    case PoolStatus.COMPLETED: return "Completed";
    case PoolStatus.ABANDONED: return "Abandoned";
    default: return "Unknown";
  }
};

const JoinPoolModal = ({
  isOpen,
  onClose,
  poolId,
  entryFee,
  prizePool
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
        entryFee: entryFee
      });
      success("Joining pool...", "Your transaction is being processed.");
      // Don't close modal immediately - let the loading state show
      // Modal will close when user manually closes it or when transaction completes
    } catch (err) {
      console.error("Join pool error:", err);
      error("Failed to join", "Could not join the pool. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6">
        <h3 className="text-lg font-bold mb-4">Join Pool #{poolId}</h3>

        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Entry Fee</span>
            <span className="font-bold">{entryFee} CELO</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Potential Prize</span>
            <span className="font-bold text-green-600">
              {((parseFloat(prizePool) + parseFloat(entryFee)) * 0.95).toFixed(2)} CELO
            </span>
          </div>
          
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Game Rules:</p>
                <ul className="text-xs space-y-1">
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
            className="flex-1"
          >
            {isJoining ? "Processing..." : "Cancel"}
          </Button>
          <Button
            onClick={handleJoin}
            disabled={isJoining}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
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
      address // Also check the connected wallet address
    ].filter(Boolean).map(addr => addr?.toLowerCase());

    const isCurrentUser = userAddresses.some(userAddr =>
      userAddr === playerAddress.toLowerCase()
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
      address
    ].filter(Boolean).map(addr => addr?.toLowerCase());

    const isCurrentUser = userAddresses.some(userAddr =>
      userAddr === playerAddress.toLowerCase()
    );

    return isCurrentUser ? 'You' : 'Player';
  };

  const poolId = params?.id as string;

  // Fetch pool data
  const {
    data: poolData,
    isLoading: isLoadingPool,
    error: poolError,
    refetch: refetchPool
  } = usePoolInfo(poolId ? parseInt(poolId) : 0);

  // Fetch creator info
  const {
    data: creatorInfo,
    isLoading: isLoadingCreator
  } = useCreatorInfo();

  // Fetch current players (only if pool is active/opened)
  const {
    data: playerAddresses,
    isLoading: isLoadingPlayers
  } = useRemainingPlayers(poolId ? parseInt(poolId) : 0);

  // Fetch joined players using events (works for all pool states)
  const {
    joinedPlayers,
    isLoading: isLoadingJoinedPlayers,
    count: joinedPlayersCount
  } = useJoinedPlayers(poolId ? parseInt(poolId) : 0);

  // Watch for new players joining to refresh the data
  useWatchPlayerJoined({
    poolId: parseInt(poolId || '0'),
    onLogs: () => {
      // Force refresh of all pool-related data
      refetchPool();
    }
  });

  // Loading state
  if (isLoadingPool || isLoadingCreator) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading pool details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (poolError || !poolData) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Pool Not Found</h2>
            <p className="text-gray-600 mb-4">
              Pool #{poolId} doesn't exist or couldn't be loaded.
            </p>
            <Button onClick={() => router.push('/pools')} variant="outline">
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
    status: poolData.status
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
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isCreator = address?.toLowerCase() === pool.creator.toLowerCase();
  const hasEnoughBalance = balance ? parseFloat(formatEther(balance.value)) >= parseFloat(pool.entryFee) : false;

  // Check if current user has already joined the pool
  const hasJoined = joinedPlayers && joinedPlayers.length > 0 ? joinedPlayers.some(playerAddress => {
    const userAddresses = [
      currentUser?.custody,
      ...(currentUser?.verifications || []),
      address
    ].filter(Boolean).map(addr => addr?.toLowerCase());

    return userAddresses.some(userAddr =>
      userAddr === playerAddress.toLowerCase()
    );
  }) : false;

  const canJoin = pool.status === PoolStatus.OPENED && pool.currentPlayers < pool.maxPlayers && isConnected && !isCreator && !hasJoined && hasEnoughBalance;

  // Debug logs to understand the issue
  // CRITICAL DEBUG: Mainnet issue where joined pools don't show as joined
  
  const canActivate = pool.currentPlayers >= Math.ceil(pool.maxPlayers / 2);
  const fillPercentage = (pool.currentPlayers / pool.maxPlayers) * 100;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Pool #{poolId}</h1>
          <p className="text-gray-600">Minority-wins elimination game</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="flex items-center gap-2"
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              Share
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pool Status */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(pool.status)}`}></div>
                <span className="font-medium">{getStatusText(pool.status)}</span>
              </div>

              {pool.status === PoolStatus.OPENED && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">Accepting Players</span>
                </div>
              )}
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">
                  Players: {pool.currentPlayers}/{pool.maxPlayers}
                </span>
                <span className="text-sm text-gray-500">{fillPercentage.toFixed(0)}% full</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    canActivate 
                      ? 'bg-gradient-to-r from-green-500 to-blue-500' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-600'
                  }`}
                  style={{ width: `${fillPercentage}%` }}
                ></div>
              </div>
              
              {canActivate && pool.status === PoolStatus.OPENED && (
                <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Can be activated (50%+ filled)
                </p>
              )}
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Prize Pool</span>
                </div>
                <p className="text-2xl font-bold text-yellow-900">{pool.prizePool} CELO</p>
                <p className="text-xs text-yellow-700">Winner gets 95%</p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Entry Fee</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{pool.entryFee} CELO</p>
                <p className="text-xs text-blue-700">Per player</p>
              </div>
            </div>
          </Card>

          {/* Game Rules */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">How to Play</h3>
            <div className="space-y-4">
              <p className="text-gray-700">
                A minority-wins elimination game where players choose HEADS or TAILS each round.
                The minority choice wins and majority players are eliminated until only one remains.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-1">Rounds</h4>
                  <p className="text-sm text-purple-700">Multiple rounds until 1 winner remains</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-1">Win Condition</h4>
                  <p className="text-sm text-green-700">Be the last player standing</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-1">Prize Split</h4>
                  <p className="text-sm text-blue-700">Winner: 95%, Creator: 5%</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Pool Statistics */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Pool Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{pool.currentPlayers}</p>
                <p className="text-sm text-gray-500">Current Players</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{pool.maxPlayers}</p>
                <p className="text-sm text-gray-500">Max Players</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-lg font-bold text-green-600">{parseFloat(pool.prizePool).toFixed(4)} CELO</p>
                <p className="text-sm text-gray-500">Total Prize Pool</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Creator Info */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Pool Creator</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {pool.creator.slice(2, 4).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{formatAddress(pool.creator)}</p>
                <p className="text-xs text-gray-500">Pool Creator</p>
              </div>
            </div>

            {creatorInfo && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pools Remaining</span>
                  <span className="font-medium">{creatorInfo.poolsRemaining?.toString() || '0'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">CELO Staked</span>
                  <span className="font-medium">{creatorInfo.stakedAmount ? formatEther(creatorInfo.stakedAmount) : '0'} CELO</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Verified</span>
                  <span className="font-medium text-green-600">{creatorInfo.isVerified ? 'Yes' : 'No'}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Current Players */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Players ({pool.currentPlayers}/{pool.maxPlayers})</h3>
            <div className="space-y-3">
              {isLoadingPlayers || isLoadingJoinedPlayers ? (
                <div className="text-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading players...</p>
                </div>
              ) : joinedPlayers && joinedPlayers.length > 0 ? (
                <>
                  {/* Show actual players from events */}
                  {joinedPlayers.map((playerAddress) => {
                    const generateAvatar = (addr: string) => {
                      const colors = [
                        'from-red-400 to-red-600',
                        'from-blue-400 to-blue-600',
                        'from-green-400 to-green-600',
                        'from-purple-400 to-purple-600',
                        'from-yellow-400 to-yellow-600',
                        'from-pink-400 to-pink-600',
                        'from-indigo-400 to-indigo-600',
                        'from-teal-400 to-teal-600'
                      ];
                      const colorIndex = parseInt(addr.slice(-1), 16) % colors.length;
                      return colors[colorIndex];
                    };

                    return (
                      <div key={playerAddress} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${generateAvatar(playerAddress)} flex items-center justify-center text-white font-bold text-xs`}>
                          {playerAddress.slice(2, 4).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{getPlayerDisplayName(playerAddress)}</p>
                          <p className="text-xs text-gray-500">
                            {getPlayerLabel(playerAddress)}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty slots */}
                  {Array.from({ length: pool.maxPlayers - joinedPlayers.length }, (_, index) => (
                    <div key={`empty-${index}`} className="flex items-center gap-3 opacity-50">
                      <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <Users className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-400">Waiting for player...</p>
                      </div>
                    </div>
                  ))}
                </>
              ) : pool.currentPlayers > 0 ? (
                <>
                  {/* Show placeholder players when we don't have addresses but know count */}
                  {Array.from({ length: pool.currentPlayers }, (_, index) => (
                    <div key={`joined-${index}`} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                        ?
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Player #{index + 1}</p>
                        <p className="text-xs text-gray-500">Joined</p>
                      </div>
                    </div>
                  ))}

                  {/* Empty slots */}
                  {Array.from({ length: pool.maxPlayers - pool.currentPlayers }, (_, index) => (
                    <div key={`empty-${index}`} className="flex items-center gap-3 opacity-50">
                      <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <Users className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-400">Waiting for player...</p>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {/* No players yet, show empty slots */}
                  {Array.from({ length: pool.maxPlayers }, (_, index) => (
                    <div key={`empty-${index}`} className="flex items-center gap-3 opacity-50">
                      <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <Users className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-400">Waiting for player...</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            {!isConnected ? (
              <Button
                disabled
                className="w-full"
                size="lg"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet to Join
              </Button>
            ) : !hasEnoughBalance && pool.status === PoolStatus.OPENED ? (
              <Button
                disabled
                className="w-full"
                size="lg"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Insufficient Balance
              </Button>
            ) : isCreator && pool.status === PoolStatus.OPENED ? (
              <Button
                disabled
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600"
                size="lg"
              >
                👑 This is Your Pool
              </Button>
            ) : hasJoined && pool.status === PoolStatus.OPENED ? (
              <Button
                disabled
                className="w-full bg-gradient-to-r from-green-500 to-green-600"
                size="lg"
              >
                ✅ Already Joined - Wait for Activation
              </Button>
            ) : canJoin ? (
              <Button
                onClick={() => setShowJoinModal(true)}
                disabled={isJoining}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
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
                className="w-full"
                size="lg"
                onClick={() => router.push(`/game/${poolId}`)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Watch Game
              </Button>
            ) : pool.status === PoolStatus.OPENED && pool.currentPlayers >= pool.maxPlayers ? (
              <Button
                disabled
                className="w-full"
                size="lg"
              >
                Pool Full
              </Button>
            ) : (
              <Button
                disabled
                className="w-full"
                size="lg"
              >
                Pool Unavailable
              </Button>
            )}
          </div>
        </div>
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