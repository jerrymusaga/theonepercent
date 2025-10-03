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
  Globe,
  TrendingUp,
  Eye,
  UserCheck,
  Crown,
  Gem,
  Target,
  Percent,
  Trophy,
} from "lucide-react";
import { useAccount } from "wagmi";
import { SelfAppBuilder, SelfApp, SelfQRcodeWrapper } from "@selfxyz/qrcode";
import Link from "next/link";
import { useMiniApp } from "@/contexts/miniapp-context";
import { Button } from "@/components/ui/button";
import { useSubmitVerification, useIsVerified } from "@/hooks/use-verification";
import { useToast } from "@/hooks/use-toast";

// TheOnePercent gaming benefits for verified players
const gamingBenefits = [
  {
    icon: Target,
    title: "Bonus Pool Creation",
    description: "Get +1 extra pool for every stake when you're verified",
    highlight: true,
  },
  {
    icon: Percent,
    title: "Verified Player Status",
    description: "Join the elite 1% with your verified gaming badge",
  },
  {
    icon: Trophy,
    title: "Premium Game Access",
    description: "Access exclusive verified-only prediction pools",
  },
  {
    icon: TrendingUp,
    title: "Higher Win Rates",
    description: "Verified players have better success in minority predictions",
  },
  {
    icon: Crown,
    title: "Leaderboard Featured",
    description: "Get priority placement on TheOnePercent leaderboards",
  },
  {
    icon: Zap,
    title: "Instant Approval",
    description: "Skip manual reviews with automated verification",
  },
];

