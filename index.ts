import { Buffer } from 'buffer';

import {
  Connection,
  PublicKey,
  type PublicKeyInitData,
} from '@solana/web3.js';

// Define OFTType enum based on common Solana program patterns
export enum OFTType {
  Native = 0,
  Token = 1,
  // Add more types as needed
}

// Define EnforcedOptions interface
export interface EnforcedOptions {
  // Add fields based on your EnforcedOptions struct
  // This is a placeholder - you'll need to define the actual structure
  data: Buffer; // Raw bytes for now
}

// Define RateLimiter interface
export interface RateLimiter {
  // Add fields based on your RateLimiter struct
  // This is a placeholder - you'll need to define the actual structure
  data: Buffer; // Raw bytes for now
}

// Define PeerConfig interface matching the Rust struct
export interface PeerConfig {
  peer_address: PublicKey;
  enforced_options: EnforcedOptions;
  outbound_rate_limiter: RateLimiter | null;
  inbound_rate_limiter: RateLimiter | null;
  fee_bps: number | null;
  bump: number;
}

// Define the OFTStore interface matching the Rust struct
export interface OFTStore {
  // immutable
  oft_type: OFTType;
  ld2sd_rate: bigint;
  token_mint: PublicKey;
  token_escrow: PublicKey;
  endpoint_program: PublicKey;
  bump: number;
  // mutable
  tvl_ld: bigint;
  // configurable
  admin: PublicKey;
  default_fee_bps: number;
  paused: boolean;
  pauser: PublicKey | null;
  unpauser: PublicKey | null;
}

// Function to deserialize OFTStore account data
export function deserializeOFTStore(data: Buffer): OFTStore {
  let offset = 0;

  // Skip discriminator (8 bytes) - common in Anchor programs
  const discriminator = data.subarray(offset, offset + 8);
  offset += 8;

  // Read oft_type (u8)
  const oft_type = data.readUInt8(offset);
  offset += 1;

  // Read ld2sd_rate (u64)
  const ld2sd_rate = data.readBigUInt64LE(offset);
  offset += 8;

  // Read token_mint (Pubkey - 32 bytes)
  const token_mint = new PublicKey(data.subarray(offset, offset + 32));
  offset += 32;

  // Read token_escrow (Pubkey - 32 bytes)
  const token_escrow = new PublicKey(data.subarray(offset, offset + 32));
  offset += 32;

  // Read endpoint_program (Pubkey - 32 bytes)
  const endpoint_program = new PublicKey(data.subarray(offset, offset + 32));
  offset += 32;

  // Read bump (u8)
  const bump = data.readUInt8(offset);
  offset += 1;

  // Read tvl_ld (u64)
  const tvl_ld = data.readBigUInt64LE(offset);
  offset += 8;

  // Read admin (Pubkey - 32 bytes)
  const admin = new PublicKey(data.subarray(offset, offset + 32));
  offset += 32;

  // Read default_fee_bps (u16)
  const default_fee_bps = data.readUInt16LE(offset);
  offset += 2;

  // Read paused (bool - 1 byte)
  const paused = data.readUInt8(offset) !== 0;
  offset += 1;

  // Read pauser (Option<Pubkey> - 1 byte for Some/None + 32 bytes for Pubkey)
  const pauser_some = data.readUInt8(offset) !== 0;
  offset += 1;
  const pauser = pauser_some
    ? new PublicKey(data.subarray(offset, offset + 32))
    : null;
  if (pauser_some) offset += 32;

  // Read unpauser (Option<Pubkey> - 1 byte for Some/None + 32 bytes for Pubkey)
  const unpauser_some = data.readUInt8(offset) !== 0;
  offset += 1;
  const unpauser = unpauser_some
    ? new PublicKey(data.subarray(offset, offset + 32))
    : null;
  if (unpauser_some) offset += 32;

  return {
    oft_type: oft_type as OFTType,
    ld2sd_rate,
    token_mint,
    token_escrow,
    endpoint_program,
    bump,
    tvl_ld,
    admin,
    default_fee_bps,
    paused,
    pauser,
    unpauser,
  };
}

