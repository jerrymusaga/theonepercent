"use client";

import { useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { AlertCircle, CheckCircle, Loader2, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useContractAddress, useCoinTossRead } from "@/hooks";

export function ContractConnectionTest() {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const contractAddress = useContractAddress();

  // Test basic contract read - get BASE_STAKE constant
  const {
    data: baseStake,
    isLoading: isLoadingBaseStake,
    error: baseStakeError
  } = useCoinTossRead('BASE_STAKE');

  const testContractConnection = async () => {
    setIsTestingConnection(true);
    setConnectionResult(null);

    try {
      // Check wallet connection
      if (!isConnected || !address) {
        throw new Error("Wallet not connected");
      }

      // Check contract address
      if (!contractAddress || contractAddress === '0x...') {
        throw new Error("Contract address not configured");
      }

      // Check if we can read from contract
      if (baseStakeError) {
        throw new Error(`Contract read failed: ${baseStakeError.message}`);
      }

      if (baseStake === undefined) {
        throw new Error("Contract read returned undefined - contract may not be deployed");
      }

      setConnectionResult({
        success: true,
        message: "Contract connection successful!",
        details: {
          wallet: address,
          chainId: chainId,
          contractAddress: contractAddress,
          baseStake: baseStake?.toString(),
        }
      });

    } catch (error: any) {
      setConnectionResult({
        success: false,
        message: error.message || "Connection test failed",
        details: {
          wallet: address || "Not connected",
          chainId: chainId || "Unknown",
          contractAddress: contractAddress || "Not configured",
        }
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <Card className="p-6 border-2">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${
            isConnected && contractAddress && baseStake !== undefined
              ? 'bg-green-100' : 'bg-yellow-100'
          }`}>
            {isConnected && contractAddress && baseStake !== undefined ? (
              <Wifi className="w-5 h-5 text-green-600" />
            ) : (
              <WifiOff className="w-5 h-5 text-yellow-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Contract Connection Status</h3>
            <p className="text-sm text-gray-600">
              Test connection to CoinToss contract
            </p>
          </div>
        </div>

        {/* Connection Status Indicators */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            <span>Wallet: {isConnected ? "Connected" : "Not connected"}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            {contractAddress && contractAddress !== '0x...' ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            <span>Contract: {contractAddress && contractAddress !== '0x...' ? "Configured" : "Not configured"}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            {isLoadingBaseStake ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            ) : baseStake !== undefined ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            <span>Contract Read: {
              isLoadingBaseStake ? "Testing..." :
              baseStake !== undefined ? "Success" : "Failed"
            }</span>
          </div>
        </div>

        {/* Test Button */}
        <Button
          onClick={testContractConnection}
          disabled={isTestingConnection || isLoadingBaseStake}
          className="w-full"
          variant={connectionResult?.success ? "default" : "outline"}
        >
          {isTestingConnection ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testing Connection...
            </>
          ) : (
            "Test Contract Connection"
          )}
        </Button>

        {/* Test Results */}
        {connectionResult && (
          <div className={`p-4 rounded-lg border ${
            connectionResult.success
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {connectionResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`font-medium ${
                connectionResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {connectionResult.message}
              </span>
            </div>

            {connectionResult.details && (
              <div className="text-xs text-gray-600 space-y-1">
                <div>Wallet: <code>{connectionResult.details.wallet}</code></div>
                <div>Chain ID: <code>{connectionResult.details.chainId}</code></div>
                <div>Contract: <code>{connectionResult.details.contractAddress}</code></div>
                {connectionResult.details.baseStake && (
                  <div>Base Stake: <code>{connectionResult.details.baseStake} wei</code></div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}