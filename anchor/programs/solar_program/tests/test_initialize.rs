
use {
    anchor_lang::{solana_program::instruction::Instruction, AccountDeserialize, InstructionData, ToAccountMetas},
    litesvm::LiteSVM,
    solana_message::{Message, VersionedMessage},
    solana_signer::Signer,
    solana_keypair::Keypair,
    solana_transaction::versioned::VersionedTransaction,
};

#[test]
fn plant_drop_creates_account() {
    let program_id = solar_program::id();
    let creator = Keypair::new();
    let mut svm = LiteSVM::new();
    let bytes = include_bytes!("../../../target/deploy/solar_program.so");
    svm.add_program(program_id, bytes).unwrap();
    svm.airdrop(&creator.pubkey(), 1_000_000_000).unwrap();

    let drop_id: u64 = 1;
    let id_bytes = drop_id.to_le_bytes();
    let (drop_pda, _) = anchor_lang::solana_program::pubkey::Pubkey::find_program_address(
        &[b"drop", creator.pubkey().as_ref(), &id_bytes],
        &program_id,
    );

    let instruction = Instruction::new_with_bytes(
        program_id,
        &solar_program::instruction::PlantDrop {
            drop_id,
            lat_e7: 185204000,
            lng_e7: 738567000,
            rarity: 0,
            mode: 0,
            price_lamports: 0,
            expiry_ts: 0,
        }
        .data(),
        solar_program::accounts::PlantDrop {
            drop_state: drop_pda,
            creator: creator.pubkey(),
            system_program: anchor_lang::solana_program::system_program::id(),
        }
        .to_account_metas(None),
    );

    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[instruction], Some(&creator.pubkey()), &blockhash);
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &[creator]).unwrap();

    let res = svm.send_transaction(tx);
    assert!(res.is_ok(), "plant_drop failed: {:?}", res.err());
}