// Function to deserialize PeerConfig account data
export function deserializePeerConfig(data: Buffer): PeerConfig {
  let offset = 0;

  // Skip discriminator (8 bytes) - common in Anchor programs
  const discriminator = data.subarray(offset, offset + 8);
  offset += 8;

  // Read peer_address - it's an EVM address (20 bytes) padded with zeros to 32 bytes
  // The first 12 bytes are zeros, the last 20 bytes contain the EVM address
  const peer_address_bytes = data.subarray(offset, offset + 32);
  offset += 32;

  // Extract the EVM address (last 20 bytes) and create a PublicKey
  const evm_address = peer_address_bytes.subarray(12, 32); // Last 20 bytes
  const padded_address = Buffer.concat([Buffer.alloc(12), evm_address]); // Pad with 12 zeros
  const peer_address = new PublicKey(padded_address);

  // Read enforced_options - it appears to be 32 bytes based on the data
  const enforced_options_data = data.subarray(offset, offset + 32);
  offset += 32;
  const enforced_options: EnforcedOptions = { data: enforced_options_data };

  // The remaining data structure is unclear from the hex output
  // Let's read the remaining data as raw bytes for analysis
  const remaining_data = data.subarray(offset);

  // Based on the hex data, it looks like there might be more complex structures
  // For now, let's set the optional fields to null and read what we can

  let outbound_rate_limiter: RateLimiter | null = null;
  let inbound_rate_limiter: RateLimiter | null = null;
  let fee_bps: number | null = null;
  let bump: number = 0;

  // Try to read the remaining fields if there's enough data
  if (remaining_data.length >= 3) {
    // Read outbound_rate_limiter option
    const outbound_some = remaining_data.readUInt8(0) !== 0;
    if (outbound_some && remaining_data.length > 1) {
      // This might not be correct, but let's try
      const rate_limiter_data = remaining_data.subarray(1, 33);
      outbound_rate_limiter = { data: rate_limiter_data };
    }

    // Read inbound_rate_limiter option
    const inbound_some = remaining_data.readUInt8(1) !== 0;
    if (inbound_some && remaining_data.length > 2) {
      const rate_limiter_data = remaining_data.subarray(2, 34);
      inbound_rate_limiter = { data: rate_limiter_data };
    }

    // Read fee_bps option
    const fee_bps_some = remaining_data.readUInt8(2) !== 0;
    if (fee_bps_some && remaining_data.length > 4) {
      fee_bps = remaining_data.readUInt16LE(3);
    }

    // Read bump (last byte)
    bump = remaining_data.readUInt8(remaining_data.length - 1);
  }

  return {
    peer_address,
    enforced_options,
    outbound_rate_limiter,
    inbound_rate_limiter,
    fee_bps,
    bump,
  };
}

// Function to calculate PDA address
export function calculatePDAAddress(
  programId: PublicKeyInitData,
  oftStoreAddress: PublicKeyInitData,
  remoteEid: number
): PublicKey {
  const PEER_SEED = Buffer.from("Peer", "utf8");
  const oftStoreKey = new PublicKey(oftStoreAddress);
  const remoteEidBytes = Buffer.alloc(8);
  remoteEidBytes.writeBigUInt64BE(BigInt(remoteEid), 0);

  const seeds = [PEER_SEED, oftStoreKey.toBuffer(), remoteEidBytes];

  const [pdaAddress] = PublicKey.findProgramAddressSync(
    seeds,
    new PublicKey(programId)
  );
  return pdaAddress;
}

