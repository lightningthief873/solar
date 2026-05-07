use anchor_lang::prelude::*;
use crate::error::SolARError;
use crate::state::DropState;

#[derive(Accounts)]
#[instruction(drop_id: u64)]
pub struct ExpireDrop<'info> {
    #[account(
        mut,
        close = creator,
        has_one = creator,
        seeds = [b"drop", creator.key().as_ref(), &drop_id.to_le_bytes()],
        bump = drop_state.bump,
    )]
    pub drop_state: Account<'info, DropState>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub(crate) fn handler(ctx: Context<ExpireDrop>, drop_id: u64) -> Result<()> {
    let drop = &ctx.accounts.drop_state;
    require!(!drop.is_claimed, SolARError::AlreadyClaimed);

    if drop.expiry_ts > 0 {
        let clock = Clock::get()?;
        require!(clock.unix_timestamp > drop.expiry_ts, SolARError::NotYetExpired);
    }

    msg!("Drop {} expired — rent returned to creator {}", drop_id, ctx.accounts.creator.key());
    // `close = creator` transfers all lamports to creator after this handler
    Ok(())
}
