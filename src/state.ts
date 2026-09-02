import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export interface RunState {
  splMintAddress?: string;
  splMintSignature?: string;
  splTransferSignature?: string;
  recipient?: string;
  nftAssetAddress?: string;
  nftCreationSignature?: string;
  nftUpdateSignature?: string;
}

const STATE_FILE = join(process.cwd(), 'outputs', 'state.json');

export function loadState(): RunState {
  if (!existsSync(STATE_FILE)) return {};
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8')) as RunState;
  } catch {
    return {};
  }
}

export function saveState(patch: Partial<RunState>): RunState {
  const next = { ...loadState(), ...patch };
  mkdirSync(join(process.cwd(), 'outputs'), { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(next, null, 2));
  return next;
}

export function resetOutputs(): void {
  writeFileSync(STATE_FILE, '{}');
}
