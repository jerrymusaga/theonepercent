"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Home,
  Shield,
  Star,
  Zap,
  Lock,
  Globe,
  Users,
  TrendingUp,
  Sparkles,
  Eye,
  UserCheck,
  Crown,
  Gem,
  Coins,
  GamepadIcon,
  Trophy,
} from "lucide-react";
import { useAccount } from "wagmi";
import { SelfAppBuilder, SelfApp } from "@selfxyz/qrcode";
import SelfQRcodeWrapper from "@selfxyz/qrcode";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface VerificationResult {
  isValid: boolean;
  credentialSubject?: {
    isOver18: boolean;
    nationality: string;
    name?: string[];
    attestationId?: string;
  };
  error?: string;
}

// Gaming-specific benefits for verified players
const gamingBenefits = [
  {
    icon: Coins,
    title: "Bonus Pool Creation",
    description: "Get +1 extra pool for every stake when you're verified",
    color: "from-yellow-400 to-orange-500",
    highlight: true,
  },
  {
    icon: Shield,
    title: "Verified Player Badge",
    description: "Build trust with other players with your verified status",
    color: "from-blue-400 to-blue-600",
  },
  {
    icon: GamepadIcon,
    title: "Premium Gaming Rooms",
    description: "Access exclusive verified-only gaming pools",
    color: "from-purple-400 to-purple-600",
  },
  {
    icon: TrendingUp,
    title: "Higher Success Rates",
    description: "Verified players have better pool completion rates",
    color: "from-emerald-400 to-emerald-600",
  },
  {
    icon: Trophy,
    title: "Leaderboard Priority",
    description: "Get featured placement on gaming leaderboards",
    color: "from-amber-400 to-orange-500",
  },
  {
    icon: Zap,
    title: "Instant Pool Approval",
    description: "Skip manual reviews with automated verified status",
    color: "from-cyan-400 to-cyan-600",
  },
];

const securityFeatures = [
  {
    icon: UserCheck,
    title: "Age Verification",
    description: "Automated 18+ verification for legal gaming",
  },
  {
    icon: Globe,
    title: "Geographic Compliance",
    description: "Ensure gaming compliance in your jurisdiction",
  },
  {
    icon: Eye,
    title: "Privacy Protected",
    description: "Zero-knowledge proofs protect your personal data",
  },
  {
    icon: Lock,
    title: "Anti-Fraud Protection",
    description: "OFAC screening prevents fraudulent accounts",
  },
];

// UserDisplay component
function UserDisplay({ address, className = "" }: { address: string; className?: string }) {
  const displayAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  return (
    <code className={`font-mono text-sm ${className}`}>
      {displayAddress}
    </code>
  );
}

