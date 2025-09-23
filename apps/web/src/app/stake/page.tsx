"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useBalance } from "wagmi";
import { formatEther } from "viem";
import {
  Coins,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
  Info,
  DollarSign,
  Target,
  Crown,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useCreatorInfo,
  useStakeForPoolCreation,
  useCalculatePoolsEligible,
  useCreatorReward,
  useVerificationInfo,
} from "@/hooks";
import { useToast } from "@/hooks/use-toast";
import {
  VerificationStatus,
  VerificationBonusDisplay,
} from "@/components/verification-status";

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

// Wallet connection component
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
        You need to connect your wallet to stake CELO and create game pools.
      </p>
      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
        Connect Wallet
      </Button>
    </Card>
  </div>
);

const StakeCalculator = ({
  stakeAmount,
  onStakeChange,
  address,
}: {
  stakeAmount: number;
  onStakeChange: (amount: number) => void;
  address?: `0x${string}`;
}) => {
  const baseStake = 5; // 5 CELO minimum
  const maxStake = 50; // 50 CELO maximum

  // Use real contract data for pool calculation
  const { data: poolsEligible, isLoading: isCalculating } =
    useCalculatePoolsEligible(stakeAmount.toString(), address);

  // Get verification info for this component
  const { data: verificationInfo } = useVerificationInfo(address);

  const poolsEligibleNumber = poolsEligible
    ? Number(poolsEligible)
    : Math.floor(stakeAmount / baseStake);
  const potentialEarnings = poolsEligibleNumber * 2.5 * 0.05; // Assuming avg 2.5 CELO entry fee, 5% creator reward

  const presetAmounts = [5, 10, 25, 50];

  return (
    <Card className="p-6 bg-gray-900 border-gray-800">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
        <Calculator className="w-5 h-5 text-blue-400" />
        Staking Calculator
      </h3>

      {/* Stake amount slider */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-medium text-gray-300">
            Stake Amount
          </label>
          <div className="text-right">
            <span className="text-2xl font-bold text-blue-400">
              {stakeAmount} CELO
            </span>
            <p className="text-xs text-gray-500">
              Min: {baseStake} • Max: {maxStake}
            </p>
          </div>
        </div>

        <input
          type="range"
          min={baseStake}
          max={maxStake}
          step={0.5}
          value={stakeAmount}
          onChange={(e) => onStakeChange(parseFloat(e.target.value))}
          className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${
              ((stakeAmount - baseStake) / (maxStake - baseStake)) * 100
            }%, #374151 ${
              ((stakeAmount - baseStake) / (maxStake - baseStake)) * 100
            }%, #374151 100%)`,
          }}
        />

        {/* Preset amounts */}
        <div className="flex gap-2 mt-3">
          {presetAmounts.map((amount) => (
            <Button
              key={amount}
              variant={stakeAmount === amount ? "default" : "outline"}
              size="sm"
              onClick={() => onStakeChange(amount)}
              className={`flex-1 ${
                stakeAmount === amount
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "border-gray-600 text-gray-300 hover:bg-gray-800"
              }`}
            >
              {amount} CELO
            </Button>
          ))}
        </div>
      </div>

      {/* Calculations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="p-4 bg-blue-900/20 rounded-lg text-center border border-blue-800">
          <div className="flex items-center justify-center gap-1 mb-2">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">
              Pools Eligible
            </span>
          </div>
          {isCalculating ? (
            <div className="flex justify-center mb-2">
              <LoadingSpinner className="w-6 h-6 text-blue-400" />
            </div>
          ) : (
            <div>
              <p className="text-2xl font-bold text-blue-400">
                {poolsEligibleNumber}
              </p>
              {verificationInfo?.isVerified &&
                verificationInfo.bonusPools > 0 && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Crown className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs font-medium text-yellow-400">
                      +{verificationInfo.bonusPools} bonus
                    </span>
                  </div>
                )}
            </div>
          )}
          <p className="text-xs text-blue-400">
            Create up to {poolsEligibleNumber} game
            {poolsEligibleNumber !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="p-4 bg-green-900/20 rounded-lg text-center border border-green-800">
          <div className="flex items-center justify-center gap-1 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-300">
              Potential Earnings
            </span>
          </div>
          <p className="text-2xl font-bold text-green-400">
            {potentialEarnings.toFixed(2)} CELO
          </p>
          <p className="text-xs text-green-400">5% of prize pools</p>
        </div>

        <div className="p-4 bg-purple-900/20 rounded-lg text-center border border-purple-800">
          <div className="flex items-center justify-center gap-1 mb-2">
            <DollarSign className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">
              ROI Potential
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-400">
            {((potentialEarnings / stakeAmount) * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-purple-400">If all pools complete</p>
        </div>
      </div>

      {/* Verification Status */}
      <div className="mb-4">
        <VerificationBonusDisplay address={address} />
        {!verificationInfo?.isVerified && (
          <div className="mt-3">
            <VerificationStatus
              address={address}
              showActions={true}
              size="md"
            />
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <h4 className="font-medium text-gray-200 mb-2">How Staking Works:</h4>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Every 5 CELO staked = 1 pool creation right</li>
          {verificationInfo?.isVerified && (
            <li className="text-green-400 font-medium">
              • Verified users get +{verificationInfo.bonusPools} bonus pool per
              stake
            </li>
          )}
          <li>• Earn 5% of each completed pool's prize</li>
          <li>• Stake remains locked until all pools complete</li>
          <li>• 30% penalty for early withdrawal</li>
        </ul>
      </div>
    </Card>
  );
};

