"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import {
  Coins,
  Users,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  ArrowLeft,
  Info,
  Crown,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCreatorInfo, useCreatePool, useCreatorReward } from "@/hooks";
import { useToast } from "@/hooks/use-toast";

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
      <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
        <Wallet className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">
        Connect Your Wallet
      </h2>
      <p className="text-gray-400 mb-6">
        You need to connect your wallet to create game pools.
      </p>
      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
        Connect Wallet
      </Button>
    </Card>
  </div>
);

const StakingRequired = () => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
    <Card className="p-8 text-center max-w-md bg-gray-900 border-gray-800">
      <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
        <Crown className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Staking Required</h2>
      <p className="text-gray-400 mb-6">
        You need to stake CELO first to become a pool creator and start creating
        games.
      </p>
      <Button
        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        onClick={() => (window.location.href = "/stake")}
      >
        Go to Staking
      </Button>
    </Card>
  </div>
);

interface PoolConfig {
  entryFee: number;
  maxPlayers: number;
  autoCloseTime: number; // minutes
  description: string;
}

const PoolPreview = ({ config }: { config: PoolConfig }) => {
  const prizePool = config.entryFee * config.maxPlayers;
  const creatorReward = prizePool * 0.05;
  const winnerPrize = prizePool * 0.95;

  return (
    <Card className="p-6 bg-gray-900 border-gray-800">
      <h3 className="text-lg font-bold mb-4 text-white">Pool Preview</h3>

      <div className="space-y-4">
        {/* Pool stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 text-center">
            <p className="text-lg font-bold text-white">{config.entryFee}</p>
            <p className="text-xs text-gray-400">Entry Fee (CELO)</p>
          </div>

          <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 text-center">
            <p className="text-lg font-bold text-white">{config.maxPlayers}</p>
            <p className="text-xs text-gray-400">Max Players</p>
          </div>

          <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 text-center">
            <p className="text-lg font-bold text-white">
              {prizePool.toFixed(1)}
            </p>
            <p className="text-xs text-gray-400">Prize Pool (CELO)</p>
          </div>

          <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 text-center">
            <p className="text-lg font-bold text-yellow-400">
              {creatorReward.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400">Your Reward (5%)</p>
          </div>
        </div>

        {/* Winner info */}
        <div className="p-3 bg-green-900/20 border border-green-800 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-green-300">Winner Prize</span>
            <span className="font-bold text-green-400">
              {winnerPrize.toFixed(2)} CELO
            </span>
          </div>
          <p className="text-xs text-green-500 mt-1">
            95% of prize pool goes to the winner
          </p>
        </div>

        {/* Game info */}
        <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-gray-400">Auto-close in:</span>
            <span className="text-white">{config.autoCloseTime} minutes</span>
          </div>
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-gray-400">Min to activate:</span>
            <span className="text-white">
              {Math.ceil(config.maxPlayers / 2)} players (50%)
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Game type:</span>
            <span className="text-white">Minority wins elimination</span>
          </div>
        </div>

        {config.description && (
          <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-sm font-medium text-gray-300 mb-1">
              Description
            </p>
            <p className="text-sm text-gray-400">{config.description}</p>
          </div>
        )}
      </div>
    </Card>
  );
};

interface CreatorStatsProps {
  creatorInfo?: {
    stakedAmount: bigint;
    poolsCreated: bigint;
    poolsRemaining: bigint;
    hasActiveStake: boolean;
    isVerified: boolean;
  };
  totalEarnings?: bigint;
  isLoading?: boolean;
}

