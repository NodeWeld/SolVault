import type { Connection, Transaction, VersionedTransaction } from "@solana/web3.js";

function formatSimError(err: unknown, logs: string[] | null | undefined): string {
  const logBlock = logs?.length ? `\n${logs.join("\n")}` : "";
  return `Simulation failed: ${typeof err === "object" ? JSON.stringify(err) : String(err)}${logBlock}`;
}

/** Legacy `Transaction` (NFT / SOL / SPL helpers). */
export async function simulateLegacyTransaction(
  connection: Connection,
  tx: Transaction
): Promise<void> {
  const sim = await connection.simulateTransaction(tx, undefined, false);
  if (sim.value.err) {
    throw new Error(formatSimError(sim.value.err, sim.value.logs));
  }
}

/** Versioned transaction (e.g. batch send). */
export async function simulateVersionedTransaction(
  connection: Connection,
  tx: VersionedTransaction
): Promise<void> {
  const sim = await connection.simulateTransaction(tx, {
    sigVerify: false,
    commitment: "processed",
  });
  if (sim.value.err) {
    throw new Error(formatSimError(sim.value.err, sim.value.logs));
  }
}
