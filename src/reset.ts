import { saveState, loadState } from './state.js';

const prev = loadState();
saveState({
  splMintAddress: undefined,
  splMintSignature: undefined,
  splTransferSignature: undefined,
  recipient: undefined,
  nftAssetAddress: undefined,
  nftCreationSignature: undefined,
  nftUpdateSignature: undefined,
});
console.log('Cleared saved state (outputs/state.json). Next run creates fresh resources.');
console.log('previous state:', JSON.stringify(prev));
