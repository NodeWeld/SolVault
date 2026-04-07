import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";

export function verifySiwsEd25519(params: {
  publicKeyBase58: string;
  messageUtf8: string;
  signatureBase58: string;
}): boolean {
  try {
    const pk = new PublicKey(params.publicKeyBase58.trim());
    const sig = bs58.decode(params.signatureBase58.trim());
    const msg = new TextEncoder().encode(params.messageUtf8);
    return nacl.sign.detached.verify(msg, sig, pk.toBytes());
  } catch {
    return false;
  }
}
