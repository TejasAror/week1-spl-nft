import {
  Connection,
  Keypair,
  PublicKey,
} from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
} from '@solana/spl-token';
import {
  TOKEN_DECIMALS,
  INITIAL_SUPPLY,
  checkWallet,
  isValidPublicKey,
} from '../config.js';

export interface MintResult {
  mintAddress: string;
  mintAuthority: string;
  ownerTokenAccount: string;
  mintSignature: string;
  initialBalance: string;
}

/**
 * Creates a brand new SPL token mint and mints INITIAL_SUPPLY of it into the
 * wallet's associated token account. Everything is run against Devnet.
 */
export async function createSplMint(connection: Connection, signerOverride?: Keypair): Promise<MintResult> {
  const { keypair } = checkWallet(signerOverride);
  const payer = keypair.publicKey;

  const mintAuthority = payer;

  console.log('Creating SPL token mint...');
  const mintAddress = await createMint(
    connection,
    keypair,
    mintAuthority,
    null,
    TOKEN_DECIMALS,
    undefined,
    { commitment: 'confirmed' }
  );
  console.log(`Mint created: ${mintAddress.toBase58()}`);

  console.log('Creating associated token account...');
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    keypair,
    mintAddress,
    payer,
    false,
    'confirmed'
  );
  console.log(`Token account: ${ata.address.toBase58()}`);

  console.log(`Minting ${INITIAL_SUPPLY} base units...`);
  const mintSignature = await mintTo(
    connection,
    keypair,
    mintAddress,
    ata.address,
    mintAuthority,
    INITIAL_SUPPLY,
    [],
    { commitment: 'confirmed' }
  );
  await connection.confirmTransaction(mintSignature, 'confirmed');
  console.log(`Mint transaction: ${mintSignature}\n`);

  const accountInfo = await getAccount(connection, ata.address, 'confirmed');
  const initialBalance = accountInfo.amount.toString();

  return {
    mintAddress: mintAddress.toBase58(),
    mintAuthority: mintAuthority.toBase58(),
    ownerTokenAccount: ata.address.toBase58(),
    mintSignature,
    initialBalance,
  };
}

export function validateMintInput(recipient?: string): string {
  if (recipient === undefined || !isValidPublicKey(recipient)) {
    throw new Error(
      `A valid recipient public key is required to transfer. Received: "${recipient ?? ''}"`
    );
  }
  return new PublicKey(recipient).toBase58();
}
