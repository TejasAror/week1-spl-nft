import { Keypair } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createSignerFromKeypair, signerIdentity, Umi } from '@metaplex-foundation/umi';
import { fromWeb3JsKeypair } from '@metaplex-foundation/umi-web3js-adapters';
import { base58 } from '@metaplex-foundation/umi/serializers';
import { RPC_ENDPOINT } from '../config.js';

/**
 * Builds a Metaplex Umi context rooted at the same keypair we use everywhere
 * else. Umi is required by the MPL Core package for all NFT instructions.
 */
export function createUmiFromKeypair(keypair: Keypair): Umi {
  const umi = createUmi(RPC_ENDPOINT);
  const signer = createSignerFromKeypair(umi, fromWeb3JsKeypair(keypair));
  umi.use(signerIdentity(signer));
  return umi;
}

export type { Umi } from '@metaplex-foundation/umi';

/** Convenience re-export so callers don't need to import umi separately. */
export { publicKey } from '@metaplex-foundation/umi';

/**
 * The umi RPC adapter in this version returns transaction signatures as a
 * base58 byte array. This decodes it back into the base58 string used by
 * Solana Explorer and the rest of the codebase.
 */
export function signatureToString(signature: Uint8Array): string {
  return base58.deserialize(signature)[0];
}

/** Small helper that waits a number of ms. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