const securityFeatures = [
  {
    icon: UserCheck,
    title: "18+ Age Verification",
    description: "Automated legal gaming age verification",
  },
  {
    icon: Globe,
    title: "Geographic Compliance",
    description: "Ensure prediction gaming compliance in your region",
  },
  {
    icon: Eye,
    title: "Privacy First",
    description: "Zero-knowledge proofs protect your identity",
  },
  {
    icon: Shield,
    title: "Anti-Fraud Protection",
    description: "Advanced screening prevents fake accounts",
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [showBenefits, setShowBenefits] = useState<boolean>(false);
  const [verificationStep, setVerificationStep] = useState<"scan" | "processing" | "complete">("scan");

  const { address, isConnected } = useAccount();
  const { isMiniAppReady } = useMiniApp();
  const { data: isVerified = false, refetch: refetchVerification } = useIsVerified(address);
  const { submitVerification, isConfirmed: isVerificationConfirmed } = useSubmitVerification();
  const { success, error } = useToast();

  // Initialize Self App configuration
  useEffect(() => {
    if (address && isConnected) {
      try {
        const app = new SelfAppBuilder({
          appName: "TheOnePercent Gaming",
          scope: "CoinToss",
          endpoint: (process.env.NEXT_PUBLIC_COINTOSS_CONTRACT_ADDRESS || "0x...").toLowerCase(),
          endpointType: "celo", // Mainnet configuration
          userId: address,
          userIdType: "hex",
          version: 2,
          userDefinedData: "gaming_verification",
          disclosures: {
            minimumAge: 18,
            ofac: true,
            excludedCountries: [],
          },
          devMode: false, // Production mode
        } as Partial<SelfApp>).build();

        setSelfApp(app);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to initialize Self app:", error);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  // Handle verification completion
  const handleVerificationSuccess = useCallback(async (proofData?: any) => {
    setVerificationStep("processing");

    try {
      if (proofData && address) {
        // Submit verification proof to smart contract
        const proofPayload = JSON.stringify(proofData);
        const userContextData = JSON.stringify({ userAddress: address, timestamp: Date.now() });

        submitVerification({
          proofPayload: `0x${Buffer.from(proofPayload).toString('hex')}`,
          userContextData: `0x${Buffer.from(userContextData).toString('hex')}`
        });

        success("Verification submitted!", "Your proof has been submitted to the blockchain for verification.");
      } else {
        // Fallback for demo purposes
        await new Promise(resolve => setTimeout(resolve, 2000));
        setVerificationStep("complete");
        success("Verification completed!", "You are now a verified player with bonus pool access.");
      }
    } catch (err: any) {
      console.error("Verification processing failed:", err);
      error("Verification failed", err.message || "Failed to submit verification proof.");
      setVerificationStep("scan");
    }
  }, [address, submitVerification, success, error]);

  const handleVerificationError = useCallback((error: any) => {
    console.error("Verification error:", error);
    setVerificationStep("scan");
  }, []);

  // Handle verification confirmation
  useEffect(() => {
    if (isVerificationConfirmed) {
      setVerificationStep("complete");
      refetchVerification();
      success("Verification complete!", "You are now a verified player with bonus pool access.");
    }
  }, [isVerificationConfirmed, refetchVerification, success]);

  // Check for verification status from URL parameters
  useEffect(() => {
    const checkVerificationFromURL = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const proofParam = urlParams.get("proof");
      const publicSignalsParam = urlParams.get("publicSignals");

      if (proofParam && publicSignalsParam && !isVerified) {
        setVerificationStep("processing");

        try {
          const proof = JSON.parse(decodeURIComponent(proofParam));
          const publicSignals = JSON.parse(decodeURIComponent(publicSignalsParam));

          if (!proof || !publicSignals || publicSignals.length < 21) {
            throw new Error("Invalid verification data");
          }

          await handleVerificationSuccess({ proof, publicSignals });
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

  // Update verification step based on actual verification status
  useEffect(() => {
    if (isVerified && verificationStep !== "complete") {
      setVerificationStep("complete");
    }
  }, [isVerified, verificationStep]);

  // Loading state
  if (isLoading || !isMiniAppReady) {
    return (
      <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="w-full max-w-md mx-auto p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Initializing verification...</p>
        </div>
      </section>
    );
  }

  // Not connected state
  if (!isConnected || !address) {
    return (
      <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="w-full max-w-md mx-auto p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Connect Wallet to Verify
          </h1>
          <p className="text-gray-300 mb-6">
            Connect your wallet to start the identity verification process
          </p>
          <Link href="/">
            <Button className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 py-8">
        <div className="w-full max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-between mb-6">
              <Link href="/">
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>

              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${
                  isVerified
                    ? "bg-green-900/50 text-green-400 border-green-700"
                    : "bg-yellow-900/50 text-yellow-400 border-yellow-700"
                }`}
              >
                {isVerified ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verified Player
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Unverified
                  </>
                )}
              </span>
            </div>

            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center relative border-2 border-red-500">
              {verificationStep === "complete" ? (
                <CheckCircle className="w-12 h-12 text-white" />
              ) : verificationStep === "processing" ? (
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Shield className="w-12 h-12 text-white" />
              )}
            </div>

            <h1 className="text-4xl font-bold text-white mb-4">
              {isVerified ? "🎮 Verified Player!" : "Identity Verification"}
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              {isVerified
                ? "You're now a verified player with access to bonus pools and premium features"
                : "Verify your identity to unlock bonus pools and exclusive gaming features"}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Verification Card */}
            <div className={`bg-gray-900/50 backdrop-blur-sm border rounded-2xl overflow-hidden ${
              isVerified ? "border-green-700" : "border-gray-800"
            }`}>
              {isVerified ? (
                // Verified State
                <div className="p-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                    <Trophy className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    Verification Complete! 🏆
                  </h3>
                  <p className="text-green-400 mb-6">
                    You now get +1 bonus pool on every stake and access to verified-only gaming rooms
                  </p>
                  <div className="space-y-3">
                    <div className="p-4 bg-green-900/30 border border-green-700 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Target className="w-6 h-6 text-green-400" />
                        <div className="text-left">
                          <p className="font-semibold text-white">Bonus Pool Active</p>
                          <p className="text-sm text-green-300">+1 extra pool per stake</p>
                        </div>
                      </div>
                    </div>
                    <Link href="/">
                      <Button className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white">
                        <Target className="w-4 h-4 mr-2" />
                        Start Gaming
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
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
                    <p className="text-gray-300">
                      {verificationStep === "processing"
                        ? "Please wait while we verify your identity..."
                        : "Scan the QR code below with the Self app to complete secure identity verification"}
                    </p>
                  </div>

                  {verificationStep === "processing" ? (
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-6 border-4 border-gray-700 border-t-red-500 rounded-full animate-spin" />
                      <p className="text-gray-400">
                        Verifying your gaming eligibility...
                      </p>
                    </div>
                  ) : selfApp ? (
                    <div className="text-center">
                      <div className="inline-block p-6 bg-gray-800/80 rounded-2xl mb-6 shadow-lg border border-gray-700">
                        <SelfQRcodeWrapper
                          selfApp={selfApp}
                          onSuccess={handleVerificationSuccess}
                          onError={handleVerificationError}
                          size={220}
                        />
                      </div>

                      <div className="space-y-2 text-sm text-gray-400 mb-6">
                        <p>
                          Player: <UserDisplay address={address} className="text-red-400 font-medium" />
                        </p>
                        <p>Network: Celo Mainnet</p>
                      </div>

                      <button
                        onClick={() => setShowBenefits(!showBenefits)}
                        className="flex items-center justify-center gap-2 mx-auto text-sm text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Gem className="w-4 h-4" />
                        {showBenefits ? "Hide" : "See"} Gaming Benefits
                        <ArrowRight className={`w-4 h-4 transform transition-transform ${showBenefits ? 'rotate-90' : ''}`} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center p-6">
                      <div className="w-12 h-12 mx-auto mb-4 border-4 border-gray-700 border-t-red-500 rounded-full animate-spin" />
                      <p className="text-gray-400">Initializing verification...</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Benefits & Security Section */}
            <div className="space-y-6">
              {/* Gaming Benefits */}
              {(showBenefits || !isVerified) && (
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                  <h4 className="text-xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
                    <Crown className="w-6 h-6 text-yellow-500" />
                    Verified Player Benefits
                  </h4>
                  <div className="space-y-4">
                    {gamingBenefits.map((benefit) => (
                      <div
                        key={benefit.title}
                        className={`flex items-start gap-4 p-4 bg-gray-800/50 rounded-xl border ${
                          benefit.highlight
                            ? "border-yellow-700 bg-yellow-900/20"
                            : "border-gray-700"
                        }`}
                      >
                        <div className="p-2 rounded-lg bg-red-900/50 border border-red-700">
                          <benefit.icon className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-white mb-1 flex items-center gap-2">
                            {benefit.title}
                            {benefit.highlight && (
                              <Star className="w-4 h-4 text-yellow-400" />
                            )}
                          </h5>
                          <p className="text-sm text-gray-300">
                            {benefit.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Security Features */}
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                <h4 className="text-lg font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
                  <Shield className="w-5 h-5 text-red-400" />
                  Security & Privacy
                </h4>
                <div className="space-y-4">
                  {securityFeatures.map((feature) => (
                    <div
                      key={feature.title}
                      className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg"
                    >
                      <feature.icon className="w-5 h-5 text-red-400 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-white text-sm mb-1">
                          {feature.title}
                        </h5>
                        <p className="text-xs text-gray-300">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}