# Week 1 Assignment — SPL and NFT

## Overview

This project demonstrates the three core on-chain tasks from the Week 1 Solana
assignment, executed against the **Solana Devnet** using **real transactions**:

1. **Mint and transfer a custom SPL token** (`Week 1 Builder Token`, symbol `W1BT`).
2. **Mint an NFT using Metaplex MPL Core** (not the legacy Token Metadata approach).
3. **Update the NFT's name and metadata URI on-chain** as the update authority.

Everything is written in TypeScript using the current Solana JavaScript ecosystem,
is fully automated with tests, and prints real addresses and transaction
signatures so the work can be verified on the Solana Explorer.

> **On-chain proof (real, verified transactions):** see the
> [On-Chain Proof](#on-chain-proof) section. All transactions were submitted to
> Devnet, confirmed, and re-checked before writing this README.

---

## Assignment Requirements

- [x] **Task 1 — SPL Token:** Create a new SPL token mint on Devnet, create an
      associated token account, mint an initial supply to the wallet, create a
      recipient token account, and transfer a defined amount between accounts.
- [x] **Task 2 — MPL Core NFT:** Mint a single-edition NFT asset using
      **Metaplex MPL Core** (`AssetV1`) with the wallet as owner/update authority,
      attach metadata (name, description, image URI, attributes), and confirm.
- [x] **Task 3 — Update NFT:** Update the NFT's name and metadata URI on-chain
      via the MPL Core update instruction, then re-fetch and verify the change.
- [x] **README:** This file.
- [x] **Automated tests:** Unit + Devnet integration tests, all passing.

---

## Tech Stack

| Layer         | Technology                                                            |
| ------------- | --------------------------------------------------------------------- |
| Language      | [TypeScript](https://www.typescriptlang.org/) (Node.js `>= 20`)       |
| Blockchain    | [Solana](https://solana.com/) — **Devnet** cluster                     |
| SPL Token     | [`@solana/spl-token`](https://npmjs.com/package/@solana/spl-token)     |
| NFT           | [Metaplex MPL Core](https://npmjs.com/package/@metaplex-foundation/mpl-core) + Umi |
| RPC / Client  | [`@solana/web3.js`](https://npmjs.com/package/@solana/web3.js) (v1)    |
| Umi runtime   | `@metaplex-foundation/umi`, `umi-bundle-defaults`, `umi-web3js-adapters` |
| Testing       | [Vitest](https://vitest.dev/)                                          |
| Linting       | ESLint + typescript-eslint                                            |
| Runtime / TS  | `tsx`, `tsc`                                                           |

> **Note on the NFT library:** The assignment explicitly requires **MPL Core**.
> This project uses `@metaplex-foundation/mpl-core` (the `AssetV1` program on
> Devnet), not the legacy Metaplex Token Metadata (`mpl-token-metadata`) package.

---

## Prerequisites

Before running anything you need:

- **Node.js >= 20** and **npm**.
- The **Solana CLI** (optional for the scripts, needed to verify config/airdrop):

  ```bash
  sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
  export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
  solana --version
  ```

- A **local Solana keypair** (wallet) used to sign transactions. See
  [Wallet Configuration](#wallet-configuration).

---

## Wallet Configuration

The project **never asks for or hardcodes a private key**. Transactions are signed
with the keypair loaded from your **local Solana CLI configuration** (the standard
`~/.config/solana/id.json`), or from the path in `SOLANA_KEYPAIR_PATH`.

> **Important security note:** never commit your keypair (e.g. `id.json`) to the
> repository. This repository's `.gitignore` excludes keypair files, `.env`, and
> generated state. Only **public** addresses and signatures are ever stored or
> shown.

### Setting up a wallet

Generate a new keypair and use it as the cluster default:

```bash
solana-keygen new -o ~/.config/solana/id.json
```

Check which wallet the CLI will use:

```bash
solana config get          # shows RPC URL + keypair path
solana address             # prints the public key of the configured wallet
```

### The documented wallet for this assignment

The public wallet address used for verification/documentation in this submission is:

```
HNDAhSqXTA6woJLRRQpaMsWX171XVsjgxBXRxz95xfSB
```

**Never expose the corresponding private key.** Only public addresses are
appropriate for review.

> Because we never hardcode a secret, the actual wallet that signs on a particular
> machine is whatever keypair is configured locally. If the locally configured
> wallet differs from the documented address above, the scripts print a clear
> warning so this is obvious during review — they do **not** fail, so the same
> code can be run by an instructor on a machine holding the matching keypair.

### Funding the wallet (Devnet airdrop)

Transactions cost SOL. If your wallet has no SOL, request a Devnet airdrop:

```bash
solana airdrop 1        # uses the configured wallet; may be rate-limited
solana balance          # verify funds
```

---

## Installation

```bash
npm install
npm run build          # compiles TypeScript (optional but recommended)
```

---

## Devnet Configuration

The project connects to **Devnet** by default (RPC: `https://api.devnet.solana.com`).

Verify your CLI is pointed at Devnet and shows your wallet:

```bash
solana config set --url https://api.devnet.solana.com
solana config get
solana address
solana balance
```

`config.ts` reads the Solana CLI configuration to locate the keypair and uses
Devnet for all RPC calls. You can override the RPC with the `RPC_ENDPOINT`
environment variable if needed.

---

## Running the SPL Token Demo

Mint a new SPL token and mint the initial supply to your wallet:

```bash
npm run mint:token
```

Transfer a defined amount to a recipient:

```bash
npm run transfer:token -- <RECIPIENT_PUBLIC_KEY>
```

Expected output (real values):

```
Creating SPL token mint...
Mint created: <mint address>
Creating associated token account...
Token account: <ata address>
Minting 1000000 base units...
Mint transaction: <signature>

Sender before:   1000000
Recipient before:0
Transferring 250000 base units -> <recipient> ...
Transfer transaction: <signature>
Sender after:    750000
Recipient after: 250000
```

Token details: name **Week 1 Builder Token**, symbol **W1BT**, decimals **6**,
initial supply **1,000,000** base units (1.0 W1BT), transfer amount **250,000**
base units (0.25 W1BT). The transaction must confirm or the script throws a clear
error and exits non-zero.

To force a brand-new mint instead of reusing the saved one, append `--fresh`:

```bash
npm run mint:token -- --fresh
```

---

## Running the NFT Demo

Mint an MPL Core NFT:

```bash
npm run mint:nft
```

Expected output (real values):

```
Creating MPL Core asset...
NFT creation transaction: <signature>

Wallet:  <wallet>
Network: devnet
NFT Asset:          <asset address>
NFT Creation Tx:    <signature>
```

The NFT uses Metaplex **MPL Core** (`AssetV1`). It is created with the configured
wallet as **owner** and **update authority**, and includes metadata: a name
(`Week 1 Solana NFT`), description, image URI, attributes, and a metadata URI.

---

## Updating the NFT

Update the name and metadata URI on-chain:

```bash
npm run update:nft
```

Optionally pass an explicit asset address:

```bash
npm run update:nft -- <ASSET_ADDRESS>
```

Expected output (real values):

```
Updating MPL Core asset <asset> ...
  old name: Week 1 Solana NFT
  old uri:  <metadata uri>
  new name: Week 1 Solana NFT — Updated
  new uri:  <updated metadata uri>
NFT update transaction: <signature>
```

The update goes through the **MPL Core update instruction** (not a local file
change), then re-fetches the asset and **asserts** the new name/URI are present
on-chain before reporting success.

---

## Running the Full Demo

To run the complete flow in one command (token -> transfer -> NFT mint -> update):

```bash
npm run demo -- <RECIPIENT_PUBLIC_KEY>
```

---

## Running Tests

```bash
npm test
```

`npm test` runs the fast, offline unit tests (config/constants/wallet-loading).

Run **all** tests, including the live Devnet integration tests:

```bash
npm run test:all
# or explicitly:
npm run test:unit
npm run test:integration
```

> The integration tests submit **real Devnet transactions** and therefore require
> the configured wallet to hold SOL. They are labelled file-per-file and can be
> run independently.

---

## Test Results

Screenshot placeholder — replace `screenshots/tests-passing.png` with a screenshot
of a successful `npm run test:all` run.

![All tests passing](screenshots/tests-passing.png)

> Note: the screenshot is not committed; take it yourself so your instructor can
> see the test output on your machine.

---

## On-Chain Proof

These are **real** addresses and signatures from confirmed Devnet transactions.
View any of them on the Solana Explorer:

- Search by **address/signature** at: https://explorer.solana.com
- Choose **Devnet** in the network selector (top-right).
- Or use these direct links (swap the value):

| Item | Value |
| ---- | ----- |
| **SPL Token Mint** | `GY2b5LPd2eiBq72Gk79qgGxXMVf2NixHMq7KfAMVZvMH` |
| **SPL Mint Transaction** | `5vr1Hv7U8TnUU82oPiLMQzxzEoqXP4iM73YzXVqHwA7kiTeqaJRgs1USsoGT6YvQJvbnGWSS583qochkKz4rtm3w` |
| **Transfer Transaction** | `4KnKn2L5h79C2vrRG7dK1pJaUaR3y78D1estBzmUPsjaMzHj7WHrrfqWw9iNRodXpJt79wqyXFP77jbBmqbcKruM` |
| **NFT Asset** | `92MZYMMWe9WtxGjbVGKe5uJm6Zr5R3kaRurTV5jf1sF` |
| **NFT Creation Transaction** | `4zs79KBaFsLAuKY8GneqWcNQ9yPAyDVbTAQLEo2d6uUei9cAwSacQd5riFacYP9hkgmzkpmCzckysjPaX1GG91iv` |
| **NFT Update Transaction** | `5aqV5uFfeRub9sRve4pcAZfpgBFfARYZ8p2gdq2RWBUvqq5afGYVrpMmngpsv6HeEpxJFRMLcyxWNkG8AL3D54jz` |

Direct example links (Devnet):

- SPL mint: https://explorer.solana.com/address/GY2b5LPd2eiBq72Gk79qgGxXMVf2NixHMq7KfAMVZvMH?cluster=devnet
- NFT asset: https://explorer.solana.com/address/92MZYMMWe9WtxGjbVGKe5uJm6Zr5R3kaRurTV5jf1sF?cluster=devnet
- Mint tx: https://explorer.solana.com/tx/5vr1Hv7U8TnUU82oPiLMQzxzEoqXP4iM73YzXVqHwA7kiTeqaJRgs1USsoGT6YvQJvbnGWSS583qochkKz4rtm3w?cluster=devnet

These values are re-printed every time a script runs and are saved (gitignored) in
`outputs/state.json`.

---

## Project Structure

```
.
├── src/
│   ├── config.ts            # Constants, wallet + RPC config, keypair loading
│   ├── index.ts             # CLI entry point (demo commands)
│   ├── state.ts             # Save/load generated addresses & signatures
│   ├── reset.ts             # Clear saved state for a fresh run
│   ├── spl/
│   │   ├── mint.ts          # SPL mint creation + mint initial supply
│   │   └── transfer.ts      # SPL transfer + balance verification
│   └── nft/
│       ├── umi.ts           # Builds the Umi context + signature helpers
│       ├── mint.ts          # MPL Core NFT creation
│       └── update.ts        # MPL Core NFT name/metadata update
├── tests/
│   ├── config.test.ts       # Unit tests (offline)
│   ├── spl.test.ts          # SPL Devnet integration tests
│   └── nft.test.ts          # NFT Devnet integration tests
├── screenshots/             # Place test screenshots here
├── outputs/                 # Generated state (gitignored)
├── package.json
├── tsconfig.json / tsconfig.build.json
├── eslint.config.js
└── .gitignore
```

---

## Security

- **Private keys are never committed.** The signing keypair is loaded from your
  local Solana CLI config at runtime.
- `.env`, `.env.*`, keypair files (`*.json` containing secrets), `id.json`,
  `node_modules/`, `dist/`, and `outputs/` are all **gitignored**.
- Only **public addresses and transaction signatures** should ever be submitted
  or committed to the repository.
- Never paste a private key, mnemonic, or seed phrase into any file in this repo.

See `.gitignore` for the exact ignore rules.

---

## Troubleshooting

| Problem | Cause / Fix |
| ------- | ----------- |
| **Insufficient SOL** | Wallet has no balance to pay fees. Run `solana airdrop 1`, or fund the wallet from a faucet. Check with `solana balance`. |
| **Wrong Solana cluster** | Scripts default to Devnet. Verify: `solana config get` shows `api.devnet.solana.com`. Override with `RPC_ENDPOINT` if needed. |
| **Wallet mismatch warning** | The locally configured keypair differs from the documented `HNDAh…fSB` wallet. This is expected unless you hold that keypair locally; configure the matching keypair (or set `SOLANA_KEYPAIR_PATH`) to silence it. |
| **No keypair found** | Run `solana-keygen new -o ~/.config/solana/id.json` or set `SOLANA_KEYPAIR_PATH`. |
| **RPC errors / timeouts** | Devnet RPC can be slow or rate-limited. Scripts retry fetch; otherwise wait and re-run. You can point `RPC_ENDPOINT` at a faster Devnet RPC provider. |
| **Transaction confirmation errors** | The code waits for `confirmed` and throws on failure. Check the wallet has SOL and that the transaction signature is valid on the Explorer. |
| **Metadata URI problems** | The demo uses placeholder/public metadata URIs so minting never depends on external storage. For your own NFT, upload JSON + image to Arweave/Pinata and set the URI in `src/config.ts`. |
| **Package / API version differences** | This project is pinned to the current versions (see `package.json`). If you upgrade packages, MPL Core / Umi APIs may change; this repo's helpers adapt to the installed versions. |

---

## Idempotency & Re-running

Running `npm run mint:token`, `mint:nft`, etc. **reuses** saved addresses and
signatures from `outputs/state.json` instead of creating duplicate resources on
every run. To intentionally create fresh on-chain resources:

```bash
npm run reset                 # clear saved state
# or append --fresh to any command
```

This prevents accidentally creating dozens of mints/NFTs. Only public addresses
and signatures are stored — never private keys.
