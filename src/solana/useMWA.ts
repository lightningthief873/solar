import { useCallback, useRef, useState } from 'react';
import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';
import { connection } from './rpc';

export interface WalletState {
  publicKey: PublicKey | null;
  isConnected: boolean;
  isConnecting: boolean;
  isDemoMode: boolean;
}

const APP_IDENTITY = {
  name: 'SolAR',
  uri: 'https://solar.app',
  icon: 'favicon.ico',
};

export function useMWA() {
  const [wallet, setWallet] = useState<WalletState>({
    publicKey: null,
    isConnected: false,
    isConnecting: false,
    isDemoMode: false,
  });
  const demoKeypair = useRef<Keypair | null>(null);

  const connect = useCallback(async () => {
    setWallet(w => ({ ...w, isConnecting: true }));
    try {
      await transact(async (mobileWallet: Web3MobileWallet) => {
        const { accounts } = await mobileWallet.authorize({
          cluster: 'testnet',
          identity: APP_IDENTITY,
        });
        const pubkey = new PublicKey(accounts[0].address);
        setWallet({ publicKey: pubkey, isConnected: true, isConnecting: false, isDemoMode: false });
      });
    } catch {
      // No compatible wallet app installed — fall back to a local demo keypair
      if (!demoKeypair.current) {
        demoKeypair.current = Keypair.generate();
      }
      setWallet({
        publicKey: demoKeypair.current.publicKey,
        isConnected: true,
        isConnecting: false,
        isDemoMode: true,
      });
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (!wallet.isDemoMode) {
      try {
        await transact(async (mobileWallet: Web3MobileWallet) => {
          await mobileWallet.deauthorize({ auth_token: '' });
        });
      } catch { /* ignore */ }
    }
    setWallet({ publicKey: null, isConnected: false, isConnecting: false, isDemoMode: false });
  }, [wallet.isDemoMode]);

  const signAndSend = useCallback(
    async (tx: Transaction | VersionedTransaction): Promise<string> => {
      if (demoKeypair.current) {
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        if (tx instanceof Transaction) {
          tx.recentBlockhash = blockhash;
          tx.feePayer = demoKeypair.current.publicKey;
          tx.sign(demoKeypair.current);
          try {
            const sig = await connection.sendRawTransaction(tx.serialize());
            await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
            return sig;
          } catch {
            return 'demo-' + Date.now().toString(16);
          }
        }
        return 'demo-' + Date.now().toString(16);
      }

      return transact(async (mobileWallet: Web3MobileWallet) => {
        const { accounts } = await mobileWallet.authorize({
          cluster: 'testnet',
          identity: APP_IDENTITY,
        });
        const pubkey = new PublicKey(accounts[0].address);
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        let signed: (Transaction | VersionedTransaction)[];
        if (tx instanceof Transaction) {
          tx.recentBlockhash = blockhash;
          tx.feePayer = pubkey;
          signed = await mobileWallet.signTransactions({ transactions: [tx] });
        } else {
          signed = await mobileWallet.signTransactions({ transactions: [tx] });
        }
        const sig = await connection.sendRawTransaction((signed[0] as Transaction).serialize());
        await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
        return sig;
      });
    },
    [],
  );

  return { wallet, connect, disconnect, signAndSend };
}
