use anchor_lang::prelude::*;

#[account]
pub struct DropState {
    pub creator: Pubkey,       // 32
    pub drop_id: u64,          // 8
    pub lat_e7: i64,           // 8  latitude  * 1e7
    pub lng_e7: i64,           // 8  longitude * 1e7
    pub rarity: u8,            // 1  0=Common 1=Rare 2=Legendary 3=Mythic
    pub mode: u8,              // 1  0=Tourism 1=Event
    pub price_lamports: u64,   // 8  0 = free claim
    pub expiry_ts: i64,        // 8  unix ts; 0 = no expiry
    pub is_claimed: bool,      // 1
    pub is_expired: bool,      // 1
    pub bump: u8,              // 1
}

impl DropState {
    pub const SIZE: usize = 8 + 32 + 8 + 8 + 8 + 1 + 1 + 8 + 8 + 1 + 1 + 1; // 85
}

#[account]
pub struct CollectorState {
    pub wallet: Pubkey,        // 32
    pub total_claims: u32,     // 4
    pub streak_count: u32,     // 4
    pub longest_streak: u32,   // 4
    pub last_claim_ts: i64,    // 8
    pub bump: u8,              // 1
}

impl CollectorState {
    pub const SIZE: usize = 8 + 32 + 4 + 4 + 4 + 8 + 1; // 61
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct LeaderboardEntry {
    pub wallet: Pubkey,        // 32
    pub total_claims: u32,     // 4
    pub streak: u32,           // 4
}                              // 40 bytes

#[account]
pub struct LeaderboardState {
    pub entries: Vec<LeaderboardEntry>, // 4 + 10*40 = 404
    pub bump: u8,                       // 1
}

impl LeaderboardState {
    pub const MAX_ENTRIES: usize = 10;
    pub const SIZE: usize = 8 + 4 + Self::MAX_ENTRIES * 40 + 1; // 413
}
