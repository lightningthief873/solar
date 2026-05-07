use anchor_lang::prelude::*;

#[error_code]
pub enum SolARError {
    #[msg("Too far from drop location")]
    TooFarFromDrop,
    #[msg("Drop already claimed")]
    AlreadyClaimed,
    #[msg("Drop has expired")]
    DropExpired,
    #[msg("Drop has not expired yet — wait until expiry before reclaiming")]
    NotYetExpired,
    #[msg("Invalid rarity tier (must be 0-3)")]
    InvalidRarity,
    #[msg("Invalid mode (must be 0=Tourism or 1=Event)")]
    InvalidMode,
}
