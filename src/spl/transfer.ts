import {
  Connection,
  Keypair,
  PublicKey,
} from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
  transfer,
  getAccount,
} from '@solana/spl-token';
import {
  TRANSFER_AMOUNT,
  checkWallet,
  isValidPublicKey,
} from '../config.js';

export interface TransferResult {
  senderTokenAccount: string;
  recipientTokenAccount: string;
  transferSignature: string;
  senderBefore: string;
  senderAfter: string;
  recipientBefore: string;
  recipientAfter: string;
}

/**
 * Transfers TRANSFER_AMOUNT (base units) of the given SPL mint from the wallet
 * to a recipient. Creates an associated token account for the recipient if it
 * does not yet exist. Balances are fetched before and after for verification.
 */
export async function transferSpl(
  connection: Connection,
  mintAddress: string,
  recipientRaw: string,
  signerOverride?: Keypair
): Promise<TransferResult> {
  if (!isValidPublicKey(mintAddress)) {
    throw new Error(`Invalid mint address: "${mintAddress}"`);
  }
  if (!isValidPublicKey(recipientRaw)) {
    throw new Error(`Invalid recipient address: "${recipientRaw}"`);
  }

  const { keypair } = checkWallet(signerOverride);
  const sender = keypair.publicKey;
  const recipient = new PublicKey(recipientRaw);
  const mint = new PublicKey(mintAddress);

  const senderAta = await getOrCreateAssociatedTokenAccount(
    connection, keypair, mint, sender, false, 'confirmed'
  );
  const recipientAta = await getOrCreateAssociatedTokenAccount(
    connection, keypair, mint, recipient, false, 'confirmed'
  );

  const senderBefore = await getAccount(connection, senderAta.address, 'confirmed');
  const recipientBefore = await getAccount(connection, recipientAta.address, 'confirmed');

  console.log(`Sender before:   ${senderBefore.amount}  (${senderBefore.amount.toString()})`);
  console.log(`Recipient before:${recipientBefore.amount}  (${recipientBefore.amount.toString()})`);

  console.log(`Transferring ${TRANSFER_AMOUNT} base units -> ${recipient.toBase58()} ...`);
  const transferSignature = await transfer(
    connection,
    keypair,
    senderAta.address,
    recipientAta.address,
    sender,
    TRANSFER_AMOUNT,
    [],
    { commitment: 'confirmed' }
  );
  await connection.confirmTransaction(transferSignature, 'confirmed');
  console.log(`Transfer transaction: ${transferSignature}\n`);

  const senderAfter = await getAccount(connection, senderAta.address, 'confirmed');
  const recipientAfter = await getAccount(connection, recipientAta.address, 'confirmed');

  console.log(`Sender after:    ${senderAfter.amount}`);
  console.log(`Recipient after: ${recipientAfter.amount}`);

  if (recipientAfter.amount !== recipientBefore.amount + BigInt(TRANSFER_AMOUNT)) {
    throw new Error(
      `Transfer verification failed: recipient balance did not increase by exactly ${TRANSFER_AMOUNT}.`
    );
  }
  if (senderAfter.amount !== senderBefore.amount - BigInt(TRANSFER_AMOUNT)) {
    throw new Error(
      `Transfer verification failed: sender balance did not decrease by exactly ${TRANSFER_AMOUNT}.`
    );
  }

  return {
    senderTokenAccount: senderAta.address.toBase58(),
    recipientTokenAccount: recipientAta.address.toBase58(),
    transferSignature,
    senderBefore: senderBefore.amount.toString(),
    senderAfter: senderAfter.amount.toString(),
    recipientBefore: recipientBefore.amount.toString(),
    recipientAfter: recipientAfter.amount.toString(),
  };
}
