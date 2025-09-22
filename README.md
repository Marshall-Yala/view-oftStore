# OFTStore Account Reader

A TypeScript utility to read and deserialize OFTStore account data from Solana blockchain.

## Features

- Deserializes OFTStore account data according to the Rust struct definition
- Displays all account fields in a readable format
- Supports both Native and Token OFT types
- Handles optional fields (pauser, unpauser) correctly

## Installation

```bash
bun install
```

## Usage

1. Replace the placeholder account address in `index.ts`:
   ```typescript
   const accountAddress = 'YOUR_ACTUAL_OFT_STORE_ACCOUNT_ADDRESS';
   ```

2. Run the script:
   ```bash
   bun run index.ts
   ```

## OFTStore Structure

The OFTStore account contains:

### Immutable Fields
- `oft_type`: OFT type (Native or Token)
- `ld2sd_rate`: LD to SD conversion rate
- `token_mint`: Token mint public key
- `token_escrow`: Token escrow account for TVL and fees
- `endpoint_program`: Endpoint program public key
- `bump`: Bump seed

### Mutable Fields
- `tvl_ld`: Total value locked (always 0 for Native type)

### Configurable Fields
- `admin`: Admin public key
- `default_fee_bps`: Default fee in basis points
- `paused`: Whether the store is paused
- `pauser`: Optional pauser public key
- `unpauser`: Optional unpauser public key

## Example Output

```
🚀 Starting OFTStore Account Reader
=====================================

📊 Reading OFTStore account data...

🔍 Account Details:
==================
Account Address: 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM
Data Length: 201 bytes
Owner: 11111111111111111111111111111111
Executable: false
Rent Epoch: 361

📋 OFTStore Data:
=================
OFT Type: Token (1)
LD2SD Rate: 1000000000
Token Mint: So11111111111111111111111111111111111111112
Token Escrow: 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM
Endpoint Program: 11111111111111111111111111111111
Bump: 255
TVL LD: 1000000000000
Admin: 11111111111111111111111111111111
Default Fee BPS: 10
Paused: false
Pauser: None
Unpauser: None
```

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.1.29. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
