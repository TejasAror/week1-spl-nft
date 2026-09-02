import { describe, it, expect } from 'vitest';
import { loadKeypair, NFT_NAME, NFT_UPDATED_NAME, NFT_METADATA_URI, NFT_UPDATED_METADATA_URI } from '../src/config.js';
import { createUmiFromKeypair } from '../src/nft/umi.js';
import { mintCoreNft } from '../src/nft/mint.js';
import { updateCoreNft } from '../src/nft/update.js';
import { fetchAsset } from '@metaplex-foundation/mpl-core';
import { publicKey } from '@metaplex-foundation/umi';


describe('MPL Core NFT (Devnet integration)', () => {
  const payer = loadKeypair();

  it('mints an MPL Core NFT with the expected initial name', async () => {
    const result = await mintCoreNft(payer);

    expect(result.assetAddress).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
    expect(result.creationSignature).toMatch(/^[1-9A-HJ-NP-Za-km-z]{64,88}$/);
    expect(result.name).toBe(NFT_NAME);

    const umi = createUmiFromKeypair(payer);
    const asset = await fetchAsset(umi, publicKey(result.assetAddress), { skipDerivePlugins: true });
    expect(asset.name).toBe(NFT_NAME);
    expect(asset.uri).toBe(NFT_METADATA_URI);
    expect(asset.owner).toBe(payer.publicKey.toBase58());
  });

  it('updates the NFT name and metadata URI and verifies the change on-chain', async () => {
    const minted = await mintCoreNft(payer);

    const result = await updateCoreNft(minted.assetAddress, payer);

    expect(result.newName).toBe(NFT_UPDATED_NAME);
    expect(result.newUri).toBe(NFT_UPDATED_METADATA_URI);
    expect(result.updateSignature).toMatch(/^[1-9A-HJ-NP-Za-km-z]{64,88}$/);

    const umi = createUmiFromKeypair(payer);
    const asset = await fetchAsset(umi, publicKey(minted.assetAddress), { skipDerivePlugins: true });
    expect(asset.name).toBe(NFT_UPDATED_NAME);
    expect(asset.uri).toBe(NFT_UPDATED_METADATA_URI);
  }, 120_000);
}, 120_000);
