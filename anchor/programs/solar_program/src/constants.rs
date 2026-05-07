pub const STREAK_WINDOW_SECS: i64 = 86400;

pub fn claim_radius_e7(rarity: u8) -> i64 {
    match rarity {
        0 => 1350, // Common: 15m
        1 => 899,  // Rare: 10m
        2 => 629,  // Legendary: 7m
        _ => 449,  // Mythic: 5m
    }
}
