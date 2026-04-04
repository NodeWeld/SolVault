"use client";

import { useEffect, useMemo, useState, type ComponentType, type PropsWithChildren } from "react";
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
import {
  CUSTOM_RPC_CHANGED_EVENT,
  readCustomRpcFromStorage,
  resolveWalletRpcEndpoint,
} from "@/lib/custom-rpc";

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

function defaultEndpointFromEnv(): string {
  try {
    return getRpcUrl();
  } catch {
    return clusterApiUrl("mainnet-beta");
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [endpoint, setEndpoint] = useState(defaultEndpointFromEnv);

  useEffect(() => {
    const custom = readCustomRpcFromStorage();
    if (custom) setEndpoint(custom);
  }, []);

  useEffect(() => {
    const sync = () => setEndpoint(resolveWalletRpcEndpoint());
    window.addEventListener(CUSTOM_RPC_CHANGED_EVENT, sync);
    return () => window.removeEventListener(CUSTOM_RPC_CHANGED_EVENT, sync);
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
      {/* No silent reconnect: after disconnect or a new visit, user must choose wallet and approve again. */}
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <LazyMotion features={domAnimation} strict>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
          </LazyMotion>
        </WalletModalProvider>
      </WalletProvider>
    </Web3ConnectionProvider>
  );
}
