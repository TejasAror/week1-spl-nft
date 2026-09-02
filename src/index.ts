import { createConnection, checkWallet, NETWORK } from './config.js';
import { createSplMint } from './spl/mint.js';
import { transferSpl } from './spl/transfer.js';
import { mintCoreNft } from './nft/mint.js';
import { updateCoreNft } from './nft/update.js';
import { loadState, saveState } from './state.js';

const HELP = `
Usage: tsx src/index.ts <command> [args]

Commands:
  token                 Create SPL mint and mint initial supply to wallet
  transfer <recipient>  Transfer a defined amount of SPL token to recipient
  nft                   Mint an MPL Core NFT
  update [asset]        Update the MPL Core NFT name + metadata URI
  status                Print saved addresses/signatures from outputs/state.json
  reset                 Clear saved state (fresh run next time)

Add --fresh to force creating NEW on-chain resources instead of reusing saved ones.
`;

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const fresh = args.includes('--fresh');
  const conn = createConnection();

  const { keypair } = checkWallet();
  const wallet = keypair.publicKey.toBase58();
  const state = loadState();

  function summary() {
    const s = saveState({});
    console.log('\n----------------- Summary -----------------');
    console.log(`Wallet:  ${wallet}`);
    console.log(`Network: ${NETWORK}`);
    console.log(`SPL Token Mint:     ${s.splMintAddress ?? 'not created yet'}`);
    console.log(`SPL Mint Tx:        ${s.splMintSignature ?? '—'}`);
    console.log(`SPL Transfer Tx:    ${s.splTransferSignature ?? '—'}`);
    console.log(`NFT Asset:          ${s.nftAssetAddress ?? 'not created yet'}`);
    console.log(`NFT Creation Tx:    ${s.nftCreationSignature ?? '—'}`);
    console.log(`NFT Update Tx:      ${s.nftUpdateSignature ?? '—'}`);
  }

  if (!command || command === 'help' || command === '--help') {
    console.log(HELP);
    return;
  }

  if (command === 'status') {
    console.log(JSON.stringify(loadState(), null, 2));
    return;
  }

  if (command === 'reset') {
    saveState({ splMintAddress: undefined, splMintSignature: undefined, splTransferSignature: undefined, recipient: undefined, nftAssetAddress: undefined, nftCreationSignature: undefined, nftUpdateSignature: undefined });
    console.log('Cleared saved state (outputs/state.json). Next run creates fresh resources.');
    return;
  }

  if (command === 'token') {
    if (!fresh && state.splMintAddress) {
      console.log(`Reusing existing SPL mint: ${state.splMintAddress} (use --fresh to create a new one)`);
      summary();
      return;
    }
    const result = await createSplMint(conn, keypair);
    saveState({ splMintAddress: result.mintAddress, splMintSignature: result.mintSignature });
    summary();
    return;
  }

  if (command === 'transfer') {
    const recipient = args[1];
    if (!recipient) {
      throw new Error('transfer requires a recipient address: tsx src/index.ts transfer <recipient>');
    }
    if (!fresh && state.splTransferSignature && state.recipient === recipient) {
      console.log(`Reusing existing transfer to ${recipient} (use --fresh to transfer again)`);
      summary();
      return;
    }
    if (!state.splMintAddress) {
      throw new Error('No SPL mint in state. Run `tsx src/index.ts token` first, or mint via npm run mint:token.');
    }
    const result = await transferSpl(conn, state.splMintAddress, recipient, keypair);
    saveState({ splTransferSignature: result.transferSignature, recipient });
    summary();
    return;
  }

  if (command === 'nft') {
    if (!fresh && state.nftAssetAddress) {
      console.log(`Reusing existing NFT: ${state.nftAssetAddress} (use --fresh to mint a new one)`);
      summary();
      return;
    }
    const result = await mintCoreNft(keypair);
    saveState({ nftAssetAddress: result.assetAddress, nftCreationSignature: result.creationSignature });
    summary();
    return;
  }

  if (command === 'update') {
    const asset = args[1] || state.nftAssetAddress;
    if (!asset) {
      throw new Error('No NFT asset in state. Run `tsx src/index.ts nft` first, or pass the asset address.');
    }
    if (!fresh && state.nftUpdateSignature && state.nftAssetAddress === asset) {
      console.log(`Reusing existing NFT update on ${asset} (use --fresh to update again)`);
      summary();
      return;
    }
    const result = await updateCoreNft(asset, keypair);
    saveState({ nftUpdateSignature: result.updateSignature, nftAssetAddress: result.assetAddress });
    summary();
    return;
  }

  if (command === 'all') {
    const recipient = args[1];

    if (fresh || !state.splMintAddress) {
      const r = await createSplMint(conn, keypair);
      saveState({ splMintAddress: r.mintAddress, splMintSignature: r.mintSignature });
    } else {
      console.log(`[token] reusing mint ${state.splMintAddress}`);
    }

    if (recipient) {
      const t = await transferSpl(conn, loadState().splMintAddress!, recipient, keypair);
      saveState({ splTransferSignature: t.transferSignature, recipient });
    } else {
      console.log('[transfer] skipped: pass a recipient via: npm run demo -- <recipient>');
    }

    if (fresh || !state.nftAssetAddress) {
      const n = await mintCoreNft(keypair);
      saveState({ nftAssetAddress: n.assetAddress, nftCreationSignature: n.creationSignature });
    } else {
      console.log(`[nft] reusing NFT ${state.nftAssetAddress}`);
    }

    const u = await updateCoreNft(loadState().nftAssetAddress!, keypair);
    saveState({ nftUpdateSignature: u.updateSignature, nftAssetAddress: u.assetAddress });

    summary();
    return;
  }

  console.error(`Unknown command: "${command}"`);
  console.log(HELP);
  process.exitCode = 1;
}

main().catch((err) => {
  console.error('\nERROR:', err instanceof Error ? err.message : err);
  process.exit(1);
});
