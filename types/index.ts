export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

export interface NFT {
  mint: string;
  name: string;
  collection: string | null;
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
