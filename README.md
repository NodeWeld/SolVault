# SolVault

SolVault is a **Solana NFT portfolio and wallet dashboard** built with Next.js 14. It connects with browser wallets (Phantom, Solflare, Backpack), loads NFTs through **Helius Digital Asset Standard (DAS)**, shows **SOL price** (CoinGecko) and **collection floors** (Magic Eden), supports **single and batch NFT transfers**, optional **Anchor vault** deposit/withdraw, and a **multi-wallet sidebar** with persisted preferences.

---

## Features

| Area | What it does |
|------|----------------|
| **Wallets** | Connect via wallet adapter; track extra addresses in the sidebar (read-only labels). Active view switches which address’s NFTs and activity load. |
| **NFTs** | Grid with filters (collection, rarity trait, “has image”), selection for batch send, detail modal with metadata and vault actions. |
| **Transfers** | Send one NFT (legacy transaction); batch send in groups of five (versioned transactions, sequential confirm). Import flow moves NFTs from a secondary address when that wallet is connected to sign. |
| **Vault (on-chain)** | Optional Anchor program: deposit NFT into a PDA-backed vault, withdraw, or batch transfer to multiple recipients (advanced; requires deployed program ID). |
| **Activity** | Recent signatures for the viewed address; heuristics on token balance changes to label in/out when possible; links to Solscan. |
| **Stats** | SOL balance (and USD) for the viewed address, filtered NFT count, rough “portfolio hint” when a collection filter + Magic Eden floor are available. |

---

