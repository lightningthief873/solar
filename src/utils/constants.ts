import type { CollectionSet, Rarity, RarityConfig } from '../types';

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

export const COLLECTION_SETS: CollectionSet[] = [
  {
    id: 'city-explorer',
    name: 'City Explorer',
    description: 'Collect 5 common drops across the city',
    required: { common: 5 },
    reward: '🏙️ Urban Pioneer badge',
  },
  {
    id: 'rare-hunter',
    name: 'Rare Hunter',
    description: 'Collect 3 rare drops from hidden spots',
    required: { rare: 3 },
    reward: '💎 Crystal Keeper badge',
  },
  {
    id: 'legend-chaser',
    name: 'Legend Chaser',
    description: 'Collect 1 legendary + 1 mythic drop',
    required: { legendary: 1, mythic: 1 },
    reward: '🌈 Mythic status forever',
  },
];

export const DEVNET_RPC = 'https://api.testnet.solana.com'; // swap to devnet when funded
export const MAX_RADAR_DISTANCE = 200;
export const CLAIM_COOLDOWN_MS = 3000;
export const PROGRAM_ID = 'EXNrAhbDZgXchu6D8i1Gup47qgKkMkTuC6FR6ehZqkQ7';
