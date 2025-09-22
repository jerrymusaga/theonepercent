import { Shield, CheckCircle, AlertCircle, Star, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFormattedVerificationStatus } from "@/hooks/use-verification";
import Link from "next/link";

interface VerificationStatusProps {
  address?: `0x${string}`;
  showActions?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VerificationStatus({
  address,
  showActions = true,
  size = "md",
  className = ""
}: VerificationStatusProps) {
  const { statusText, statusColor, bonusText, verificationInfo, isLoading } =
    useFormattedVerificationStatus(address);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-pulse w-4 h-4 bg-gray-200 rounded-full"></div>
        <span className="text-sm text-gray-500">Checking verification...</span>
      </div>
    );
  }

  const isVerified = verificationInfo?.isVerified;
  const iconSize = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5";
  const textSize = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Status Badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${
        isVerified
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-gray-50 text-gray-600 border-gray-200"
      }`}>
        {isVerified ? (
          <CheckCircle className={`${iconSize} text-green-600`} />
        ) : (
          <Shield className={`${iconSize} text-gray-500`} />
        )}
        <span className={`font-medium ${textSize}`}>
          {statusText}
        </span>
        {isVerified && (
          <Star className="w-3 h-3 text-yellow-500" />
        )}
      </div>

      {/* Bonus Info */}
      {isVerified && verificationInfo && (
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md bg-yellow-50 border border-yellow-200 ${textSize}`}>
          <Crown className="w-3 h-3 text-yellow-600" />
          <span className="text-yellow-700 font-medium">
            {bonusText}
          </span>
        </div>
      )}

      {/* Actions */}
      {showActions && !isVerified && (
        <Link href="/verify">
          <Button size="sm" variant="outline" className="text-xs">
            <Shield className="w-3 h-3 mr-1" />
            Verify
          </Button>
        </Link>
      )}
    </div>
  );
}

interface VerificationBadgeProps {
  address?: `0x${string}`;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function VerificationBadge({
  address,
  size = "md",
  showText = true
}: VerificationBadgeProps) {
  const { verificationInfo, isLoading } = useFormattedVerificationStatus(address);

  if (isLoading) {
    return (
      <div className="animate-pulse w-4 h-4 bg-gray-200 rounded-full"></div>
    );
  }

  if (!verificationInfo?.isVerified) {
    return null;
  }

  const iconSize = size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4";
  const textSize = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="relative">
        <CheckCircle className={`${iconSize} text-green-500`} />
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full border border-white">
          <Star className="w-1 h-1 text-white" />
        </div>
      </div>
      {showText && (
        <span className={`font-medium text-green-700 ${textSize}`}>
          Verified
        </span>
      )}
    </div>
  );
}

interface VerificationBonusDisplayProps {
  address?: `0x${string}`;
  className?: string;
}

export function VerificationBonusDisplay({ address, className = "" }: VerificationBonusDisplayProps) {
  const { verificationInfo, isLoading } = useFormattedVerificationStatus(address);

  if (isLoading || !verificationInfo?.isVerified || verificationInfo.bonusPools === 0) {
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 ${className}`}>
      <Crown className="w-4 h-4 text-yellow-600" />
      <div className="text-sm">
        <span className="font-semibold text-yellow-800">Verification Bonus:</span>
        <span className="text-yellow-700 ml-1">
          +{verificationInfo.bonusPools} pool{verificationInfo.bonusPools !== 1 ? 's' : ''} per stake
        </span>
      </div>
    </div>
  );
}