// Function to analyze raw account data
export function analyzeAccountData(data: Buffer): void {
  console.log("\n🔍 Raw Data Analysis:");
  console.log("====================");
  console.log(`Total Length: ${data.length} bytes`);
  console.log(`Hex: ${data.toString("hex")}`);
  console.log(
    `First 64 bytes: ${data
      .subarray(0, Math.min(64, data.length))
      .toString("hex")}`
  );

  // Try to find patterns
  let offset = 0;
  console.log("\n📊 Byte-by-byte analysis:");
  console.log("Offset | Value | Description");
  console.log("-------|-------|------------");

  // Check first few bytes
  for (let i = 0; i < Math.min(20, data.length); i++) {
    const value = data.readUInt8(i);
    let description = "";
    if (i === 0) description = "oft_type (u8)";
    else if (i >= 1 && i <= 8) description = "ld2sd_rate (u64)";
    else if (i >= 9 && i <= 40) description = "token_mint (Pubkey)";
    else if (i >= 41 && i <= 72) description = "token_escrow (Pubkey)";
    else if (i >= 73 && i <= 104) description = "endpoint_program (Pubkey)";
    else if (i === 105) description = "bump (u8)";
    else if (i >= 106 && i <= 113) description = "tvl_ld (u64)";
    else if (i >= 114 && i <= 145) description = "admin (Pubkey)";
    else if (i >= 146 && i <= 147) description = "default_fee_bps (u16)";
    else if (i === 148) description = "paused (bool)";
    else if (i === 149) description = "pauser option (u8)";
    else if (i >= 150 && i <= 181) description = "pauser (Pubkey)";
    else if (i === 182) description = "unpauser option (u8)";
    else if (i >= 183 && i <= 214) description = "unpauser (Pubkey)";
    else description = "unknown";

    console.log(
      `${i.toString().padStart(6)} | ${value
        .toString()
        .padStart(5)} | ${description}`
    );
  }
}

// Function to read and display PeerConfig account data
export async function readPeerConfigAccount(
  connection: Connection,
  accountAddress: string
): Promise<void> {
  try {
    const accountPubkey = new PublicKey(accountAddress);
    const accountInfo = await connection.getAccountInfo(accountPubkey);

    if (!accountInfo) {
      console.log("❌ Account not found");
      return;
    }

    if (!accountInfo.data) {
      console.log("❌ Account has no data");
      return;
    }

    console.log("📊 Reading PeerConfig account data...\n");

    console.log("🔍 Account Details:");
    console.log("==================");
    console.log(`Account Address: ${accountAddress}`);
    console.log(`Data Length: ${accountInfo.data.length} bytes`);
    console.log(`Owner: ${accountInfo.owner.toString()}`);
    console.log(`Executable: ${accountInfo.executable}`);
    console.log(`Rent Epoch: ${accountInfo.rentEpoch}`);

    const peerConfig = deserializePeerConfig(accountInfo.data);

    console.log("\n📋 PeerConfig Data:");
    console.log("===================");
    console.log(`Peer Address (Solana): ${peerConfig.peer_address.toString()}`);

    // Extract and display EVM address
    const peer_address_bytes = accountInfo.data.subarray(8, 40); // Skip discriminator, get 32 bytes
    const evm_address = peer_address_bytes.subarray(12, 32); // Last 20 bytes
    console.log(`Peer Address (EVM): 0x${evm_address.toString("hex")}`);

    console.log(
      `Enforced Options: ${peerConfig.enforced_options.data.toString("hex")}`
    );
    console.log(
      `Outbound Rate Limiter: ${
        peerConfig.outbound_rate_limiter?.data.toString("hex") || "None"
      }`
    );
    console.log(
      `Inbound Rate Limiter: ${
        peerConfig.inbound_rate_limiter?.data.toString("hex") || "None"
      }`
    );
    console.log(`Fee BPS: ${peerConfig.fee_bps || "None"}`);
    console.log(`Bump: ${peerConfig.bump}`);

    // Debug: Show raw data analysis
    console.log("\n🔍 Raw Data Analysis:");
    console.log("====================");
    console.log(`Total data length: ${accountInfo.data.length} bytes`);
    console.log(`Raw hex: ${accountInfo.data.toString("hex")}`);

    // Show byte-by-byte analysis for first 64 bytes
    console.log("\nByte-by-byte analysis (first 64 bytes):");
    console.log("Offset | Value | Description");
    console.log("-------|-------|------------");
    for (let i = 0; i < Math.min(64, accountInfo.data.length); i++) {
      const value = accountInfo.data.readUInt8(i);
      let description = "";
      if (i < 8) description = "discriminator";
      else if (i >= 8 && i < 40) description = "peer_address";
      else if (i >= 40 && i < 72) description = "enforced_options";
      else if (i === 72) description = "outbound_rate_limiter option";
      else if (i === 73) description = "inbound_rate_limiter option";
      else if (i === 74) description = "fee_bps option";
      else if (i === 75) description = "bump";
      else description = "unknown";

      if (i % 8 === 0) {
        console.log(`\nOffset ${i.toString().padStart(3)}:`);
      }
      console.log(
        `  ${i.toString().padStart(3)}: 0x${value
          .toString(16)
          .padStart(2, "0")} (${value}) - ${description}`
      );
    }
  } catch (error) {
    console.error("❌ Error reading PeerConfig account:", error);
  }
}

