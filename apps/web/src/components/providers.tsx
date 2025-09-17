"use client";

import { MiniAppProvider } from "@/contexts/miniapp-context";
import { ContractErrorBoundary } from "@/components/contract-error-boundary";
import dynamic from "next/dynamic";

const ErudaProvider = dynamic(
  () => import("../components/Eruda").then((c) => c.ErudaProvider),
  { ssr: false }
);

const FrameWalletProvider = dynamic(
  () => import("@/contexts/frame-wallet-context"),
  { ssr: false }
);

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErudaProvider>
      <FrameWalletProvider>
        <ContractErrorBoundary>
          <MiniAppProvider addMiniAppOnLoad={true}>{children}</MiniAppProvider>
        </ContractErrorBoundary>
      </FrameWalletProvider>
    </ErudaProvider>
  );
}
