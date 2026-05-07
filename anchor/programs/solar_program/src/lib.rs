pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use error::SolARError;
pub use instructions::*;
pub use state::*;

declare_id!("EXNrAhbDZgXchu6D8i1Gup47qgKkMkTuC6FR6ehZqkQ7");

#[program]
pub mod solar_program {
    use super::*;

    pub fn plant_drop(
        ctx: Context<PlantDrop>,
        drop_id: u64,
        lat_e7: i64,
        lng_e7: i64,
        rarity: u8,
        mode: u8,
        price_lamports: u64,
        expiry_ts: i64,
    ) -> Result<()> {
        instructions::plant_drop::handler(ctx, drop_id, lat_e7, lng_e7, rarity, mode, price_lamports, expiry_ts)
    }

    pub fn claim_drop(
        ctx: Context<ClaimDrop>,
        drop_id: u64,
        user_lat_e7: i64,
        user_lng_e7: i64,
    ) -> Result<()> {
        instructions::claim_drop::handler(ctx, drop_id, user_lat_e7, user_lng_e7)
    }

    pub fn expire_drop(ctx: Context<ExpireDrop>, drop_id: u64) -> Result<()> {
        instructions::expire_drop::handler(ctx, drop_id)
    }

    pub fn record_streak(ctx: Context<RecordStreak>) -> Result<()> {
        instructions::record_streak::handler(ctx)
    }
}
