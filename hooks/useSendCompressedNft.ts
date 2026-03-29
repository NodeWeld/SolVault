"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  mplBubblegum,
  transfer,
  transferV2,
  getAssetWithProof,
  canTransfer,
} from "@metaplex-foundation/mpl-bubblegum";
import { dasApi } from "@metaplex-foundation/digital-asset-standard-api";
import type { DasApiInterface } from "@metaplex-foundation/digital-asset-standard-api";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { none, publicKey, some } from "@metaplex-foundation/umi";
import type { Context, Umi } from "@metaplex-foundation/umi";

export interface SendCompressedNftParams {
  assetId: string;
  recipient: string;
  senderAddress: string;
}

function buildUmi(
  connection: Parameters<typeof createUmi>[0],
  adapter: NonNullable<ReturnType<typeof useWallet>["wallet"]>["adapter"]
): Umi {
  return createUmi(connection)
    .use(mplBubblegum())
    .use(dasApi())
    .use(walletAdapterIdentity(adapter));
}

type UmiWithDas = Pick<Context, "rpc"> & { rpc: DasApiInterface };

export function useSendCompressedNft() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const queryClient = useQueryClient();

  const umi = useMemo(() => {
    const adapter = wallet.wallet?.adapter;
    if (!adapter) return null;
    return buildUmi(connection, adapter);
  }, [connection, wallet.wallet?.adapter]);

  return useMutation({
    mutationFn: async ({ assetId, recipient, senderAddress }: SendCompressedNftParams) => {
      if (!umi) throw new Error("Wallet not ready");
      if (!wallet.publicKey) throw new Error("Wallet not connected");

      const asset = await getAssetWithProof(
        umi as unknown as UmiWithDas,
        publicKey(assetId),
        { truncateCanopy: true }
      );
      if (!canTransfer(asset)) {
        throw new Error("This compressed NFT cannot be transferred (frozen or non-transferable).");
      }
      if (asset.leafOwner.toString() !== wallet.publicKey.toBase58()) {
        throw new Error("Your wallet is not the on-chain owner of this compressed NFT.");
      }

      const recipientPk = publicKey(recipient.trim());
      const useV2 = asset.asset_data_hash != null || asset.flags != null;

      const { signature } = useV2
        ? await transferV2(umi as Umi, {
            payer: umi.identity,
            authority: umi.identity,
            leafOwner: asset.leafOwner,
            leafDelegate: asset.leafDelegate,
            merkleTree: asset.merkleTree,
            newLeafOwner: recipientPk,
            root: asset.root,
            dataHash: asset.dataHash,
            creatorHash: asset.creatorHash,
            assetDataHash: asset.asset_data_hash != null ? some(asset.asset_data_hash) : none(),
            flags: asset.flags != null ? some(asset.flags) : none(),
            nonce: asset.nonce,
            index: asset.index,
            proof: asset.proof,
          }).sendAndConfirm(umi as Umi)
        : await transfer(umi as Umi, {
            leafOwner: umi.identity,
            leafDelegate: asset.leafDelegate,
            merkleTree: asset.merkleTree,
            newLeafOwner: recipientPk,
            root: asset.root,
            dataHash: asset.dataHash,
            creatorHash: asset.creatorHash,
            nonce: asset.nonce,
            index: asset.index,
            proof: asset.proof,
          }).sendAndConfirm(umi as Umi);

      return { signature: String(signature) };
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["nfts", variables.senderAddress] });
    },
  });
}
