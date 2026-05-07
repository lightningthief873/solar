import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { DEVNET_RPC } from '../utils/constants';

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
