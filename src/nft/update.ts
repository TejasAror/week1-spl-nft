import { Keypair } from '@solana/web3.js';
import { update, fetchAsset } from '@metaplex-foundation/mpl-core';
import { publicKey } from '@metaplex-foundation/umi';
import { createUmiFromKeypair, signatureToString, sleep } from './umi.js';
import {
  NFT_UPDATED_NAME,
  NFT_UPDATED_METADATA_URI,
  checkWallet,
  isValidPublicKey,
} from '../config.js';

export interface NftUpdateResult {
  assetAddress: string;
  updateSignature: string;
  newName: string;
  newUri: string;
}

/**
 * Updates the name and metadata URI of an existing MPL Core asset. The wallet
 * must be the asset's update authority for this to succeed.
 */
export async function updateCoreNft(
  assetAddressRaw: string,
  signerOverride?: Keypair,
  opts?: { name?: string; uri?: string }
): Promise<NftUpdateResult> {
  if (!isValidPublicKey(assetAddressRaw)) {
    throw new Error(`Invalid asset address: "${assetAddressRaw}"`);
  }

  const { keypair } = checkWallet(signerOverride);
  const umi = createUmiFromKeypair(keypair);
  const assetAddress = publicKey(assetAddressRaw);

  const asset = await fetchAsset(umi, assetAddress, { skipDerivePlugins: true });

  const newName = opts?.name ?? NFT_UPDATED_NAME;
  const newUri = opts?.uri ?? NFT_UPDATED_METADATA_URI;

  console.log(`Updating MPL Core asset ${assetAddress} ...`);
  console.log(`  old name: ${asset.name}`);
  console.log(`  old uri:  ${asset.uri}`);
  console.log(`  new name: ${newName}`);
  console.log(`  new uri:  ${newUri}`);

  const updateBuilder = update(umi, {
    asset: {
      publicKey: asset.publicKey,
      owner: asset.owner,
    },
    name: newName,
    uri: newUri,
  });

  const { signature } = await updateBuilder.sendAndConfirm(umi, {
    confirm: { commitment: 'confirmed' },
  });
  const updateSignature = signatureToString(signature);
  console.log(`NFT update transaction: ${updateSignature}\n`);

  let updated = await fetchAsset(umi, assetAddress, { skipDerivePlugins: true });
  let fetchedFresh = false;
  for (let attempt = 0; attempt < 8; attempt++) {
    updated = await fetchAsset(umi, assetAddress, { skipDerivePlugins: true });
    if (updated.name === newName && updated.uri === newUri) {
      fetchedFresh = true;
      break;
    }
    await sleep(1000);
  }
  if (!fetchedFresh) {
    throw new Error(
      `Update verification failed after retries: expected "${newName}" / "${newUri}" ` +
      `but found "${updated.name}" / "${updated.uri}".`
    );
  }

  return {
    assetAddress: updated.publicKey,
    updateSignature,
    newName: updated.name,
    newUri: updated.uri,
  };
}
