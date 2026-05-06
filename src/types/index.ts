export type Rarity = 'common' | 'rare' | 'legendary' | 'mythic';
export type DropMode = 'tourism' | 'event';

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
