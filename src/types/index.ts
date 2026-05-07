export type Rarity = 'common' | 'rare' | 'legendary' | 'mythic';
export type DropMode = 'tourism' | 'event';

export type ArtStyle = 'cosmic' | 'neon' | 'gold' | 'storm' | 'phoenix' | 'default';

export interface Drop {
  id: string;
  lat: number;
  lng: number;
  name: string;
  rarity: Rarity;
  priceSOL: number;
  expiresAt: number | null;
  mode: DropMode;
  claimRadius: number;
  isClaimed: boolean;
  creator?: string;
  description?: string;
  artStyle?: ArtStyle;
  imageUri?: string;
}

export interface OwnedNFT {
  id: string;
  dropId: string;
  name: string;
  rarity: Rarity;
  claimedAt: number;
  lat?: number;
  lng?: number;
  imageUri?: string;
  artStyle?: ArtStyle;
}

export interface LeaderboardEntry {
  wallet: string;
  totalClaims: number;
  streak: number;
  rank: number;
  username?: string;
}

export interface CollectorStats {
  publicKey: string;
  totalClaims: number;
  streakDays: number;
  totalSOLEarned: number;
}

export interface RarityConfig {
  color: string;
  emissiveColor: string;
  glowIntensity: number;
  claimRadius: number;
  particleEffect: string;
}

export interface CollectionSet {
  id: string;
  name: string;
  description: string;
  required: Partial<Record<Rarity, number>>;
  reward: string;
}