// Function to read and display OFTStore account data
export async function readOFTStoreAccount(
  connection: Connection,
  accountAddress: string
): Promise<void> {
  try {
    const accountPubkey = new PublicKey(accountAddress);
    const accountInfo = await connection.getAccountInfo(accountPubkey);

    if (!accountInfo) {
      console.log("❌ Account not found");
      return;
    }

    if (!accountInfo.data) {
      console.log("❌ Account has no data");
      return;
    }

    console.log("📊 Reading OFTStore account data...\n");

    console.log("🔍 Account Details:");
    console.log("==================");
    console.log(`Account Address: ${accountAddress}`);
    console.log(`Data Length: ${accountInfo.data.length} bytes`);
    console.log(`Owner: ${accountInfo.owner.toString()}`);
    console.log(`Executable: ${accountInfo.executable}`);
    console.log(`Rent Epoch: ${accountInfo.rentEpoch}`);

    // Check if data length is sufficient for OFTStore
    const expectedMinLength = 1 + 8 + 32 + 32 + 32 + 1 + 8 + 32 + 2 + 1 + 1 + 1; // minimum length
    if (accountInfo.data.length < expectedMinLength) {
      console.log(
        `\n⚠️  Account data too short for OFTStore (${accountInfo.data.length} bytes, expected at least ${expectedMinLength} bytes)`
      );
      console.log("Raw data (hex):", accountInfo.data.toString("hex"));
      return;
    }

    const oftStore = deserializeOFTStore(accountInfo.data);

    console.log("\n📋 OFTStore Data:");
    console.log("=================");
    console.log(
      `OFT Type: ${OFTType[oftStore.oft_type]} (${oftStore.oft_type})`
    );
    console.log(`LD2SD Rate: ${oftStore.ld2sd_rate.toString()}`);
    console.log(`Token Mint: ${oftStore.token_mint.toString()}`);
    console.log(`Token Escrow: ${oftStore.token_escrow.toString()}`);
    console.log(`Endpoint Program: ${oftStore.endpoint_program.toString()}`);
    console.log(`Bump: ${oftStore.bump}`);
    console.log(`TVL LD: ${oftStore.tvl_ld.toString()}`);
    console.log(`Admin: ${oftStore.admin.toString()}`);
    console.log(`Default Fee BPS: ${oftStore.default_fee_bps}`);
    console.log(`Paused: ${oftStore.paused}`);
    console.log(`Pauser: ${oftStore.pauser?.toString() || "None"}`);
    console.log(`Unpauser: ${oftStore.unpauser?.toString() || "None"}`);

    // Calculate PDA address
    console.log("\n🔗 PDA Calculation:");
    console.log("===================");
    const programId = accountInfo.owner; // Use the account owner as program ID
    const oftStoreAddress = accountAddress;
    const remoteEid = 30109;

    try {
      const pdaAddress = calculatePDAAddress(
        programId,
        oftStoreAddress,
        remoteEid
      );
      console.log(`Program ID: ${programId.toString()}`);
      console.log(`OFT Store: ${oftStoreAddress}`);
      console.log(`Remote EID: ${remoteEid}`);
      console.log(`Calculated PDA: ${pdaAddress.toString()}`);

      // Show the seeds used
      const PEER_SEED = Buffer.from("Peer", "utf8");
      const oftStoreKey = new PublicKey(oftStoreAddress);
      const remoteEidBytes = Buffer.alloc(8);
      remoteEidBytes.writeBigUInt64BE(BigInt(remoteEid), 0);

      console.log("\nSeeds used:");
      console.log(
        `1. PEER_SEED: ${PEER_SEED.toString("hex")} ("${PEER_SEED.toString(
          "utf8"
        )}")`
      );
      console.log(`2. oft_store: ${oftStoreKey.toBuffer().toString("hex")}`);
      console.log(
        `3. remote_eid (${remoteEid}): ${remoteEidBytes.toString("hex")}`
      );
    } catch (pdaError) {
      console.error("❌ Error calculating PDA:", pdaError);
    }
  } catch (error) {
    console.error("❌ Error reading account:", error);
  }
}

