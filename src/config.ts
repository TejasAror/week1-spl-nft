import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';

/**
 * The public wallet the assignment is documented against.
 * Because we never hardcode a private key, the keypair used to actually sign
 * transactions is loaded from the local Solana CLI config (or SOLANA_KEYPAIR_PATH).
 * If that keypair does not match this expected wallet, a warning is printed so it
 * is obvious during review, but execution is not blocked (the instructor can run
 * the same code from a machine that has the matching keypair).
 */
export const EXPECTED_WALLET = 'HNDAhSqXTA6woJLRRQpaMsWX171XVsjgxBXRxz95xfSB';

export const NETWORK = 'devnet';
export const RPC_ENDPOINT =
  process.env.RPC_ENDPOINT || clusterApiUrl(NETWORK);

/** Example SPL token details. */
export const TOKEN_NAME = 'Week 1 Builder Token';
export const TOKEN_SYMBOL = 'W1BT';
export const TOKEN_DECIMALS = 6;
export const INITIAL_SUPPLY = 1_000_000; // 1,000,000 base units = 1.0 W1BT with 6 decimals
export const TRANSFER_AMOUNT = 250_000; // 250,000 base units = 0.25 W1BT transferred

/** MPL Core NFT details. */
export const NFT_NAME = 'Week 1 Solana NFT';
export const NFT_UPDATED_NAME = 'Week 1 Solana NFT — Updated';
export const NFT_DESCRIPTION =
  'A single-edition NFT minted on Solana Devnet using Metaplex MPL Core.';
export const NFT_IMAGE_URI =
  'https://arweave.net/0bc6B0ZbZzKhksWhYFv9Yh6eK8yPqK-r6y9n4mDxF8k';
export const NFT_METADATA_URI =
  'https://arweave.net/XgYkL1qQdSK9bI0kJBsTve0yXYk0N8dcIHhd4mE4bK4';
export const NFT_UPDATED_METADATA_URI =
  'https://arweave.net/XgYkL1qQdSK9bI0kJBsTve0yXYk0N8dcIHhd4mE4bK4-updated';

function defaultKeypairPath(): string {
  const envOverride = process.env.SOLANA_KEYPAIR_PATH;
  if (envOverride) return envOverride;
  const configPath = join(homedir(), '.config', 'solana', 'cli', 'config.yml');
  try {
    const raw = readFileSync(configPath, 'utf8');
    const match = raw.match(/keypair_path:\s*([^\s]+)/);
    if (match && existsSync(match[1])) return match[1];
  } catch {
    /* fall through to default */
  }
  return join(homedir(), '.config', 'solana', 'id.json');
}

/** Loads the wallet keypair from the local Solana config (never a hardcoded secret). */
export function loadKeypair(): Keypair {
  const path = defaultKeypairPath();
  if (!existsSync(path)) {
    throw new Error(
      `No Solana keypair found at "${path}". ` +
        `Configure one with: solana-keygen new -o ${path}  (or set SOLANA_KEYPAIR_PATH).`
    );
  }
  try {
    const secret = Uint8Array.from(JSON.parse(readFileSync(path, 'utf8')));
    return Keypair.fromSecretKey(secret);
  } catch (err) {
    throw new Error(
      `Failed to read keypair at "${path}". File must be a JSON array of 64 numbers.`,
      { cause: err }
    );
  }
}

export function createConnection(): Connection {
  return new Connection(RPC_ENDPOINT, 'confirmed');
}

let warnedMismatch = false;

export function checkWallet(kp?: Keypair): { keypair: Keypair; matchesExpected: boolean } {
  const keypair = kp ?? loadKeypair();
  const pubkey = keypair.publicKey.toBase58();
  const matchesExpected = pubkey === EXPECTED_WALLET;
  if (!matchesExpected && !warnedMismatch) {
    warnedMismatch = true;
    console.warn(
      `\n[WARN] The locally-configured wallet (${pubkey}) does NOT match the documented ` +
        `wallet (${EXPECTED_WALLET}).\n` +
        `The wallet used for these transactions is loaded from your local Solana keypair.\n` +
        `To run with the documented wallet, configure its keypair on this machine.\n`
    );
  }
  if (matchesExpected) {
    console.log(`\nWallet verified: matches expected wallet (${EXPECTED_WALLET})`);
  }
  return { keypair, matchesExpected };
}

export function isValidPublicKey(value?: string): boolean {
  if (!value) return false;
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}
