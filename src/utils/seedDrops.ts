import type { Drop } from '../types';

const BASE_LAT = 18.5204;
const BASE_LNG = 73.8567;

// 1 deg lat ≈ 111000m; 1 deg lng at lat 18.52° ≈ 105228m
const M_PER_DEG_LAT = 111000;
const M_PER_DEG_LNG = 105228;

function offset(northM: number, eastM: number): { lat: number; lng: number } {
  return {
    lat: BASE_LAT + northM / M_PER_DEG_LAT,
    lng: BASE_LNG + eastM / M_PER_DEG_LNG,
  };
}

const NOW = Date.now();

export const SEED_DROPS: Drop[] = [
  {
    id: 'drop-1',
    ...offset(10, 0),       // 10m north
    name: 'Ancient Gateway',
    rarity: 'mythic',
    priceSOL: 0,
    expiresAt: null,
    mode: 'tourism',
    claimRadius: 5,
    isClaimed: false,
    description: 'A gateway that has stood for centuries at this very coordinate.',
  },
  {
    id: 'drop-2',
    ...offset(0, 20),       // 20m east
    name: 'Solana Summit Drop',
    rarity: 'legendary',
    priceSOL: 0.05,
    expiresAt: NOW + 48 * 3600000,
    mode: 'event',
    claimRadius: 7,
    isClaimed: false,
  },
  {
    id: 'drop-3',
    ...offset(-10.6, 10.6), // 15m south-east (45° bearing)
    name: 'Hidden Courtyard',
    rarity: 'rare',
    priceSOL: 0,
    expiresAt: null,
    mode: 'tourism',
    claimRadius: 10,
    isClaimed: false,
    description: 'Tucked away from the main street — only the curious find it.',
  },
  {
    id: 'drop-4',
    ...offset(0, -25),      // 25m west
    name: 'Street Corner',
    rarity: 'common',
    priceSOL: 0,
    expiresAt: null,
    mode: 'tourism',
    claimRadius: 15,
    isClaimed: false,
    description: 'The crossroads where old and new Pune meet.',
  },
  {
    id: 'drop-5',
    ...offset(21.2, 21.2),  // 30m north-east (45° bearing)
    name: 'Flash Drop',
    rarity: 'common',
    priceSOL: 0,
    expiresAt: NOW + 24 * 3600000,
    mode: 'event',
    claimRadius: 15,
    isClaimed: false,
  },
];
