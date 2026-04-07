/** Wrapped SOL mint (Jupiter / most swap UIs). */
export const JUPITER_WSOL_MINT = "So11111111111111111111111111111111111111112";

/**
 * Open Jupiter swap UI with the given input mint (defaults to swapping toward WSOL).
 * User completes the swap on jup.ag; this app does not custody funds.
 */
export function jupiterSwapDeepLink(inputMint: string, outputMint: string = JUPITER_WSOL_MINT) {
  const params = new URLSearchParams({
    inputMint: inputMint.trim(),
    outputMint: outputMint.trim(),
  });
  return `https://jup.ag/swap?${params.toString()}`;
}
