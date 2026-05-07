import type { Rarity, RarityConfig } from '../types';

export const RARITY_CONFIG: Record<Rarity, RarityConfig> = {
  common: {
    color: '#4A90E2',
    emissiveColor: '#4A90E2',
    glowIntensity: 0.6,
    claimRadius: 15,
    particleEffect: 'slowPulse',
  },
  rare: {
    color: '#9B59B6',
    emissiveColor: '#9B59B6',
    glowIntensity: 0.8,
    claimRadius: 10,
    particleEffect: 'fastSpin',
  },
  legendary: {
    color: '#F39C12',
    emissiveColor: '#F39C12',
    glowIntensity: 1.0,
    claimRadius: 7,
    particleEffect: 'particleFountain',
  },
  mythic: {
    color: '#FF69B4',
    emissiveColor: '#FF69B4',
    glowIntensity: 1.2,
    claimRadius: 5,
    particleEffect: 'shockwaveRing',
  },
};

export const DEVNET_RPC = 'https://api.testnet.solana.com'; // program deployed on testnet; swap to devnet once funded
export const MAX_RADAR_DISTANCE = 200;
export const CLAIM_COOLDOWN_MS = 3000;
