use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::constants::claim_radius_e7;
use crate::error::SolARError;
use crate::state::{CollectorState, DropState};

#[derive(Accounts)]
#[instruction(drop_id: u64)]
pub struct ClaimDrop<'info> {
    #[account(
        mut,
        seeds = [b"drop", drop_state.creator.as_ref(), &drop_id.to_le_bytes()],
        bump = drop_state.bump,
    )]
    pub drop_state: Account<'info, DropState>,

    #[account(
        init_if_needed,
        payer = claimer,
        space = CollectorState::SIZE,
        seeds = [b"collector", claimer.key().as_ref()],
        bump,
    )]
    pub collector_state: Account<'info, CollectorState>,

    /// CHECK: receives price_lamports from claimer
    #[account(mut, address = drop_state.creator)]
    pub creator: UncheckedAccount<'info>,

    #[account(mut)]
    pub claimer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub(crate) fn handler(
    ctx: Context<ClaimDrop>,
    drop_id: u64,
    user_lat_e7: i64,
    user_lng_e7: i64,
) -> Result<()> {
    let drop = &ctx.accounts.drop_state;
    require!(!drop.is_claimed, SolARError::AlreadyClaimed);
    require!(!drop.is_expired, SolARError::DropExpired);

    if drop.expiry_ts > 0 {
        let clock = Clock::get()?;
        require!(clock.unix_timestamp <= drop.expiry_ts, SolARError::DropExpired);
    }

    let dlat = (user_lat_e7 - drop.lat_e7).abs();
    let dlng = (user_lng_e7 - drop.lng_e7).abs();
    let radius = claim_radius_e7(drop.rarity);
    require!(dlat <= radius && dlng <= radius, SolARError::TooFarFromDrop);

    let price = drop.price_lamports;
    let drop_mut = &mut ctx.accounts.drop_state;
    drop_mut.is_claimed = true;

    // Claimer pays creator
    if price > 0 {
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.key(),
                system_program::Transfer {
                    from: ctx.accounts.claimer.to_account_info(),
                    to: ctx.accounts.creator.to_account_info(),
                },
            ),
            price,
        )?;
    }

    let collector = &mut ctx.accounts.collector_state;
    if collector.wallet == Pubkey::default() {
        collector.wallet = ctx.accounts.claimer.key();
        collector.bump = ctx.bumps.collector_state;
    }
    collector.total_claims += 1;

    msg!("Drop {} claimed by {} (id={})", drop_id, ctx.accounts.claimer.key(), drop_id);
    // cNFT mint triggered off-chain via UMI after this instruction confirms
    Ok(())
}
