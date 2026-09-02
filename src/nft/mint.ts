import { Keypair } from '@solana/web3.js';
import { create, fetchAsset } from '@metaplex-foundation/mpl-core';
import { generateSigner, publicKey } from '@metaplex-foundation/umi';
import { createUmiFromKeypair, signatureToString, sleep } from './umi.js';
import {
  NFT_NAME,
  NFT_METADATA_URI,
  NFT_DESCRIPTION,
  NFT_IMAGE_URI,
  checkWallet,
} from '../config.js';

export interface NftMintResult {
  assetAddress: string;
  owner: string;
  creationSignature: string;
  name: string;
  uri: string;
}

/**
 * Mints a single-edition NFT on Devnet using Metaplex MPL Core (AssetV1).
 * The locally-configured wallet is both the payer and the update authority.
 */
export async function mintCoreNft(signerOverride?: Keypair): Promise<NftMintResult> {
  const { keypair } = checkWallet(signerOverride);
  const umi = createUmiFromKeypair(keypair);
  const owner = umi.identity.publicKey;

  console.log('Creating MPL Core asset...');

  const asset = generateSigner(umi);

  const createBuilder = create(umi, {
    asset,
    name: NFT_NAME,
    uri: NFT_METADATA_URI,
    owner: owner,
    updateAuthority: publicKey(umi.identity.publicKey),
    plugins: [
      {
        type: 'Attributes',
        attributeList: [
          { key: 'description', value: NFT_DESCRIPTION },
          { key: 'image', value: NFT_IMAGE_URI },
          { key: 'collection', value: 'Week 1 Builder' },
          { key: 'supply', value: '1/1' },
        ],
      },
    ],
  });

  const { signature } = await createBuilder.sendAndConfirm(umi, {
    confirm: { commitment: 'confirmed' },
  });
  const creationSignature = signatureToString(signature);

  console.log(`NFT creation transaction: ${creationSignature}\n`);

  let assetAccount: Awaited<ReturnType<typeof fetchAsset>> | undefined;
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      assetAccount = await fetchAsset(umi, asset.publicKey, {
        skipDerivePlugins: true,
      });
      break;
    } catch {
      if (attempt === 7) throw new Error('Asset was created but could not be fetched back from Devnet.');
      await sleep(1000);
    }
  }
  if (!assetAccount) {
    throw new Error('Asset was created but could not be fetched back from Devnet.');
  }

  return {
    assetAddress: assetAccount.publicKey,
    owner: assetAccount.owner,
    creationSignature,
    name: assetAccount.name,
    uri: assetAccount.uri,
  };
}
