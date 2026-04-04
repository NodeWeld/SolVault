import type {
  Connection,
  Transaction,
  VersionedMessage,
  VersionedTransaction,
} from "@solana/web3.js";

function formatSimError(err: unknown, logs: string[] | null | undefined): string {
  const logBlock = logs?.length ? `\n${logs.join("\n")}` : "";
  return `Simulation failed: ${typeof err === "object" ? JSON.stringify(err) : String(err)}${logBlock}`;
}

async function runLegacySimulationCore(connection: Connection, tx: Transaction) {
  const sim = await connection.simulateTransaction(tx, undefined, false);
  if (sim.value.err) {
    throw new Error(formatSimError(sim.value.err, sim.value.logs));
  }
  return sim.value;
}

async function runVersionedSimulationCore(connection: Connection, tx: VersionedTransaction) {
  const sim = await connection.simulateTransaction(tx, {
    sigVerify: false,
    commitment: "processed",
  });
  if (sim.value.err) {
    throw new Error(formatSimError(sim.value.err, sim.value.logs));
  }
  return sim.value;
}

/** Legacy `Transaction` (NFT / SOL / SPL helpers). */
export async function simulateLegacyTransaction(
  connection: Connection,
  tx: Transaction
): Promise<void> {
  await runLegacySimulationCore(connection, tx);
}

/** After a successful simulation, fee quote + compute units for UI summaries. */
export async function simulateLegacyForReview(
  connection: Connection,
  tx: Transaction
): Promise<{ unitsConsumed?: number; feeLamports: number | null }> {
  const value = await runLegacySimulationCore(connection, tx);
  let feeLamports: number | null = null;
  try {
    const fr = await connection.getFeeForMessage(
      tx.compileMessage() as unknown as VersionedMessage
    );
    feeLamports = fr.value;
  } catch {
    feeLamports = null;
  }
  return {
    unitsConsumed: value.unitsConsumed ?? undefined,
    feeLamports,
  };
}

/** Versioned transaction (e.g. batch send). */
export async function simulateVersionedTransaction(
  connection: Connection,
  tx: VersionedTransaction
): Promise<void> {
  await runVersionedSimulationCore(connection, tx);
}

export async function simulateVersionedForReview(
  connection: Connection,
  tx: VersionedTransaction
): Promise<{ unitsConsumed?: number; feeLamports: number | null }> {
  const value = await runVersionedSimulationCore(connection, tx);
  let feeLamports: number | null = null;
  try {
    const fr = await connection.getFeeForMessage(tx.message);
    feeLamports = fr.value;
  } catch {
    feeLamports = null;
  }
  return {
    unitsConsumed: value.unitsConsumed ?? undefined,
    feeLamports,
  };
}
