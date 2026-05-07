import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { DEVNET_RPC } from '../utils/constants';
import type { LeaderboardEntry, OwnedNFT } from '../types';

export const connection = new Connection(DEVNET_RPC, 'confirmed');

export async function airdropSOL(pubkey: PublicKey, sol = 1): Promise<string> {
  const sig = await connection.requestAirdrop(pubkey, sol * LAMPORTS_PER_SOL);
  await connection.confirmTransaction(sig, 'confirmed');
  return sig;
}

export function dropStatePDA(
  creator: PublicKey,
  dropId: bigint,
  programId: PublicKey,
): [PublicKey, number] {
  const idBuf = Buffer.alloc(8);
  idBuf.writeBigUInt64LE(dropId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('drop'), creator.toBuffer(), idBuf],
    programId,
  );
}

export function collectorStatePDA(
  wallet: PublicKey,
  programId: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('collector'), wallet.toBuffer()],
    programId,
  );
}

export function leaderboardStatePDA(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('leaderboard')],
    programId,
  );
}

export async function getSOLBalance(pubkey: PublicKey): Promise<number> {
  const lamports = await connection.getBalance(pubkey);
  return lamports / LAMPORTS_PER_SOL;
}

export async function getLeaderboard(
  programId: PublicKey,
): Promise<LeaderboardEntry[]> {
  const [pda] = leaderboardStatePDA(programId);
  const info = await connection.getAccountInfo(pda);
  if (!info) return [];
  // Skip 8-byte discriminator + 4-byte vec length header
  const data = info.data.slice(12);
  const entries: LeaderboardEntry[] = [];
  const ENTRY_SIZE = 40; // 32 pubkey + 4 claims + 4 streak
  for (let i = 0; i < 10 && i * ENTRY_SIZE < data.length; i++) {
    const off = i * ENTRY_SIZE;
    const walletBytes = data.slice(off, off + 32);
    const wallet = new PublicKey(walletBytes).toBase58();
    const totalClaims = data.readUInt32LE(off + 32);
    const streak = data.readUInt32LE(off + 36);
    if (totalClaims === 0) break;
    entries.push({ wallet, totalClaims, streak, rank: i + 1 });
  }
  return entries;
}

// Local store for demo — in production this would be indexed from chain events
const _ownedNFTs: OwnedNFT[] = [];

export function addOwnedNFT(nft: OwnedNFT): void {
  _ownedNFTs.push(nft);
}

export function getOwnedNFTs(): OwnedNFT[] {
  return [..._ownedNFTs];
}