## Tech stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router), TypeScript, React 18  
- **Styling:** [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)–style primitives (Radix), custom Solana-themed tokens  
- **Solana:** [@solana/web3.js](https://solana.com/docs/clients/javascript), [@solana/spl-token](https://github.com/solana-labs/solana-program-library), [@solana/wallet-adapter](https://github.com/anza-xyz/wallet-adapter) (+ separate Backpack adapter package)  
- **On-chain app layer:** [@coral-xyz/anchor](https://www.anchor-lang.com/) (TypeScript client + IDL)  
- **Data:** [TanStack Query](https://tanstack.com/query) (caching, mutations), [Zustand](https://zustand-demo.pmnd.rs/) + `persist` (wallets, filters, selection)  
- **Motion:** [Framer Motion](https://www.framer.com/motion/), [canvas-confetti](https://www.npmjs.com/package/canvas-confetti) on successful sends  
- **External APIs:** [Helius](https://www.helius.dev/) DAS (`getAssetsByOwner`), [Magic Eden](https://api-mainnet.magiceden.dev/) collection stats, [CoinGecko](https://www.coingecko.com/en/api) SOL price  

---

## Repository layout

```
SolVault/
├── app/
│   ├── layout.tsx          # Root layout, fonts, background orbs
│   ├── page.tsx            # Landing (disconnected) vs dashboard (connected)
│   ├── globals.css         # Theme variables, grid, orbs
│   ├── providers.tsx       # RPC Connection, Wallet, Modal, React Query
│   └── api/
│       ├── nfts/route.ts   # POST → Helius DAS by owner
│       ├── price/route.ts  # GET → CoinGecko SOL
│       ├── floor/route.ts  # GET → Magic Eden floor by symbol
│       └── activity/route.ts # GET → RPC signatures + parsed txs
├── components/
│   ├── layout/             # Header, Sidebar
│   ├── wallet/             # Connect button, badge, add-wallet modal
│   ├── nft/                # Grid, card, skeleton, detail modal
│   ├── transfer/           # Send, batch send, import modals
│   ├── dashboard/          # Stats, filters, activity feed
│   └── ui/                 # Button, Card, Dialog, etc.
├── hooks/                  # React Query + wallet mutations + Anchor helpers
├── lib/                    # RPC/DAS clients, transfers, batch builder, IDL JSON
├── store/walletStore.ts    # Zustand (persisted)
├── types/index.ts          # Shared TS types
└── anchor/                 # Rust Anchor program + tests (separate workflow)
    ├── programs/nft_vault/src/lib.rs
    ├── tests/nft_vault.ts
    ├── Anchor.toml
    └── Cargo.toml
```

---

## How data flows

1. **NFT list**  
   Browser → `POST /api/nfts` with `{ address }` → server calls Helius JSON-RPC `getAssetsByOwner` → maps assets to the app’s `NFT` shape → TanStack Query key `["nfts", address]`.

2. **SOL price**  
   `GET /api/price` → CoinGecko `simple/price` → used in the header and balance USD estimates.

3. **Floor price**  
   `GET /api/floor?symbol=...` → Magic Eden collection endpoint (when a collection filter is active).

4. **Activity**  
   `GET /api/activity?address=...` → `getSignaturesForAddress` + `getParsedTransaction` on your configured RPC → compares pre/post token balances (decimals `0`) to guess NFT in/out.

5. **Send / batch send**  
   Client builds SPL token (NFT) transfer instructions; wallet signs. Batch paths use `VersionedTransaction` chunks of up to five mints, then send/confirm with a short delay between chunks.

6. **Vault**  
   `useVaultProgram` builds an Anchor `Program` from `lib/idl/nft_vault.json` and `NEXT_PUBLIC_VAULT_PROGRAM_ID`, then `depositNFT` / `withdrawNFT` / `batchTransfer` with PDAs and `remainingAccounts` as implemented in the hook.

---

## Environment variables

Copy `.env.local.example` to `.env.local` (or use `.env`; both are gitignored in this project). All public vars use the `NEXT_PUBLIC_` prefix so the browser can read them where needed.

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_HELIUS_API_KEY` | Helius API key; used to build `https://{cluster}.helius-rpc.com/?api-key=...` for **DAS** if you do not pass a full Helius URL in `NEXT_PUBLIC_RPC_URL`. |
| `NEXT_PUBLIC_SOLANA_NETWORK` | `mainnet-beta`, `devnet`, or `testnet`. Must match the cluster your **wallet** uses. Use **`devnet`**, not `devnet-beta`. |
| `NEXT_PUBLIC_RPC_URL` | Preferred RPC for `ConnectionProvider` and server routes that use `createConnection`. For NFT loading, either this must be a **Helius** URL (with `api-key`) **or** `NEXT_PUBLIC_HELIUS_API_KEY` must be set—plain public Solana RPC does **not** implement DAS. |
| `NEXT_PUBLIC_MAGIC_EDEN_API` | Base URL for Magic Eden (default mainnet v2 in example). |
| `NEXT_PUBLIC_COINGECKO_API` | Base URL for CoinGecko v3. |
| `NEXT_PUBLIC_VAULT_PROGRAM_ID` | Deployed Anchor program id; required for vault UI actions. Update `lib/idl/nft_vault.json` `address` / metadata when you deploy your own program. |

After changing env vars, restart `npm run dev`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies. |
| `npm run dev` | Development server ([http://localhost:3000](http://localhost:3000)). |
| `npm run clean` | Deletes `.next` (fixes many stale **ChunkLoadError** / timeout issues after restarts). |
| `npm run dev:clean` | Clean then `next dev`. |
| `npm run build` | Production build. |
| `npm run start` | Serve production build. |
| `npm run lint` | ESLint. |

**Anchor** (from `anchor/`):

```bash
cd anchor
anchor build
anchor deploy --provider.cluster devnet   # example
anchor test
```

Install Solana CLI, Anchor, and `avm` per [Anchor docs](https://www.anchor-lang.com/docs/installation) if you have not already.

---

## Anchor program (`nft_vault`)

Located under `anchor/programs/nft_vault/`. High level:

- **`deposit_nft`** — Moves one NFT from the user’s ATA into a vault ATA keyed by a `VaultEntry` PDA (`seeds: ["vault", owner, mint]`).  
- **`withdraw_nft`** — Owner signs; NFT returns to user; vault ATA closed; `VaultEntry` closed (rent returned).  
- **`batch_transfer`** — Up to five `(mint → recipient)` operations in one instruction using **remaining accounts** (vault entry, vault ATA, recipient ATA per slot); closes vault state after transfer.

IDL consumed by the app lives at `lib/idl/nft_vault.json`. Regenerate from your deployment when the program id or interface changes (when `anchor idl` works in your toolchain).

---

## Design and UX notes

- **Landing** when no wallet is connected; **dashboard** when connected.  
- **Header:** logo, live SOL quote, wallet badge, connect control.  
- **Sidebar (lg+):** tracked wallets, “Add wallet” for extra addresses.  
- **Dashboard panels** use a blue panel / green accent theme for stats, filters, and activity.  
- **Compressed NFTs** are listed when Helius returns them; SPL one-click **send** is disabled in the UI for compressed items (different transfer mechanics).  

---

## Troubleshooting

| Symptom | Things to check |
|---------|------------------|
| **No NFTs** | Helius key or Helius RPC URL; network matches wallet (`mainnet-beta` vs `devnet`); not using public RPC-only URL for DAS. |
| **“Maximum update depth”** (fixed in tree) | Effects must not depend on unstable refs (e.g. wallet `publicKey` object identity, or entire `useMutation()` result). |
| **ChunkLoadError / layout.js timeout** | `npm run clean`, restart dev server, hard refresh or private window; only one `next dev` on port 3000. |
| **Import / batch send fails** | Source wallet must be **connected** in the adapter to sign; recipient must match expectations (import modal checks primary address). |
| **IDL / vault errors** | `NEXT_PUBLIC_VAULT_PROGRAM_ID` and IDL `address` must match the deployed program; wallet must be on the same cluster. |

---

## Security and production

- `NEXT_PUBLIC_*` values are exposed to the browser; treat API keys as **rate-limited public** keys where possible.  
- Prefer **server-only** secrets for sensitive operations if you extend the app (this template uses public RPC/DAS patterns).  
- Audit any on-chain program before mainnet use; vault and batch paths move real assets.

---

## License

This project is released under the [MIT License](LICENSE). You may use, modify, and distribute it with minimal restrictions; the software is provided **as-is** without warranty.

**Optional:** Replace `SolVault contributors` in `LICENSE` with your legal name or organization if you want a specific copyright holder. If you prefer **copyleft** (derivatives must stay open) or **stricter patent terms**, consider [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) or [GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.html) instead—those require changing `LICENSE` and `package.json`’s `"license"` field to match.

The Anchor program under `anchor/` is part of the same repository license unless you add a separate notice (some teams use Apache-2.0 for on-chain code only).
# SolVault
