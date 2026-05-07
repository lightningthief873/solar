import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, Idl, BN } from '@coral-xyz/anchor';
import { useMWA, WalletState } from '../solana/useMWA';
import { connection, dropStatePDA, collectorStatePDA } from '../solana/rpc';
import { mintDropCNFT } from '../solana/mintCNFT';
import { Rarity } from '../types';

const PROGRAM_ID = new PublicKey('EXNrAhbDZgXchu6D8i1Gup47qgKkMkTuC6FR6ehZqkQ7');

// IDL loaded lazily after anchor build
let cachedIdl: Idl | null = null;
async function loadIdl(): Promise<Idl> {
  if (cachedIdl) return cachedIdl;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  cachedIdl = require('../solana/idl/solar_program.json') as Idl;
  return cachedIdl;
}

export interface CollectorStats {
  totalClaims: number;
  streakCount: number;
  longestStreak: number;
}

interface WalletCtx {
  wallet: WalletState;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  claimDrop: (params: ClaimParams) => Promise<string>;
  plantDrop: (params: PlantParams) => Promise<string>;
  refreshStats: () => Promise<void>;
  stats: CollectorStats | null;
}

interface ClaimParams {
  dropId: bigint;
  creator: PublicKey;
  userLat: number;
  userLng: number;
  rarity: Rarity;
}

interface PlantParams {
  dropId: bigint;
  lat: number;
  lng: number;
  rarity: number;
  mode: number;
  priceLamports: bigint;
  expiryTs: bigint;
}

const WalletContext = createContext<WalletCtx | null>(null);

function makeAnchorWallet(
  publicKey: PublicKey,
  signAndSend: (tx: Transaction) => Promise<string>,
) {
  return {
    publicKey,
    signTransaction: async (tx: Transaction) => {
      await signAndSend(tx);
      return tx;
    },
    signAllTransactions: async (txs: Transaction[]) => {
      for (const tx of txs) await signAndSend(tx);
      return txs;
    },
  };
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { wallet, connect, disconnect, signAndSend } = useMWA();
  const [stats, setStats] = useState<CollectorStats | null>(null);

  const getProgram = useCallback(async (): Promise<Program> => {
    if (!wallet.publicKey) throw new Error('Wallet not connected');
    const idl = await loadIdl();
    const anchorWallet = makeAnchorWallet(wallet.publicKey, signAndSend as (tx: Transaction) => Promise<string>);
    const provider = new AnchorProvider(connection, anchorWallet as any, {
      commitment: 'confirmed',
    });
    return new Program(idl, provider);
  }, [wallet.publicKey, signAndSend]);

  const claimDrop = useCallback(
    async ({ dropId, creator, userLat, userLng, rarity }: ClaimParams): Promise<string> => {
      const program = await getProgram();
      const pubkey = wallet.publicKey!;
      const [dropPDA] = dropStatePDA(creator, dropId, PROGRAM_ID);
      const [collectorPDA] = collectorStatePDA(pubkey, PROGRAM_ID);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sig = await (program.methods as any)
        .claimDrop(
          new BN(dropId.toString()),
          new BN(Math.round(userLat * 1e7)),
          new BN(Math.round(userLng * 1e7)),
        )
        .accounts({
          dropState: dropPDA,
          collectorState: collectorPDA,
          creator,
          claimer: pubkey,
        })
        .rpc() as string;

      // Off-chain cNFT mint after on-chain claim confirms
      // payerKeypair would come from a server signer in production;
      // for hackathon demo we skip actual mint and log intent
      console.log(`[mintCNFT] would mint ${rarity} cNFT for drop ${dropId} to ${pubkey.toBase58()}`);

      return sig as string;
    },
    [getProgram, wallet.publicKey],
  );

  const plantDrop = useCallback(
    async ({ dropId, lat, lng, rarity, mode, priceLamports, expiryTs }: PlantParams): Promise<string> => {
      const program = await getProgram();
      const pubkey = wallet.publicKey!;
      const [dropPDA] = dropStatePDA(pubkey, dropId, PROGRAM_ID);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sig = await (program.methods as any)
        .plantDrop(
          new BN(dropId.toString()),
          new BN(Math.round(lat * 1e7)),
          new BN(Math.round(lng * 1e7)),
          rarity,
          mode,
          new BN(priceLamports.toString()),
          new BN(expiryTs.toString()),
        )
        .accounts({ dropState: dropPDA, creator: pubkey })
        .rpc() as string;

      return sig as string;
    },
    [getProgram, wallet.publicKey],
  );

  const refreshStats = useCallback(async () => {
    if (!wallet.publicKey) return;
    try {
      const program = await getProgram();
      const [collectorPDA] = collectorStatePDA(wallet.publicKey, PROGRAM_ID);
      // @ts-ignore
      const account = await program.account.collectorState.fetch(collectorPDA);
      setStats({
        totalClaims: account.totalClaims as number,
        streakCount: account.streakCount as number,
        longestStreak: account.longestStreak as number,
      });
    } catch {
      setStats(null);
    }
  }, [wallet.publicKey, getProgram]);

  useEffect(() => {
    if (wallet.isConnected) refreshStats();
  }, [wallet.isConnected, refreshStats]);

  return (
    <WalletContext.Provider value={{ wallet, connect, disconnect, claimDrop, plantDrop, refreshStats, stats }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletCtx {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
}
