import { describe, it, expect } from 'vitest';
import { Keypair } from '@solana/web3.js';
import { createConnection, loadKeypair, INITIAL_SUPPLY, TRANSFER_AMOUNT } from '../src/config.js';
import { createSplMint } from '../src/spl/mint.js';
import { transferSpl } from '../src/spl/transfer.js';
import { getAccount, getMint } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';


describe('SPL Token (Devnet integration)', () => {
  const connection = createConnection();
  const payer = loadKeypair();

  it('creates a new SPL mint and mints the initial supply to the wallet', async () => {
    const result = await createSplMint(connection, payer);
    const mint = await getMint(connection, new PublicKey(result.mintAddress), 'confirmed');

    expect(result.mintAddress).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
    expect(result.mintSignature).toMatch(/^[1-9A-HJ-NP-Za-km-z]{64,88}$/);
    expect(mint.decimals).toBe(6);
    expect(mint.supply.toString()).toBe(INITIAL_SUPPLY.toString());

    const ownerAta = await getAccount(connection, new PublicKey(result.ownerTokenAccount), 'confirmed');
    expect(ownerAta.amount.toString()).toBe(INITIAL_SUPPLY.toString());
  });

  it('transfers tokens and verifies both balances change by exactly the amount', async () => {
    const mintResult = await createSplMint(connection, payer);
    const recipient = Keypair.generate();

    const result = await transferSpl(connection, mintResult.mintAddress, recipient.publicKey.toBase58(), payer);

    expect(result.transferSignature).toMatch(/^[1-9A-HJ-NP-Za-km-z]{64,88}$/);
    expect(BigInt(result.recipientAfter)).toBe(BigInt(result.recipientBefore) + BigInt(TRANSFER_AMOUNT));
    expect(BigInt(result.senderAfter)).toBe(BigInt(result.senderBefore) - BigInt(TRANSFER_AMOUNT));

    const recipientAta = await getAccount(connection, new PublicKey(result.recipientTokenAccount), 'confirmed');
    expect(recipientAta.amount.toString()).toBe(TRANSFER_AMOUNT.toString());
  }, 120_000);
}, 120_000);
