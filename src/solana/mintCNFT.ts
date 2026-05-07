import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  generateSigner,
  publicKey as umiPubkey,
  keypairIdentity,
  none,
  some,
} from '@metaplex-foundation/umi';
import {
  mintV1,
  mplBubblegum,
  createTree,
  fetchTreeConfigFromSeeds,
} from '@metaplex-foundation/mpl-bubblegum';
import { PublicKey } from '@solana/web3.js';
import { DEVNET_RPC } from '../utils/constants';
import { Rarity } from '../types';

const RARITY_SYMBOL: Record<Rarity, string> = {
  common: 'SOLAR-C',
  rare: 'SOLAR-R',
  legendary: 'SOLAR-L',
  mythic: 'SOLAR-M',
};

// Shared merkle tree address (created once by seedDrops.ts)
// Populated after createMerkleTree() is called
let merkleTreeAddress: string | null = null;

export function setMerkleTree(address: string) {
  merkleTreeAddress = address;
}

export async function createMerkleTree(payerKeypair: Uint8Array): Promise<string> {
  const umi = createUmi(DEVNET_RPC).use(mplBubblegum());
  const payer = umi.eddsa.createKeypairFromSecretKey(payerKeypair);
  umi.use(keypairIdentity(payer));

  const treeKeypair = generateSigner(umi);
  const builder = createTree(umi, {
    merkleTree: treeKeypair,
    maxDepth: 14,    // up to 16,384 leaves
    maxBufferSize: 64,
  });
  await (await builder).sendAndConfirm(umi);

  merkleTreeAddress = treeKeypair.publicKey;
  return merkleTreeAddress;
}

export interface MintCNFTParams {
  payerKeypair: Uint8Array;
  recipientAddress: string;
  dropId: string;
  rarity: Rarity;
  lat: number;
  lng: number;
}

export async function mintDropCNFT({
  payerKeypair,
  recipientAddress,
  dropId,
  rarity,
  lat,
  lng,
}: MintCNFTParams): Promise<string> {
  if (!merkleTreeAddress) {
    throw new Error('Merkle tree not initialized — call createMerkleTree first');
  }

  const umi = createUmi(DEVNET_RPC).use(mplBubblegum());
  const payer = umi.eddsa.createKeypairFromSecretKey(payerKeypair);
  umi.use(keypairIdentity(payer));

  const recipient = umiPubkey(recipientAddress);
  const tree = umiPubkey(merkleTreeAddress);

  const mintBuilder = mintV1(umi, {
    leafOwner: recipient,
    merkleTree: tree,
    metadata: {
      name: `SolAR Drop #${dropId}`,
      symbol: RARITY_SYMBOL[rarity],
      uri: `https://solar.app/drops/${dropId}.json`,
      sellerFeeBasisPoints: 500, // 5%
      collection: none(),
      creators: [{ address: payer.publicKey, verified: false, share: 100 }],
      uses: none(),
    },
  });
  const { signature } = await (await mintBuilder).sendAndConfirm(umi);

  return Buffer.from(signature).toString('base64');
}
