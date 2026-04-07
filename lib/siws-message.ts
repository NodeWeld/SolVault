/** SIWS-style plaintext (Sign-In with Solana–compatible layout). Shared by client and API verify. */
export function formatSiwsMessage(params: {
  domain: string;
  address: string;
  nonce: string;
  issuedAt: string;
  statement?: string;
}): string {
  const lines = [
    `${params.domain} wants you to sign in with your Solana account:`,
    params.address,
    "",
  ];
  if (params.statement?.trim()) {
    lines.push(params.statement.trim(), "");
  }
  lines.push(
    `Nonce: ${params.nonce}`,
    `Issued At: ${params.issuedAt}`,
    "Version: 1"
  );
  return lines.join("\n");
}