// Main function - replace with actual account address
async function main() {
  // You can replace this with any Solana RPC endpoint
  const connection = new Connection(
    "https://flashy-cool-haze.solana-mainnet.quiknode.pro/bc442c58e0cae4a03f1ca55ab019fd973a3a40ec",
    "confirmed"
  );

  // Replace this with the actual OFTStore account address you want to read
  const accountAddress = "3fCoNdCEoEcERakCPM17NjLE9AocA86LMwRRWDpzjLVh";

  console.log("🚀 Starting Account Reader");
  console.log("===========================\n");

  // Read OFTStore account
  console.log("📖 Reading OFTStore Account:");
  console.log("=============================");
  await readOFTStoreAccount(connection, accountAddress);

  // Calculate and read PeerConfig account for multiple remoteEids
  console.log("\n📖 Reading PeerConfig Accounts:");
  console.log("===============================");
  const programId = "7ARvMSh4xHDvRBPPxEMtLxZdEHH65yAXYeTUN52bMgGv"; // Use the program ID from OFTStore
  const oftStoreAddress = accountAddress;
  const remoteEids = [30102, 30184, 30101, 30109];

  for (const remoteEid of remoteEids) {
    try {
      console.log(`\n🔍 Checking Remote EID: ${remoteEid}`);
      console.log("===============================");

      const peerConfigAddress = calculatePDAAddress(
        programId,
        oftStoreAddress,
        remoteEid
      );
      console.log(`PeerConfig PDA Address: ${peerConfigAddress.toString()}`);

      // Show the seeds used for this specific remoteEid
      const PEER_SEED = Buffer.from("Peer", "utf8");
      const oftStoreKey = new PublicKey(oftStoreAddress);
      const remoteEidBytes = Buffer.alloc(8);
      remoteEidBytes.writeBigUInt64BE(BigInt(remoteEid), 0);

      console.log("Seeds used:");
      console.log(
        `1. PEER_SEED: ${PEER_SEED.toString("hex")} ("${PEER_SEED.toString(
          "utf8"
        )}")`
      );
      console.log(`2. oft_store: ${oftStoreKey.toBuffer().toString("hex")}`);
      console.log(
        `3. remote_eid (${remoteEid}): ${remoteEidBytes.toString("hex")}`
      );

      await readPeerConfigAccount(connection, peerConfigAddress.toString());
    } catch (error) {
      console.error(`❌ Error with Remote EID ${remoteEid}:`, error);
    }
  }
}

// Run the main function if this file is executed directly
if (import.meta.main) {
  main().catch(console.error);
}