const CreatorStats = ({
  creatorInfo,
  totalEarnings,
  isLoading,
}: CreatorStatsProps) => {
  if (isLoading) {
    return (
      <Card className="p-4 bg-gray-900 border-gray-800 mb-6">
        <h3 className="font-bold mb-3 text-white flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-400" />
          Creator Status
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center">
              <LoadingSpinner className="w-6 h-6 mx-auto mb-1 text-gray-400" />
              <p className="text-xs text-gray-500">Loading...</p>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const stakedAmount = creatorInfo?.stakedAmount
    ? formatEther(creatorInfo.stakedAmount)
    : "0";
  const poolsRemaining = creatorInfo?.poolsRemaining
    ? Number(creatorInfo.poolsRemaining)
    : 0;
  const poolsCreated = creatorInfo?.poolsCreated
    ? Number(creatorInfo.poolsCreated)
    : 0;
  const earnings = totalEarnings ? formatEther(totalEarnings) : "0";

  return (
    <Card className="p-4 bg-gray-900 border-gray-800 mb-6">
      <h3 className="font-bold mb-3 text-white flex items-center gap-2">
        <Crown className="w-5 h-5 text-yellow-400" />
        Creator Status
        {creatorInfo?.isVerified && (
          <div className="ml-auto flex items-center gap-1 text-xs bg-green-900/20 border border-green-800 px-2 py-1 rounded-lg">
            <CheckCircle2 className="w-3 h-3 text-green-400" />
            <span className="text-green-300">Verified</span>
          </div>
        )}
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-xl font-bold text-white">
            {parseFloat(stakedAmount).toFixed(1)}
          </p>
          <p className="text-xs text-gray-400">Staked CELO</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-white">{poolsRemaining}</p>
          <p className="text-xs text-gray-400">Pools Left</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-white">{poolsCreated}</p>
          <p className="text-xs text-gray-400">Created</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-white">
            {parseFloat(earnings).toFixed(4)}
          </p>
          <p className="text-xs text-gray-400">Earned CELO</p>
        </div>
      </div>
    </Card>
  );
};

const PopularConfigs = ({
  onSelect,
}: {
  onSelect: (config: PoolConfig) => void;
}) => {
  const presets = [
    {
      name: "Quick Game",
      description: "Fast-paced small group",
      config: {
        entryFee: 1,
        maxPlayers: 4,
        autoCloseTime: 5,
        description: "Quick 4-player game for fast action",
      },
    },
    {
      name: "Standard Pool",
      description: "Balanced risk/reward",
      config: {
        entryFee: 2.5,
        maxPlayers: 8,
        autoCloseTime: 10,
        description: "Standard 8-player pool with moderate entry fee",
      },
    },
    {
      name: "High Stakes",
      description: "Premium experience",
      config: {
        entryFee: 5,
        maxPlayers: 6,
        autoCloseTime: 15,
        description: "High-stakes game for experienced players",
      },
    },
  ];

  return (
    <Card className="p-6 bg-gray-900 border-gray-800">
      <h3 className="text-lg font-bold mb-4 text-white">
        Popular Configurations
      </h3>

      <div className="space-y-3">
        {presets.map((preset, index) => (
          <div
            key={index}
            className="p-4 border border-gray-700 rounded-lg hover:border-gray-600 hover:bg-gray-800 cursor-pointer transition-all"
            onClick={() => onSelect(preset.config)}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium text-white">{preset.name}</h4>
                <p className="text-sm text-gray-400">{preset.description}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-yellow-400">
                  {(
                    preset.config.entryFee *
                    preset.config.maxPlayers *
                    0.05
                  ).toFixed(2)}{" "}
                  CELO
                </p>
                <p className="text-xs text-gray-500">Your reward</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>{preset.config.entryFee} CELO entry</span>
              <span>{preset.config.maxPlayers} players</span>
              <span>{preset.config.autoCloseTime}m close</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// Pool Configuration Modal Component
const PoolConfigModal = ({
  isOpen,
  onClose,
  onSubmit,
  isCreating,
  isConfirming,
  createError,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: PoolConfig) => void;
  isCreating: boolean;
  isConfirming: boolean;
  createError: any;
}) => {
  const [config, setConfig] = useState<PoolConfig>({
    entryFee: 2.5,
    maxPlayers: 8,
    autoCloseTime: 10,
    description: "",
  });

  const handleConfigChange = (
    key: keyof PoolConfig,
    value: number | string
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(config);
  };

  const prizePool = config.entryFee * config.maxPlayers;
  const creatorReward = prizePool * 0.05;
  const winnerPrize = prizePool * 0.95;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-white">
              Configure Your Pool
            </h2>
            <p className="text-sm text-gray-400">Set up your game parameters</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isCreating || isConfirming}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration Form */}
            <div className="space-y-6">
              {/* Entry fee */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Entry Fee (CELO)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={config.entryFee || ""}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      handleConfigChange("entryFee", isNaN(value) ? 0 : value);
                    }}
                    className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2.5"
                    required
                  />
                  <Coins className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Higher entry fees attract more serious players
                </p>
              </div>

              {/* Max players */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Maximum Players
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="2"
                    max="20"
                    step="1"
                    value={config.maxPlayers || ""}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      handleConfigChange(
                        "maxPlayers",
                        isNaN(value) ? 2 : value
                      );
                    }}
                    className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="8"
                    required
                  />
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Pool activates at 50% capacity
                </p>
              </div>

              {/* Auto-close timer */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Auto-close Timer (minutes)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    step="1"
                    value={config.autoCloseTime}
                    onChange={(e) =>
                      handleConfigChange(
                        "autoCloseTime",
                        parseInt(e.target.value) || 1
                      )
                    }
                    className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10"
                  />
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Auto-close if not enough players join
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Pool Description (Optional)
                </label>
                <textarea
                  value={config.description}
                  onChange={(e) =>
                    handleConfigChange("description", e.target.value)
                  }
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Add a description to attract players..."
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {config.description.length}/200 characters
                </p>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Pool Preview</h3>

              {/* Pool stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 text-center">
                  <p className="text-lg font-bold text-white">
                    {config.entryFee}
                  </p>
                  <p className="text-xs text-gray-400">Entry Fee</p>
                </div>

                <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 text-center">
                  <p className="text-lg font-bold text-white">
                    {config.maxPlayers}
                  </p>
                  <p className="text-xs text-gray-400">Max Players</p>
                </div>

                <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 text-center">
                  <p className="text-lg font-bold text-white">
                    {prizePool.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-400">Prize Pool</p>
                </div>

                <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 text-center">
                  <p className="text-lg font-bold text-yellow-400">
                    {creatorReward.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">Your Reward</p>
                </div>
              </div>

              {/* Winner info */}
              <div className="p-3 bg-green-900/20 border border-green-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-300">Winner Prize</span>
                  <span className="font-bold text-green-400">
                    {winnerPrize.toFixed(2)} CELO
                  </span>
                </div>
                <p className="text-xs text-green-500 mt-1">95% of prize pool</p>
              </div>

              {/* Game rules */}
              <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                <p className="font-medium text-blue-300 mb-2 text-sm">
                  Game Rules
                </p>
                <ul className="text-xs text-blue-400 space-y-1">
                  <li>• Players choose HEADS or TAILS each round</li>
                  <li>• Minority choice wins, majority eliminated</li>
                  <li>• Last player wins 95% of prize pool</li>
                  <li>• You earn 5% creator fee</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {createError && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-sm text-red-300">
                {createError.message ||
                  "Failed to create pool. Please try again."}
              </p>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isCreating || isConfirming}
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isCreating ||
                isConfirming ||
                !config.entryFee ||
                config.maxPlayers < 2
              }
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCreating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : isConfirming ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Create Pool & Go Live
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function CreatePoolPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Wallet and contract hooks
  const { address, isConnected, isConnecting } = useAccount();

  const {
    data: creatorInfo,
    isLoading: isLoadingCreator,
    error: creatorError,
    refetch: refetchCreator,
  } = useCreatorInfo(address);

  const { data: totalEarnings, isLoading: isLoadingEarnings } =
    useCreatorReward(address);

  const {
    createPool,
    isPending: isCreating,
    isConfirming,
    isConfirmed,
    error: createError,
    hash,
  } = useCreatePool();

  const { toast } = useToast();

  // Handle successful pool creation
  useEffect(() => {
    if (isConfirmed && hash) {
      setShowModal(false);
      setShowSuccess(true);
      toast({
        title: "Pool created successfully!",
        description: "Your game pool is now live and ready for players.",
        type: "success",
      });

      // Refresh creator data
      refetchCreator();

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    }
  }, [isConfirmed, hash, toast, refetchCreator, router]);

  // Handle creation errors
  useEffect(() => {
    if (createError) {
      toast({
        title: "Pool creation failed",
        description:
          createError.message || "Failed to create pool. Please try again.",
        type: "error",
      });
    }
  }, [createError, toast]);

  // Access control - must be connected
  if (!isConnected && !isConnecting) {
    return <WalletConnectionRequired />;
  }

  // Loading state
  if (isConnecting || isLoadingCreator) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <Card className="p-8 text-center bg-gray-900 border-gray-800">
          <LoadingSpinner className="w-12 h-12 mx-auto mb-4 text-blue-400" />
          <p className="text-gray-400">Loading your creator data...</p>
        </Card>
      </div>
    );
  }

  // Error state
  if (creatorError) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md mx-4">
          <ErrorBanner
            message={creatorError.message || "Failed to load creator data"}
            onRetry={refetchCreator}
          />
        </div>
      </div>
    );
  }

  // Check if user has active stake
  if (!creatorInfo?.hasActiveStake) {
    return <StakingRequired />;
  }

  const poolsRemaining = Number(creatorInfo.poolsRemaining);

  const handleCreatePool = (config: PoolConfig) => {
    if (poolsRemaining <= 0 || !address) return;

    // Validate inputs before calling
    if (
      !config.entryFee ||
      config.entryFee <= 0 ||
      !config.maxPlayers ||
      config.maxPlayers < 2
    ) {
      toast({
        title: "Invalid pool configuration",
        description: "Please check your entry fee and max players settings.",
        type: "error",
      });
      return;
    }

    try {
      createPool({
        entryFee: config.entryFee.toString(),
        maxPlayers: config.maxPlayers,
      });
    } catch (err) {
      console.error("Pool creation error:", err);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md bg-gray-900 border-gray-800">
          <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-green-400 mb-2">
            Pool Created!
          </h2>
          <p className="text-gray-400 mb-4">
            Your game pool is now live and ready for players to join.
          </p>
          {hash && (
            <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 mb-4">
              <p className="text-xs text-gray-400 mb-1">Transaction Hash:</p>
              <p className="text-xs font-mono text-gray-300 break-all">
                {hash.slice(0, 10)}...{hash.slice(-8)}
              </p>
            </div>
          )}
          <div className="animate-pulse text-blue-400">
            Redirecting to dashboard...
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="p-2 border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Create New Pool</h1>
            <p className="text-gray-400">Launch a new CoinToss game pool</p>
          </div>
        </div>

        {/* Creator status */}
        <CreatorStats
          creatorInfo={creatorInfo}
          totalEarnings={totalEarnings}
          isLoading={isLoadingCreator || isLoadingEarnings}
        />

        {/* No pools remaining warning */}
        {poolsRemaining <= 0 && (
          <Card className="p-4 mb-6 bg-red-900/20 border-red-800">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <div>
                <p className="font-medium text-red-300">
                  No pool creations remaining
                </p>
                <p className="text-sm text-red-400">
                  You've used all your pool creation slots. Complete your
                  existing pools or stake more CELO to create new ones.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Popular presets */}
          <PopularConfigs
            onSelect={(config) => {
              setShowModal(true);
            }}
          />

          {/* Create Pool Action */}
          <Card className="p-6 bg-gray-900 border-gray-800">
            <h3 className="text-lg font-bold mb-4 text-white">
              Ready to Create?
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">
                    Pools remaining:
                  </span>
                  <span className="font-bold text-lg text-white">
                    {poolsRemaining}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                    Creator earnings:
                  </span>
                  <span className="font-bold text-yellow-400">
                    {totalEarnings
                      ? formatEther(totalEarnings).slice(0, 6)
                      : "0"}{" "}
                    CELO
                  </span>
                </div>
              </div>

              <Button
                onClick={() => setShowModal(true)}
                disabled={poolsRemaining <= 0}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                <Zap className="w-5 h-5 mr-2" />
                Create Pool & Go Live
              </Button>

              <p className="text-xs text-center text-gray-500">
                Configure your pool settings and launch instantly
              </p>
            </div>
          </Card>
        </div>

        {/* Pool Configuration Modal */}
        <PoolConfigModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleCreatePool}
          isCreating={isCreating}
          isConfirming={isConfirming}
          createError={createError}
        />
      </div>
    </div>
  );
}
