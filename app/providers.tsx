"use client";

import { useMemo, type ComponentType, type PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { LazyMotion, domAnimation } from "framer-motion";
import { clusterApiUrl } from "@solana/web3.js";
import { getRpcUrl } from "@/lib/solana";

import "@solana/wallet-adapter-react-ui/styles.css";

type ConnectionProps = PropsWithChildren<{ endpoint: string }>;
const Web3ConnectionProvider = ConnectionProvider as ComponentType<ConnectionProps>;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function networkFromEnv(): WalletAdapterNetwork {
  const n = (process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "").trim().toLowerCase();
  if (n === "devnet" || n === "devnet-beta") return WalletAdapterNetwork.Devnet;
  if (n === "testnet") return WalletAdapterNetwork.Testnet;
  return WalletAdapterNetwork.Mainnet;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => {
    try {
      return getRpcUrl();
    } catch {
      return clusterApiUrl("mainnet-beta");
    }
  }, []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network: networkFromEnv() }),
      new BackpackWalletAdapter(),
    ],
    []
  );

  return (
    <Web3ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <LazyMotion features={domAnimation} strict>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
          </LazyMotion>
        </WalletModalProvider>
      </WalletProvider>
    </Web3ConnectionProvider>
  );
}
