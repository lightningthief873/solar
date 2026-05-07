import type { Drop } from '../types';

const BASE_LAT = 18.5204;
const BASE_LNG = 73.8567;

// Drops seeded ~10–25m from base coordinate for demo
export const SEED_DROPS: Drop[] = [
  {
    id: 'drop-1',
    lat: BASE_LAT + 0.00009, // ~10m north
    lng: BASE_LNG,
    name: 'Common Stone',
    rarity: 'common',
    priceSOL: 0,
    expiresAt: null,
    mode: 'tourism',
    claimRadius: 15,
    isClaimed: false,
  },
  {
    id: 'drop-2',
    lat: BASE_LAT,
    lng: BASE_LNG + 0.00012, // ~13m east
    name: 'Rare Crystal',
    rarity: 'rare',
    priceSOL: 0.1,
    expiresAt: null,
    mode: 'tourism',
    claimRadius: 10,
    isClaimed: false,
  },
  {
    id: 'drop-3',
    lat: BASE_LAT - 0.00009, // ~10m south
    lng: BASE_LNG + 0.00009,
    name: 'Legendary Orb',
    rarity: 'legendary',
    priceSOL: 0.5,
    expiresAt: null,
    mode: 'tourism',
    claimRadius: 7,
    isClaimed: false,
  },
  {
    id: 'drop-4',
    lat: BASE_LAT + 0.00018, // ~20m northwest
    lng: BASE_LNG - 0.00009,
    name: 'Mythic Shard',
    rarity: 'mythic',
    priceSOL: 1.0,
    expiresAt: null,
    mode: 'tourism',
    claimRadius: 5,
    isClaimed: false,
  },
  {
    id: 'drop-5',
    lat: BASE_LAT - 0.00015, // ~17m southwest
    lng: BASE_LNG - 0.00015,
    name: 'Event Token',
    rarity: 'common',
    priceSOL: 0,
    expiresAt: Date.now() + 48 * 60 * 60 * 1000,
    mode: 'event',
    claimRadius: 15,
    isClaimed: false,
  },
];
