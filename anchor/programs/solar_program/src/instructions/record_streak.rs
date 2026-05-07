use anchor_lang::prelude::*;
use crate::constants::STREAK_WINDOW_SECS;
use crate::state::{CollectorState, LeaderboardEntry, LeaderboardState};

#[derive(Accounts)]
pub struct RecordStreak<'info> {
    #[account(
        init_if_needed,
        payer = collector,
        space = CollectorState::SIZE,
        seeds = [b"collector", collector.key().as_ref()],
        bump,
    )]
    pub collector_state: Account<'info, CollectorState>,

    #[account(
        init_if_needed,
        payer = collector,
        space = LeaderboardState::SIZE,
        seeds = [b"leaderboard"],
        bump,
    )]
    pub leaderboard_state: Account<'info, LeaderboardState>,

    #[account(mut)]
    pub collector: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub(crate) fn handler(ctx: Context<RecordStreak>) -> Result<()> {
    let clock = Clock::get()?;

    let coll = &mut ctx.accounts.collector_state;
    if coll.wallet == Pubkey::default() {
        coll.wallet = ctx.accounts.collector.key();
        coll.bump = ctx.bumps.collector_state;
    }

    let elapsed = clock.unix_timestamp - coll.last_claim_ts;
    if coll.last_claim_ts == 0 || elapsed <= STREAK_WINDOW_SECS {
        coll.streak_count += 1;
    } else {
        coll.streak_count = 1;
    }
    if coll.streak_count > coll.longest_streak {
        coll.longest_streak = coll.streak_count;
    }
    coll.last_claim_ts = clock.unix_timestamp;

    let wallet = coll.wallet;
    let claims = coll.total_claims;
    let streak = coll.streak_count;

    let lb = &mut ctx.accounts.leaderboard_state;
    if lb.bump == 0 {
        lb.bump = ctx.bumps.leaderboard_state;
    }

    if let Some(e) = lb.entries.iter_mut().find(|e| e.wallet == wallet) {
        e.total_claims = claims;
        e.streak = streak;
    } else if lb.entries.len() < LeaderboardState::MAX_ENTRIES {
        lb.entries.push(LeaderboardEntry { wallet, total_claims: claims, streak });
    } else if let Some(min) = lb.entries.iter_mut().min_by_key(|e| e.total_claims) {
        if claims > min.total_claims {
            *min = LeaderboardEntry { wallet, total_claims: claims, streak };
        }
    }
    lb.entries.sort_by(|a, b| b.total_claims.cmp(&a.total_claims));

    msg!("Streak for {}: {} (longest: {})", wallet, streak, coll.longest_streak);
    Ok(())
}
