import { useState, useCallback } from 'react';
import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {
  PublicKey,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';
import { connection } from './rpc';

export interface WalletState {
  publicKey: PublicKey | null;
  isConnected: boolean;
  isConnecting: boolean;
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
  });

  const connect = useCallback(async () => {
    setWallet(w => ({ ...w, isConnecting: true }));
    try {
      await transact(async (mobileWallet: Web3MobileWallet) => {
        const { accounts } = await mobileWallet.authorize({
          cluster: 'devnet',
          identity: APP_IDENTITY,
        });
        const pubkey = new PublicKey(accounts[0].address);
        setWallet({ publicKey: pubkey, isConnected: true, isConnecting: false });
      });
    } catch {
      setWallet({ publicKey: null, isConnected: false, isConnecting: false });
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await transact(async (mobileWallet: Web3MobileWallet) => {
        await mobileWallet.deauthorize({ auth_token: '' });
      });
    } finally {
      setWallet({ publicKey: null, isConnected: false, isConnecting: false });
    }
  }, []);

  const signAndSend = useCallback(
    async (tx: Transaction | VersionedTransaction): Promise<string> => {
      return transact(async (mobileWallet: Web3MobileWallet) => {
        const { accounts } = await mobileWallet.authorize({
          cluster: 'devnet',
          identity: APP_IDENTITY,
        });
        const pubkey = new PublicKey(accounts[0].address);

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash();

        let signed: (Transaction | VersionedTransaction)[];
        if (tx instanceof Transaction) {
          tx.recentBlockhash = blockhash;
          tx.feePayer = pubkey;
          signed = await mobileWallet.signTransactions({ transactions: [tx] });
        } else {
          signed = await mobileWallet.signTransactions({ transactions: [tx] });
        }

        const sig = await connection.sendRawTransaction(
          (signed[0] as Transaction).serialize(),
        );
        await connection.confirmTransaction(
          { signature: sig, blockhash, lastValidBlockHeight },
          'confirmed',
        );
        return sig;
      });
    },
    [],
  );

  return { wallet, connect, disconnect, signAndSend };
}
