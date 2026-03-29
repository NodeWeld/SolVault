use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_pack::Pack;
use anchor_lang::solana_program::system_program;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::spl_token::state::Account as SplTokenAccount;
use anchor_spl::token::{self, CloseAccount, Mint, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFLSfp");

fn close_program_owned_account(account: AccountInfo<'_>, sol_destination: AccountInfo<'_>) -> Result<()> {
    let rent = account.lamports();
    **sol_destination.try_borrow_mut_lamports()? = sol_destination
        .lamports()
        .checked_add(rent)
        .ok_or(error!(VaultError::InvalidMint))?;
    **account.try_borrow_mut_lamports()? = 0;
    account.assign(&system_program::ID);
    account.realloc(0, false)?;
    Ok(())
}

#[program]
pub mod nft_vault {
    use super::*;

    pub fn deposit_nft(ctx: Context<DepositNft>) -> Result<()> {
        let clock = Clock::get()?;
        let entry = &mut ctx.accounts.vault_entry;
        entry.owner = ctx.accounts.owner.key();
        entry.mint = ctx.accounts.mint.key();
        entry.deposited_at = clock.unix_timestamp;
        entry.bump = ctx.bumps.vault_entry;

        let cpi_accounts = Transfer {
            from: ctx.accounts.user_ata.to_account_info(),
            to: ctx.accounts.vault_ata.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, 1)?;

        Ok(())
    }

    pub fn withdraw_nft(ctx: Context<WithdrawNft>) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.vault_entry.owner,
            ctx.accounts.owner.key(),
            VaultError::NotOwner
        );
        require_keys_eq!(
            ctx.accounts.vault_entry.mint,
            ctx.accounts.mint.key(),
            VaultError::InvalidMint
        );

        let owner_key = ctx.accounts.owner.key();
        let mint_key = ctx.accounts.mint.key();
        let bump = ctx.accounts.vault_entry.bump;
        let seeds: &[&[u8]] = &[b"vault", owner_key.as_ref(), mint_key.as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_ata.to_account_info(),
            to: ctx.accounts.user_ata.to_account_info(),
            authority: ctx.accounts.vault_entry.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, 1)?;

        token::close_account(CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: ctx.accounts.vault_ata.to_account_info(),
                destination: ctx.accounts.owner.to_account_info(),
                authority: ctx.accounts.vault_entry.to_account_info(),
            },
            signer,
        ))?;

        Ok(())
    }

    pub fn batch_transfer<'info>(
        ctx: Context<'_, '_, '_, 'info, BatchTransfer<'info>>,
        mints: Vec<Pubkey>,
        recipients: Vec<Pubkey>,
    ) -> Result<()> {
        require_eq!(mints.len(), recipients.len(), VaultError::InvalidMint);
        require!(
            mints.len() >= 1 && mints.len() <= 5,
            VaultError::VaultFull
        );

        let owner_key = ctx.accounts.owner.key();
        let rem = &ctx.remaining_accounts;
        require_eq!(rem.len(), mints.len() * 3, VaultError::InvalidMint);

        for i in 0..mints.len() {
            let base = i * 3;
            let vault_entry_ai = rem[base].clone();
            let vault_ata_ai = rem[base + 1].clone();
            let recipient_ata_ai = rem[base + 2].clone();

            let bump = {
                let ve_data = vault_entry_ai.try_borrow_data()?;
                let ve = VaultEntry::try_deserialize(&mut ve_data.as_ref())?;
                require_keys_eq!(ve.owner, owner_key, VaultError::NotOwner);
                require_keys_eq!(ve.mint, mints[i], VaultError::InvalidMint);
                ve.bump
            };

            {
                let va_data = vault_ata_ai.try_borrow_data()?;
                let va = SplTokenAccount::unpack(&va_data)?;
                require_keys_eq!(va.mint, mints[i], VaultError::InvalidMint);
                require_keys_eq!(va.owner, vault_entry_ai.key(), VaultError::InvalidMint);
            }

            {
                let ra_data = recipient_ata_ai.try_borrow_data()?;
                let ra = SplTokenAccount::unpack(&ra_data)?;
                require_keys_eq!(ra.owner, recipients[i], VaultError::NotOwner);
            }
            let seeds: &[&[u8]] = &[b"vault", owner_key.as_ref(), mints[i].as_ref(), &[bump]];
            let signer = &[&seeds[..]];

            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: vault_ata_ai.clone(),
                        to: recipient_ata_ai.clone(),
                        authority: vault_entry_ai.clone(),
                    },
                    signer,
                ),
                1,
            )?;

            token::close_account(CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                CloseAccount {
                    account: vault_ata_ai.clone(),
                    destination: ctx.accounts.owner.to_account_info(),
                    authority: vault_entry_ai.clone(),
                },
                signer,
            ))?;

            close_program_owned_account(vault_entry_ai, ctx.accounts.owner.to_account_info())?;
        }

        emit!(BatchTransferEvent {
            mints: mints.clone(),
            recipients: recipients.clone(),
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct DepositNft<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    pub mint: Account<'info, Mint>,
    #[account(
        mut,
        constraint = user_ata.mint == mint.key() @ VaultError::InvalidMint,
        constraint = user_ata.owner == owner.key() @ VaultError::NotOwner,
        constraint = user_ata.amount == 1 @ VaultError::InvalidMint,
    )]
    pub user_ata: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = owner,
        space = 8 + VaultEntry::INIT_SPACE,
        seeds = [b"vault", owner.key().as_ref(), mint.key().as_ref()],
        bump
    )]
    pub vault_entry: Account<'info, VaultEntry>,
    #[account(
        init,
        payer = owner,
        associated_token::mint = mint,
        associated_token::authority = vault_entry,
    )]
    pub vault_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawNft<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    pub mint: Account<'info, Mint>,
    #[account(
        mut,
        constraint = user_ata.mint == mint.key() @ VaultError::InvalidMint,
        constraint = user_ata.owner == owner.key() @ VaultError::NotOwner,
    )]
    pub user_ata: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref(), mint.key().as_ref()],
        bump = vault_entry.bump,
        close = owner,
        constraint = vault_entry.owner == owner.key() @ VaultError::NotOwner,
        constraint = vault_entry.mint == mint.key() @ VaultError::InvalidMint,
    )]
    pub vault_entry: Account<'info, VaultEntry>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = vault_entry,
    )]
    pub vault_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BatchTransfer<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct VaultEntry {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub deposited_at: i64,
    pub bump: u8,
}

#[event]
pub struct BatchTransferEvent {
    pub mints: Vec<Pubkey>,
    pub recipients: Vec<Pubkey>,
}

#[error_code]
pub enum VaultError {
    #[msg("Signer is not the vault entry owner")]
    NotOwner,
    #[msg("Batch size must be between 1 and 5")]
    VaultFull,
    #[msg("Mint does not match vault entry or accounts")]
    InvalidMint,
    #[msg("NFT already deposited for this mint")]
    AlreadyDeposited,
}
