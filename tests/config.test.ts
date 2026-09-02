import { describe, it, expect } from 'vitest';
import {
  EXPECTED_WALLET,
  TOKEN_NAME,
  TOKEN_SYMBOL,
  TOKEN_DECIMALS,
  INITIAL_SUPPLY,
  TRANSFER_AMOUNT,
  NFT_NAME,
  NFT_UPDATED_NAME,
  NFT_METADATA_URI,
  NFT_UPDATED_METADATA_URI,
  isValidPublicKey,
  loadKeypair,
  NETWORK,
} from '../src/config.js';

describe('config constants', () => {
  it('documents a valid expected wallet address', () => {
    expect(EXPECTED_WALLET).toBe('HNDAhSqXTA6woJLRRQpaMsWX171XVsjgxBXRxz95xfSB');
    expect(isValidPublicKey(EXPECTED_WALLET)).toBe(true);
  });

  it('uses devnet as the configured network', () => {
    expect(NETWORK).toBe('devnet');
  });

  it('defines sensible SPL token details', () => {
    expect(TOKEN_NAME).toBe('Week 1 Builder Token');
    expect(TOKEN_SYMBOL).toBe('W1BT');
    expect(TOKEN_DECIMALS).toBeGreaterThan(0);
    expect(INITIAL_SUPPLY).toBeGreaterThan(0);
    expect(TRANSFER_AMOUNT).toBeGreaterThan(0);
    expect(TRANSFER_AMOUNT).toBeLessThan(INITIAL_SUPPLY);
  });

  it('defines NFT name and metadata URIs, including an updated variant', () => {
    expect(NFT_NAME).toBe('Week 1 Solana NFT');
    expect(NFT_UPDATED_NAME).toContain(NFT_NAME);
    expect(NFT_UPDATED_NAME).not.toBe(NFT_NAME);
    expect(NFT_METADATA_URI).toMatch(/^https?:\/\//);
    expect(NFT_UPDATED_METADATA_URI).not.toBe(NFT_METADATA_URI);
  });
});

describe('public key validation', () => {
  it('accepts valid base58 public keys', () => {
    expect(isValidPublicKey('HNDAhSqXTA6woJLRRQpaMsWX171XVsjgxBXRxz95xfSB')).toBe(true);
  });

  it('rejects invalid and empty inputs', () => {
    expect(isValidPublicKey('')).toBe(false);
    expect(isValidPublicKey(undefined)).toBe(false);
    expect(isValidPublicKey('not-a-valid-base58!!!')).toBe(false);
    expect(isValidPublicKey('HNDAh')).toBe(false);
  });
});

describe('wallet loading', () => {
  it('loads a valid keypair from the local Solana config without exposing its secret', () => {
    const kp = loadKeypair();
    expect(kp.publicKey.toBase58()).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
    // Never assert on the secret; only the public key is used.
  });
});
