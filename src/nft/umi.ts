import { Keypair } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createSignerFromKeypair, signerIdentity, Umi } from '@metaplex-foundation/umi';
import { fromWeb3JsKeypair } from '@metaplex-foundation/umi-web3js-adapters';
import { base58 } from '@metaplex-foundation/umi/serializers';
import { RPC_ENDPOINT } from '../config.js';


export function createUmiFromKeypair(keypair: Keypair): Umi {
  const umi = createUmi(RPC_ENDPOINT);
  const signer = createSignerFromKeypair(umi, fromWeb3JsKeypair(keypair));
  umi.use(signerIdentity(signer));
  return umi;
}

export type { Umi } from '@metaplex-foundation/umi';


export { publicKey } from '@metaplex-foundation/umi';


export function signatureToString(signature: Uint8Array): string {
  return base58.deserialize(signature)[0];
}


export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
