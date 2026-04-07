export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

export interface NFT {
  mint: string;
  name: string;
  collection: string | null;
  /** Human-readable collection name when Helius/metadata provides it; filter key remains `collection` (id). */
  collectionName: string | null;
  image: string | null;
  symbol: string | null;
  attributes: NFTAttribute[];
  owner: string;
  compressed: boolean;
}

export interface TrackedWallet {
  address: string;
  label: string;
  isOwned: boolean;
  addedAt: number;
}

export interface NFTFilter {
  collection?: string;
  rarity?: string;
  hasImage?: boolean;
  /** Case-insensitive match on name, mint, symbol, collection name. */
  search?: string;
}

export interface ActivityItem {
  signature: string;
  slot: number;
  blockTime: number | null;
  direction: "in" | "out" | "unknown";
  mint: string | null;
  nftName: string | null;
  collection: string | null;
}

export interface FloorPrice {
  symbol: string;
  floorPrice: number | null;
  currency: string;
}

export interface SolPrice {
  usd: number;
  change24h: number | null;
}

export interface BatchSendProgress {
  sent: number;
  total: number;
  errors: { mint: string; message: string }[];
}

/** Parsed SPL token account (fungible); excludes classic 1/0 NFT pattern. */
export interface SplTokenBalance {
  ata: string;
  mint: string;
  amountRaw: string;
  decimals: number;
  uiAmount: string;
  /** Which token program owns this ATA (send path must match). */
  program?: "token" | "token-2022";
}
