"use client";

import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { useMemo, useCallback } from "react";
import type { Idl } from "@coral-xyz/anchor";
import idlRaw from "@/lib/idl/nft_vault.json";

function programIdFromEnv(): PublicKey | null {
  const s = process.env.NEXT_PUBLIC_VAULT_PROGRAM_ID?.trim();
  if (!s) return null;
  try {
    return new PublicKey(s);
  } catch {
    return null;
  }
}

export function useVaultProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const programId = programIdFromEnv();

  const program = useMemo(() => {
    if (!wallet?.publicKey || !programId) return null;
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    });
    const idl = {
      ...(idlRaw as object),
      address: programId.toBase58(),
    } as Idl;
    return new Program(idl, provider);
  }, [connection, wallet, programId]);

  const vaultPda = useCallback(
    (owner: PublicKey, mint: PublicKey) => {
      if (!programId) throw new Error("Vault program id is not configured");
      return PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), owner.toBuffer(), mint.toBuffer()],
        programId
      )[0];
    },
    [programId]
  );

  const depositNFT = useCallback(
    async (mintStr: string) => {
      if (!program || !wallet?.publicKey || !programId) {
        throw new Error("Program not ready or wallet not connected");
      }
      const owner = wallet.publicKey;
      const mint = new PublicKey(mintStr);
      const vaultEntry = vaultPda(owner, mint);
      const userAta = await getAssociatedTokenAddress(
        mint,
        owner,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      const vaultAta = await getAssociatedTokenAddress(
        mint,
        vaultEntry,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const tx = await program.methods
        .depositNft()
        .accounts({
          owner,
          mint,
          userAta,
          vaultEntry,
          vaultAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const latest = await connection.getLatestBlockhash("confirmed");
      tx.feePayer = owner;
      tx.recentBlockhash = latest.blockhash;
      const signed = await wallet.signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      });
      await connection.confirmTransaction(
        { signature: sig, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight },
        "confirmed"
      );
      return sig;
    },
    [program, wallet, programId, connection, vaultPda]
  );

  const withdrawNFT = useCallback(
    async (mintStr: string) => {
      if (!program || !wallet?.publicKey || !programId) {
        throw new Error("Program not ready or wallet not connected");
      }
      const owner = wallet.publicKey;
      const mint = new PublicKey(mintStr);
      const vaultEntry = vaultPda(owner, mint);
      const userAta = await getAssociatedTokenAddress(
        mint,
        owner,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      const vaultAta = await getAssociatedTokenAddress(
        mint,
        vaultEntry,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const tx = await program.methods
        .withdrawNft()
        .accounts({
          owner,
          mint,
          userAta,
          vaultEntry,
          vaultAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const latest = await connection.getLatestBlockhash("confirmed");
      tx.feePayer = owner;
      tx.recentBlockhash = latest.blockhash;
      const signed = await wallet.signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      });
      await connection.confirmTransaction(
        { signature: sig, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight },
        "confirmed"
      );
      return sig;
    },
    [program, wallet, programId, connection, vaultPda]
  );

  const batchTransfer = useCallback(
    async (mints: string[], recipients: string[]) => {
      if (!program || !wallet?.publicKey || !programId) {
        throw new Error("Program not ready or wallet not connected");
      }
      if (mints.length !== recipients.length) {
        throw new Error("mints and recipients length mismatch");
      }
      if (mints.length < 1 || mints.length > 5) {
        throw new Error("Batch must contain between 1 and 5 NFTs");
      }
      const owner = wallet.publicKey;
      const mintKeys = mints.map((m) => new PublicKey(m));
      const recipientKeys = recipients.map((r) => new PublicKey(r));

      const remaining: { pubkey: PublicKey; isWritable: boolean; isSigner: boolean }[] = [];
      for (let i = 0; i < mintKeys.length; i++) {
        const mint = mintKeys[i];
        const recipient = recipientKeys[i];
        const vaultEntry = vaultPda(owner, mint);
        const vaultAta = await getAssociatedTokenAddress(
          mint,
          vaultEntry,
          true,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );
        const recipientAta = await getAssociatedTokenAddress(
          mint,
          recipient,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );
        remaining.push(
          { pubkey: vaultEntry, isWritable: true, isSigner: false },
          { pubkey: vaultAta, isWritable: true, isSigner: false },
          { pubkey: recipientAta, isWritable: true, isSigner: false }
        );
      }

      const tx = await program.methods
        .batchTransfer(mintKeys, recipientKeys)
        .accounts({
          owner,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts(remaining)
        .transaction();

      const latest = await connection.getLatestBlockhash("confirmed");
      tx.feePayer = owner;
      tx.recentBlockhash = latest.blockhash;
      const signed = await wallet.signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      });
      await connection.confirmTransaction(
        { signature: sig, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight },
        "confirmed"
      );
      return sig;
    },
    [program, wallet, programId, connection, vaultPda]
  );

  return {
    program,
    programId,
    depositNFT,
    withdrawNFT,
    batchTransfer,
  };
}