export default function VerifyPage() {
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [showBenefits, setShowBenefits] = useState<boolean>(false);
  const [verificationStep, setVerificationStep] = useState<"scan" | "processing" | "complete">("scan");

  const { address, isConnected } = useAccount();

  // Initialize Self App configuration
  useEffect(() => {
    if (address && isConnected) {
      try {
        const app = new SelfAppBuilder({
          appName: "TheOnePercent Gaming",
          scope: "theonepercent-gaming",
          endpoint: process.env.NEXT_PUBLIC_COINTOSS_CONTRACT_ADDRESS || "0x...", // Update with your contract address
          endpointType: "staging_celo", // Change to "celo" for mainnet
          userId: address,
          userIdType: "hex",
          version: 2,
          userDefinedData: "gaming_verification",
          disclosures: {
            // Gaming-specific verification requirements
            minimumAge: 18,           // Legal gaming age
            nationality: true,        // Geographic compliance
            ofac: true,              // Financial fraud prevention
            name: true,              // Optional: for leaderboards
          },
          devMode: true, // Set to false for production
        } as Partial<SelfApp>).build();

        setSelfApp(app);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to initialize Self app:", error);
        toast.error("Failed to initialize verification");
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  // Handle verification completion
  const handleVerificationSuccess = useCallback(async () => {
    setVerificationStep("processing");

    try {
      // In a real implementation, you would call your backend verification endpoint
      // and then update the contract state

      // Simulate verification processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      setVerificationStep("complete");
      setIsVerified(true);

      toast.success("🎉 Gaming verification complete!");

    } catch (error) {
      console.error("Verification processing failed:", error);
      setVerificationStep("scan");
      toast.error("Verification processing failed. Please try again.");
    }
  }, []);

  const handleVerificationError = useCallback((error: any) => {
    console.error("Verification error:", error);
    setVerificationStep("scan");
    const errorMessage = error?.reason || "Verification failed. Please try again.";
    toast.error(errorMessage);
  }, []);

  // Check for verification status from URL parameters (callback from Self app)
  useEffect(() => {
    const checkVerificationFromURL = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const proofParam = urlParams.get("proof");
      const publicSignalsParam = urlParams.get("publicSignals");

      if (proofParam && publicSignalsParam && !isVerified) {
        setVerificationStep("processing");

        try {
          // Parse the verification data
          const proof = JSON.parse(decodeURIComponent(proofParam));
          const publicSignals = JSON.parse(decodeURIComponent(publicSignalsParam));

          // Validate proof structure
          if (!proof || !publicSignals || publicSignals.length < 21) {
            throw new Error("Invalid verification data");
          }

          // Process verification (this would call your backend in production)
          await handleVerificationSuccess();

          // Clean up URL
          window.history.replaceState({}, "", window.location.pathname);

        } catch (error) {
          handleVerificationError(error);
        }
      }
    };

    if (!isLoading) {
      checkVerificationFromURL();
    }
  }, [isLoading, isVerified, handleVerificationSuccess, handleVerificationError]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="relative w-16 h-16 mx-auto mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20"></div>
            <div className="absolute inset-0 rounded-full border-t-4 border-emerald-500"></div>
          </motion.div>
          <p className="text-slate-400 text-lg font-medium">
            Initializing verification...
          </p>
        </motion.div>
      </div>
    );
  }

  // Not connected state
  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Connect Wallet to Verify
            </h1>
            <p className="text-slate-400 mb-6">
              Connect your wallet to start the gaming verification process
            </p>
            <Link href="/">
              <button className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all">
                <Home className="w-5 h-5" />
                Connect Wallet
              </button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-6">
            <Link href="/">
              <motion.button
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700/50 transition-all"
                whileTap={{ scale: 0.95 }}
              >
                <Home className="w-4 h-4" />
                Back to Gaming
              </motion.button>
            </Link>

            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${
                isVerified
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}
            >
              {isVerified ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verified Gamer
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Unverified
                </>
              )}
            </span>
          </div>

          <motion.div
            className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center relative"
            animate={{
              rotate: isVerified ? [0, 360] : [0, 5, -5, 0],
              scale: verificationStep === "processing" ? [1, 1.1, 1] : 1
            }}
            transition={{
              rotate: { duration: isVerified ? 2 : 4, repeat: Infinity },
              scale: { duration: 1, repeat: Infinity }
            }}
          >
            {verificationStep === "complete" ? (
              <CheckCircle className="w-12 h-12 text-white" />
            ) : verificationStep === "processing" ? (
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Shield className="w-12 h-12 text-white" />
            )}

            <motion.div
              className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </motion.div>
          </motion.div>

          <h1 className="text-3xl font-bold text-white mb-4">
            {isVerified ? "🎮 Verified Gamer!" : "Gaming Identity Verification"}
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            {isVerified
              ? "You're now a verified gamer with access to bonus pools and premium features"
              : "Verify your identity to unlock bonus pools and exclusive gaming features"}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Verification Card */}
          <motion.div
            className={`bg-gradient-to-br ${
              isVerified
                ? "from-emerald-500/10 to-emerald-600/5 border-emerald-500/20"
                : "from-slate-800/50 to-slate-900/50 border-slate-700/50"
            } backdrop-blur-xl border rounded-2xl overflow-hidden`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {isVerified ? (
              // Verified State
              <div className="p-8 text-center">
                <motion.div
                  className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.6 }}
                >
                  <Trophy className="w-10 h-10 text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Gaming Verification Complete! 🏆
                </h3>
                <p className="text-emerald-400 mb-6">
                  You now get +1 bonus pool on every stake and access to verified-only gaming rooms
                </p>
                <div className="space-y-3">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Coins className="w-6 h-6 text-emerald-400" />
                      <div className="text-left">
                        <p className="font-semibold text-white">Bonus Pool Active</p>
                        <p className="text-sm text-emerald-400">+1 extra pool per stake</p>
                      </div>
                    </div>
                  </div>
                  <Link href="/">
                    <motion.button
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                      whileTap={{ scale: 0.95 }}
                    >
                      <GamepadIcon className="w-5 h-5" />
                      Start Gaming
                      <ArrowRight className="w-5 h-5" />
                    </motion.button>
                  </Link>
                </div>
              </div>
            ) : (
              // Verification Process
              <div className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {verificationStep === "processing"
                      ? "Processing Verification..."
                      : "Verify with Self Protocol"
                    }
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    {verificationStep === "processing"
                      ? "Please wait while we verify your identity on-chain..."
                      : "Scan the QR code below with the Self app to complete secure identity verification"
                    }
                  </p>
                </div>

                {verificationStep === "processing" ? (
                  <div className="text-center">
                    <motion.div
                      className="w-24 h-24 mx-auto mb-6 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <p className="text-slate-400">
                      Verifying your gaming eligibility...
                    </p>
                  </div>
                ) : selfApp ? (
                  <div className="text-center">
                    <motion.div
                      className="inline-block p-6 bg-white rounded-3xl mb-6 shadow-2xl"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      <SelfQRcodeWrapper
                        selfApp={selfApp}
                        onSuccess={handleVerificationSuccess}
                        onError={handleVerificationError}
                        size={220}
                      />
                    </motion.div>

                    <div className="space-y-2 text-xs text-slate-400 mb-6">
                      <p>
                        Player: <UserDisplay address={address} className="text-emerald-400" />
                      </p>
                      <p>Network: Celo Testnet</p>
                    </div>

                    <motion.button
                      onClick={() => setShowBenefits(!showBenefits)}
                      className="flex items-center justify-center gap-2 mx-auto text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                      whileTap={{ scale: 0.95 }}
                    >
                      <Gem className="w-4 h-4" />
                      {showBenefits ? "Hide" : "See"} Gaming Benefits
                      <motion.div
                        animate={{ rotate: showBenefits ? 180 : 0 }}
                      >
                        <ArrowRight className="w-4 h-4 rotate-90" />
                      </motion.div>
                    </motion.button>
                  </div>
                ) : (
                  <div className="text-center p-6">
                    <motion.div
                      className="w-12 h-12 mx-auto mb-4 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <p className="text-slate-400">Initializing verification...</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Benefits & Security Section */}
          <div className="space-y-6">
            {/* Gaming Benefits */}
            <AnimatePresence>
              {(showBenefits || !isVerified) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-2xl p-6"
                >
                  <h4 className="text-xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
                    <Crown className="w-6 h-6 text-amber-400" />
                    Verified Gamer Benefits
                  </h4>
                  <div className="space-y-4">
                    {gamingBenefits.map((benefit, index) => (
                      <motion.div
                        key={benefit.title}
                        className={`flex items-start gap-4 p-4 bg-slate-900/30 rounded-xl border ${
                          benefit.highlight
                            ? "border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5"
                            : "border-slate-700/30"
                        }`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div
                          className={`p-2 rounded-lg bg-gradient-to-br ${benefit.color}/20 border border-slate-600/30`}
                        >
                          <benefit.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-white mb-1 flex items-center gap-2">
                            {benefit.title}
                            {benefit.highlight && (
                              <Star className="w-4 h-4 text-amber-400" />
                            )}
                          </h5>
                          <p className="text-sm text-slate-400 leading-relaxed">
                            {benefit.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Security Features */}
            <motion.div
              className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-2xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h4 className="text-lg font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                Gaming Security Features
              </h4>
              <div className="space-y-4">
                {securityFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    className="flex items-start gap-3 p-3 bg-slate-900/20 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <feature.icon className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-white text-sm mb-1">
                        {feature.title}
                      </h5>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}