const RiskWarnings = () => {
  return (
    <Card className="p-6 border-orange-800 bg-orange-900/20">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-orange-300">
        <AlertTriangle className="w-5 h-5" />
        Important Risks & Terms
      </h3>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-sm font-bold">!</span>
          </div>
          <div>
            <p className="font-medium text-orange-200 mb-1">
              Early Withdrawal Penalty
            </p>
            <p className="text-sm text-orange-300">
              If you unstake before all your pools complete, you'll lose 30% of
              your stake. Only stake what you can afford to lock up.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-yellow-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-sm font-bold">⏱</span>
          </div>
          <div>
            <p className="font-medium text-orange-200 mb-1">
              Stake Lock Period
            </p>
            <p className="text-sm text-orange-300">
              Your stake remains locked until ALL your created pools finish.
              This could take hours to days depending on player participation.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-sm font-bold">$</span>
          </div>
          <div>
            <p className="font-medium text-orange-200 mb-1">
              Earnings Not Guaranteed
            </p>
            <p className="text-sm text-orange-300">
              You only earn rewards if your pools complete with players. If
              pools are abandoned due to low participation, no rewards are
              earned.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

const StakingBenefits = () => {
  return (
    <Card className="p-6 border-green-800 bg-green-900/20">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-green-300">
        <Crown className="w-5 h-5" />
        Creator Benefits
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <Coins className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-medium text-green-200">Earn Creator Fees</p>
            <p className="text-sm text-green-300">
              Get 5% of every completed pool's prize
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-medium text-green-200">Control Game Settings</p>
            <p className="text-sm text-green-300">
              Set entry fees and player limits
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-medium text-green-200">Build Reputation</p>
            <p className="text-sm text-green-300">
              Gain recognition as a successful creator
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-medium text-green-200">Scale Earnings</p>
            <p className="text-sm text-green-300">
              More pools = more earning potential
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default function StakePage() {
  const router = useRouter();
  const [stakeAmount, setStakeAmount] = useState(10);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Wallet and contract hooks
  const { address, isConnected, isConnecting } = useAccount();
  const {
    data: balance,
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
  } = useBalance({
    address,
    query: {
      enabled: !!address,
    },
  });

  const {
    data: creatorInfo,
    isLoading: isLoadingCreator,
    error: creatorError,
    refetch: refetchCreator,
  } = useCreatorInfo(address);

  const { data: creatorReward, isLoading: isLoadingReward } =
    useCreatorReward(address);

  const { data: verificationInfo } = useVerificationInfo(address);

  const {
    stake,
    isPending: isStaking,
    isConfirming,
    isConfirmed,
    error: stakeError,
    hash,
  } = useStakeForPoolCreation();

  const { success, error } = useToast();

  // Handle successful staking
  useEffect(() => {
    if (isConfirmed && hash) {
      setShowSuccess(true);
      success("Staking successful!", "Your CELO has been staked successfully.");

      // Refresh data after successful transaction
      refetchCreator();
      refetchBalance();

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        router.push("/create-pool");
      }, 3000);
    }
  }, [isConfirmed, hash, success, refetchCreator, refetchBalance, router]);

  // Handle staking errors
  useEffect(() => {
    if (stakeError) {
      error(
        "Staking failed",
        stakeError.message || "Failed to stake CELO. Please try again."
      );
    }
  }, [stakeError, error]);

  // Access control - must be connected
  if (!isConnected && !isConnecting) {
    return <WalletConnectionRequired />;
  }

  // Loading state
  if (isConnecting || isLoadingBalance || isLoadingCreator) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <Card className="p-8 text-center bg-gray-900 border-gray-800">
          <LoadingSpinner className="w-12 h-12 mx-auto mb-4 text-blue-400" />
          <p className="text-gray-400">Loading your wallet data...</p>
        </Card>
      </div>
    );
  }

  // Error state
  if (creatorError) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md">
          <ErrorBanner
            message={creatorError.message || "Failed to load creator data"}
            onRetry={refetchCreator}
          />
        </div>
      </div>
    );
  }

  const celoBalance = balance ? formatEther(balance.value) : "0";
  const hasActiveStake = creatorInfo?.hasActiveStake || false;
  const stakedAmount = creatorInfo?.stakedAmount
    ? formatEther(creatorInfo.stakedAmount)
    : "0";
  const poolsRemaining = creatorInfo?.poolsRemaining
    ? Number(creatorInfo.poolsRemaining)
    : 0;
  const totalEarnings = creatorReward ? formatEther(creatorReward) : "0";

  const canStake =
    parseFloat(celoBalance) >= stakeAmount && !hasActiveStake && !!address;

  const handleStake = () => {
    if (!canStake || !agreedToTerms || !address) return;

    try {
      stake(stakeAmount.toString());
    } catch (err) {
      console.error("Staking error:", err);
      // Error is handled by useEffect above
    }
  };

  if (showSuccess) {
    const poolsEligible = creatorInfo ? Number(creatorInfo.poolsRemaining) : 0;
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md bg-gray-900 border-gray-800">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-green-400 mb-2">
            Staking Successful!
          </h2>
          <p className="text-gray-400 mb-4">
            You've staked {stakeAmount} CELO and can now create {poolsEligible}{" "}
            game pool{poolsEligible !== 1 ? "s" : ""}.
          </p>
          {hash && (
            <div className="p-3 bg-gray-800 rounded-lg mb-4 border border-gray-700">
              <p className="text-xs text-gray-400 mb-1">Transaction Hash:</p>
              <p className="text-xs font-mono text-gray-300 break-all">
                {hash.slice(0, 10)}...{hash.slice(-8)}
              </p>
            </div>
          )}
          <div className="animate-pulse text-blue-400">
            Redirecting to pool creation...
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Stake to Create
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Stake CELO to become a pool creator and earn rewards from every game
            you host. The more you stake, the more pools you can create.
          </p>
        </div>

        {/* User status */}
        <Card className="p-4 mb-6 bg-blue-600 text-white border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Your CELO Balance</p>
              {isLoadingBalance ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner className="w-4 h-4" />
                  <span>Loading...</span>
                </div>
              ) : (
                <p className="text-2xl font-bold">
                  {parseFloat(celoBalance).toFixed(2)} CELO
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Current Status</p>
              <p className="text-lg font-medium">
                {hasActiveStake
                  ? `Staked: ${parseFloat(stakedAmount).toFixed(2)} CELO`
                  : "Not Staking"}
              </p>
              {hasActiveStake && (
                <p className="text-xs opacity-80">
                  {poolsRemaining} pool{poolsRemaining !== 1 ? "s" : ""}{" "}
                  remaining
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Already staking warning */}
        {hasActiveStake && (
          <Card className="p-4 mb-6 bg-yellow-900/20 border-yellow-800">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="font-medium text-yellow-300">
                  You already have an active stake
                </p>
                <p className="text-sm text-yellow-400">
                  You have {poolsRemaining} pool creation
                  {poolsRemaining !== 1 ? "s" : ""} remaining. Wait for your
                  current pools to complete before staking again.
                </p>
                {isLoadingReward ? (
                  <div className="flex items-center gap-1 mt-1">
                    <LoadingSpinner className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-yellow-400">
                      Loading earnings...
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-yellow-400 mt-1">
                    Current earnings: {parseFloat(totalEarnings).toFixed(4)}{" "}
                    CELO
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Staking calculator */}
          <StakeCalculator
            stakeAmount={stakeAmount}
            onStakeChange={setStakeAmount}
            address={address}
          />

          {/* Benefits */}
          <StakingBenefits />
        </div>

        {/* Risk warnings */}
        <div className="mb-6">
          <RiskWarnings />
        </div>

        {/* Terms agreement and stake button */}
        <Card className="p-6 bg-gray-900 border-gray-800">
          <div className="space-y-4">
            {/* Terms checkbox */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="terms" className="text-sm text-gray-300">
                I understand the risks and agree to the terms:
                <ul className="mt-2 ml-4 space-y-1 text-xs text-gray-400">
                  <li>
                    • My stake will be locked until all created pools complete
                  </li>
                  <li>• Early withdrawal incurs a 30% penalty</li>
                  <li>
                    • Creator rewards are only earned from completed pools
                  </li>
                  <li>
                    • I am responsible for creating engaging pools that attract
                    players
                  </li>
                </ul>
              </label>
            </div>

            {/* Insufficient balance warning */}
            {parseFloat(celoBalance) < stakeAmount && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
                <p className="text-sm text-red-300">
                  Insufficient balance. You need {stakeAmount} CELO but only
                  have {parseFloat(celoBalance).toFixed(2)} CELO.
                </p>
              </div>
            )}

            {/* Transaction error */}
            {stakeError && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
                <p className="text-sm text-red-300">
                  {stakeError.message ||
                    "Transaction failed. Please try again."}
                </p>
              </div>
            )}

            {/* Stake button */}
            <Button
              onClick={handleStake}
              disabled={
                !canStake || !agreedToTerms || isStaking || isConfirming
              }
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-4 disabled:opacity-50"
              size="lg"
            >
              {isStaking ? (
                <>
                  <LoadingSpinner className="w-5 h-5 mr-2" />
                  Sending Transaction...
                </>
              ) : isConfirming ? (
                <>
                  <LoadingSpinner className="w-5 h-5 mr-2" />
                  Confirming on Blockchain...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Stake {stakeAmount} CELO & Create Pools
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            <p className="text-center text-xs text-gray-500">
              After staking, you'll be able to create pools and start earning
              creator rewards.
              {isStaking || isConfirming
                ? " Please wait for the transaction to complete."
                : ""}
            </p>

            {/* Transaction hash display during confirmation */}
            {hash && isConfirming && (
              <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                <p className="text-xs text-blue-300 mb-1">
                  Transaction submitted:
                </p>
                <p className="text-xs font-mono text-blue-400 break-all">
                  {hash.slice(0, 10)}...{hash.slice(-8)}
                </p>
                <p className="text-xs text-blue-400 mt-1">
                  Waiting for confirmation...
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
