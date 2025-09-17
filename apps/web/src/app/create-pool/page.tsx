"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import {
  Coins,
  Users,
  Settings,
  Eye,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Clock,
  Target,
  Zap,
  ArrowLeft,
  Info,
  Calculator,
  Crown,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useCreatorInfo,
  useCreatePool,
  useCreatorReward
} from "@/hooks";
import { useToast } from "@/hooks/use-toast";

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
        You need to connect your wallet to create game pools.
      </p>
      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
        Connect Wallet
      </Button>
    </Card>
  </div>
);

const StakingRequired = () => (
  <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
    <Card className="p-8 text-center max-w-md mx-4">
      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Crown className="w-8 h-8 text-purple-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Staking Required</h2>
      <p className="text-gray-600 mb-6">
        You need to stake CELO first to become a pool creator and start creating games.
      </p>
      <Button
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
        onClick={() => window.location.href = '/stake'}
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
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-800">
        <Eye className="w-5 h-5" />
        Pool Preview
      </h3>
      
      <div className="space-y-4">
        {/* Pool stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-white/60 rounded-lg text-center">
            <p className="text-xl font-bold text-blue-600">{config.entryFee} CELO</p>
            <p className="text-xs text-blue-800">Entry Fee</p>
          </div>
          
          <div className="p-3 bg-white/60 rounded-lg text-center">
            <p className="text-xl font-bold text-purple-600">{config.maxPlayers}</p>
            <p className="text-xs text-purple-800">Max Players</p>
          </div>
          
          <div className="p-3 bg-white/60 rounded-lg text-center">
            <p className="text-xl font-bold text-green-600">{prizePool.toFixed(1)} CELO</p>
            <p className="text-xs text-green-800">Total Prize Pool</p>
          </div>
          
          <div className="p-3 bg-white/60 rounded-lg text-center">
            <p className="text-xl font-bold text-yellow-600">{creatorReward.toFixed(2)} CELO</p>
            <p className="text-xs text-yellow-800">Your Reward (5%)</p>
          </div>
        </div>

        {/* Winner info */}
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-800 mb-1">Winner Prize</p>
          <p className="text-lg font-bold text-green-600">{winnerPrize.toFixed(2)} CELO</p>
          <p className="text-xs text-green-700">95% of prize pool goes to the winner</p>
        </div>

        {/* Game info */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-gray-600">Auto-close in:</span>
            <span className="font-medium">{config.autoCloseTime} minutes</span>
          </div>
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-gray-600">Min to activate:</span>
            <span className="font-medium">{Math.ceil(config.maxPlayers / 2)} players (50%)</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Game type:</span>
            <span className="font-medium">Minority wins elimination</span>
          </div>
        </div>

        {config.description && (
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-sm font-medium text-purple-800 mb-1">Description</p>
            <p className="text-sm text-purple-700">{config.description}</p>
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

const CreatorStats = ({ creatorInfo, totalEarnings, isLoading }: CreatorStatsProps) => {
  if (isLoading) {
    return (
      <Card className="p-4 bg-gradient-to-r from-purple-500 to-blue-600 text-white mb-6">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Crown className="w-5 h-5" />
          Creator Status
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center">
              <LoadingSpinner className="w-6 h-6 mx-auto mb-1" />
              <p className="text-xs opacity-90">Loading...</p>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const stakedAmount = creatorInfo ? formatEther(creatorInfo.stakedAmount) : "0";
  const poolsRemaining = creatorInfo ? Number(creatorInfo.poolsRemaining) : 0;
  const poolsCreated = creatorInfo ? Number(creatorInfo.poolsCreated) : 0;
  const earnings = totalEarnings ? formatEther(totalEarnings) : "0";

  return (
    <Card className="p-4 bg-gradient-to-r from-purple-500 to-blue-600 text-white mb-6">
      <h3 className="font-bold mb-3 flex items-center gap-2">
        <Crown className="w-5 h-5" />
        Creator Status
        {creatorInfo?.isVerified && (
          <div className="ml-auto flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Verified
          </div>
        )}
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-xl font-bold">{parseFloat(stakedAmount).toFixed(1)} CELO</p>
          <p className="text-xs opacity-90">Staked</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold">{poolsRemaining}</p>
          <p className="text-xs opacity-90">Pools Left</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold">{poolsCreated}</p>
          <p className="text-xs opacity-90">Created</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold">{parseFloat(earnings).toFixed(4)} CELO</p>
          <p className="text-xs opacity-90">Earned</p>
        </div>
      </div>
    </Card>
  );
};

const PopularConfigs = ({ onSelect }: { onSelect: (config: PoolConfig) => void }) => {
  const presets = [
    {
      name: "Quick Game",
      description: "Fast-paced small group",
      config: { entryFee: 1, maxPlayers: 4, autoCloseTime: 5, description: "Quick 4-player game for fast action" }
    },
    {
      name: "Standard Pool",
      description: "Balanced risk/reward",
      config: { entryFee: 2.5, maxPlayers: 8, autoCloseTime: 10, description: "Standard 8-player pool with moderate entry fee" }
    },
    {
      name: "High Stakes",
      description: "Premium experience",
      config: { entryFee: 5, maxPlayers: 6, autoCloseTime: 15, description: "High-stakes game for experienced players" }
    }
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-green-600" />
        Popular Configurations
      </h3>
      
      <div className="space-y-3">
        {presets.map((preset, index) => (
          <div
            key={index}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
            onClick={() => onSelect(preset.config)}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium text-gray-900">{preset.name}</h4>
                <p className="text-sm text-gray-600">{preset.description}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">
                  {(preset.config.entryFee * preset.config.maxPlayers * 0.05).toFixed(2)} CELO
                </p>
                <p className="text-xs text-gray-500">Your reward</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>💰 {preset.config.entryFee} CELO entry</span>
              <span>👥 {preset.config.maxPlayers} players</span>
              <span>⏱️ {preset.config.autoCloseTime}m close</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default function CreatePoolPage() {
  const router = useRouter();
  const [config, setConfig] = useState<PoolConfig>({
    entryFee: 2.5,
    maxPlayers: 8,
    autoCloseTime: 10,
    description: ""
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [newPoolId, setNewPoolId] = useState<number | null>(null);

  // Wallet and contract hooks
  const { address, isConnected, isConnecting } = useAccount();

  const {
    data: creatorInfo,
    isLoading: isLoadingCreator,
    error: creatorError,
    refetch: refetchCreator
  } = useCreatorInfo(address);

  const {
    data: totalEarnings,
    isLoading: isLoadingEarnings
  } = useCreatorReward(address);

  const {
    createPool,
    isPending: isCreating,
    isConfirming,
    isConfirmed,
    error: createError,
    hash,
    data: txData
  } = useCreatePool();

  const { success, error } = useToast();

  // Handle successful pool creation
  useEffect(() => {
    if (isConfirmed && hash && txData) {
      // Extract pool ID from transaction logs if available
      // For now, we'll use a placeholder and let the user navigate manually
      setShowSuccess(true);
      success("Pool created successfully!", "Your game pool is now live and ready for players.");

      // Refresh creator data
      refetchCreator();

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        router.push('/pools'); // Redirect to pools page to find the new pool
      }, 3000);
    }
  }, [isConfirmed, hash, txData, success, refetchCreator, router]);

  // Handle creation errors
  useEffect(() => {
    if (createError) {
      error("Pool creation failed", createError.message || "Failed to create pool. Please try again.");
    }
  }, [createError, error]);

  // Access control - must be connected
  if (!isConnected && !isConnecting) {
    return <WalletConnectionRequired />;
  }

  // Loading state
  if (isConnecting || isLoadingCreator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <LoadingSpinner className="w-12 h-12 mx-auto mb-4" />
          <p className="text-gray-600">Loading your creator data...</p>
        </Card>
      </div>
    );
  }

  // Error state
  if (creatorError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
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

  const handleConfigChange = (key: keyof PoolConfig, value: number | string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handlePresetSelect = (presetConfig: PoolConfig) => {
    setConfig(presetConfig);
  };

  const handleCreatePool = () => {
    if (poolsRemaining <= 0 || !address) return;

    try {
      createPool(config.entryFee.toString(), config.maxPlayers.toString());
    } catch (err) {
      console.error("Pool creation error:", err);
      // Error is handled by useEffect above
    }
  };

  const prizePool = config.entryFee * config.maxPlayers;
  const creatorReward = prizePool * 0.05;
  const canCreate = poolsRemaining > 0 && config.entryFee > 0 && config.maxPlayers >= 2 && !!address;

  if (showSuccess && newPoolId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">Pool Created!</h2>
          <p className="text-gray-600 mb-4">
            Your pool #{newPoolId} is now live and ready for players to join.
          </p>
          <div className="p-4 bg-green-50 rounded-lg mb-4">
            <p className="text-sm text-green-800 mb-2">Pool Details:</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Entry Fee:</span>
                <span className="font-medium">{config.entryFee} CELO</span>
              </div>
              <div className="flex justify-between">
                <span>Max Players:</span>
                <span className="font-medium">{config.maxPlayers}</span>
              </div>
              <div className="flex justify-between">
                <span>Your Reward:</span>
                <span className="font-medium text-green-600">{creatorReward.toFixed(2)} CELO</span>
              </div>
            </div>
          </div>
          <div className="animate-pulse text-blue-600">
            Redirecting to your pool...
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Pool</h1>
            <p className="text-gray-600">Configure your game settings and launch a new CoinToss pool</p>
          </div>
        </div>

        {/* Creator status */}
        <CreatorStats creator={creator} />

        {/* No pools remaining warning */}
        {creator.poolsRemaining <= 0 && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">No pool creations remaining</p>
                <p className="text-sm text-red-700">
                  You've used all your pool creation slots. Complete your existing pools or stake more CELO to create new ones.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Form */}
          <div className="space-y-6">
            {/* Popular presets */}
            <PopularConfigs onSelect={handlePresetSelect} />

            {/* Custom configuration */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                Custom Configuration
              </h3>
              
              <div className="space-y-6">
                {/* Entry fee */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entry Fee (CELO)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0.1"
                      max="100"
                      step="0.1"
                      value={config.entryFee}
                      onChange={(e) => handleConfigChange('entryFee', parseFloat(e.target.value) || 0)}
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="2.5"
                    />
                    <Coins className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Higher entry fees attract more serious players but may limit participation
                  </p>
                </div>

                {/* Max players */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Players
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="2"
                      max="20"
                      step="1"
                      value={config.maxPlayers}
                      onChange={(e) => handleConfigChange('maxPlayers', parseInt(e.target.value) || 2)}
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="8"
                    />
                    <Users className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    More players = bigger prizes but longer games. Pool activates at 50% capacity.
                  </p>
                </div>

                {/* Auto-close timer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto-close Timer (minutes)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="60"
                      step="1"
                      value={config.autoCloseTime}
                      onChange={(e) => handleConfigChange('autoCloseTime', parseInt(e.target.value) || 1)}
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="10"
                    />
                    <Clock className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Pool will close automatically if not enough players join within this time
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pool Description (Optional)
                  </label>
                  <textarea
                    value={config.description}
                    onChange={(e) => handleConfigChange('description', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Add a description to attract players..."
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {config.description.length}/200 characters
                  </p>
                </div>
              </div>
            </Card>

            {/* Game rules reminder */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 mb-2">Game Rules Reminder</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Players choose HEADS or TAILS each round</li>
                    <li>• Minority choice wins, majority eliminated</li>
                    <li>• Last player standing wins 95% of prize pool</li>
                    <li>• You earn 5% creator fee when pool completes</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          {/* Preview & Create */}
          <div className="space-y-6">
            <PoolPreview config={config} />

            {/* Create button */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pools remaining:</span>
                  <span className="font-bold text-lg">{creator.poolsRemaining}</span>
                </div>

                <Button
                  onClick={handleCreatePool}
                  disabled={!canCreate || isCreating}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg py-4"
                  size="lg"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Pool...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Create Pool & Go Live
                    </>
                  )}
                </Button>

                {!canCreate && creator.poolsRemaining > 0 && (
                  <p className="text-sm text-red-600 text-center">
                    Please check your entry fee (minimum 0.1 CELO) and max players (minimum 2)
                  </p>
                )}

                <p className="text-xs text-center text-gray-500">
                  Your pool will be immediately available for players to join. 
                  You'll earn {creatorReward.toFixed(2)} CELO when it completes.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}