use anchor_lang::prelude::*;
use crate::error::SolARError;
use crate::state::DropState;

#[derive(Accounts)]
#[instruction(drop_id: u64)]
pub struct PlantDrop<'info> {
    #[account(
        init,
        payer = creator,
        space = DropState::SIZE,
        seeds = [b"drop", creator.key().as_ref(), &drop_id.to_le_bytes()],
        bump,
    )]
    pub drop_state: Account<'info, DropState>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub(crate) fn handler(
    ctx: Context<PlantDrop>,
    drop_id: u64,
    lat_e7: i64,
    lng_e7: i64,
    rarity: u8,
    mode: u8,
    price_lamports: u64,
    expiry_ts: i64,
) -> Result<()> {
    require!(rarity <= 3, SolARError::InvalidRarity);
    require!(mode <= 1, SolARError::InvalidMode);

    let drop = &mut ctx.accounts.drop_state;
    drop.creator = ctx.accounts.creator.key();
    drop.drop_id = drop_id;
    drop.lat_e7 = lat_e7;
    drop.lng_e7 = lng_e7;
    drop.rarity = rarity;
    drop.mode = mode;
    drop.price_lamports = price_lamports;
    drop.expiry_ts = expiry_ts;
    drop.is_claimed = false;
    drop.is_expired = false;
    drop.bump = ctx.bumps.drop_state;

    msg!("Drop {} planted at ({}, {}) rarity={}", drop_id, lat_e7, lng_e7, rarity);
    Ok(())
}
