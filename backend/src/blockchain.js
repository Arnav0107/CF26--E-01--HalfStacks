const { ethers } = require('ethers');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const CONTRACT_ADDRESS_FILE = path.join(__dirname, '..', '..', 'contracts', 'deployed_address.txt');

let provider = null;
let wallet = null;
let contract = null;
let contractAvailable = false;

// ABI of DataProvenance.sol (compiled from foundry output)
const CONTRACT_ABI = [
  "function anchorClaim(bytes32 claimId, bytes32 dataHash, address orgAddress) external",
  "function getAnchor(bytes32 claimId) external view returns (bytes32 dataHash, address owner, address orgAddress, uint256 timestamp)",
  "event ClaimAnchored(bytes32 indexed claimId, bytes32 indexed dataHash, address indexed orgAddress, address owner, uint256 timestamp)"
];

async function initBlockchain() {
  try {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    // Simple check if provider is reachable
    await provider.getNetwork();

    // Default Hardhat/Anvil private key for deployer/signer
    const privateKey = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    wallet = new ethers.Wallet(privateKey, provider);

    // Read contract address if it exists
    if (fs.existsSync(CONTRACT_ADDRESS_FILE)) {
      const contractAddress = fs.readFileSync(CONTRACT_ADDRESS_FILE, 'utf8').trim();
      contract = new ethers.Contract(contractAddress, CONTRACT_ABI, wallet);
      contractAvailable = true;
      console.log(`Blockchain initialized. Connected to contract at ${contractAddress}`);
    } else {
      console.warn("Contract address file not found. Running blockchain in MOCK mode.");
    }
  } catch (err) {
    console.warn("Could not connect to local blockchain network. Running blockchain in MOCK mode.");
    contractAvailable = false;
  }
}

/**
 * Anchors the claim on the blockchain.
 * Converts string claimId to bytes32 via keccak256.
 */
async function anchorClaim(claimId, dataHash, orgAddress) {
  const claimIdBytes32 = ethers.id(claimId);
  const dataHashBytes32 = dataHash.startsWith('0x') ? dataHash : '0x' + dataHash;
  const formattedOrgAddress = ethers.getAddress(orgAddress);

  if (contractAvailable) {
    try {
      const tx = await contract.anchorClaim(claimIdBytes32, dataHashBytes32, formattedOrgAddress);
      const receipt = await tx.wait();
      console.log(`Claim ${claimId} anchored on-chain! Tx: ${receipt.hash}`);
      return receipt.hash;
    } catch (err) {
      console.error(`On-chain anchoring failed for claim ${claimId}:`, err.message);
      // Fallback to mock on error
    }
  }

  // Mock Anchoring Fallback
  const mockTxHash = '0x' + crypto.createHash('sha256')
    .update(claimId + dataHash + orgAddress + Date.now().toString())
    .digest('hex');
  console.log(`[MOCK BLOCKCHAIN] Anchored claim ${claimId} (Mock Tx: ${mockTxHash})`);
  return mockTxHash;
}

/**
 * Retrieves the on-chain anchor details.
 * Falls back to db verification in mock mode.
 */
async function getAnchor(claimId) {
  const claimIdBytes32 = ethers.id(claimId);

  if (contractAvailable) {
    try {
      const result = await contract.getAnchor(claimIdBytes32);
      return {
        dataHash: result.dataHash.substring(2), // Strip 0x
        owner: result.owner,
        orgAddress: result.orgAddress,
        timestamp: Number(result.timestamp)
      };
    } catch (err) {
      // If contract call fails, fall through to mock
      console.warn(`Failed to fetch anchor from contract for ${claimId}: ${err.message}. Using fallback.`);
    }
  }

  // Mock retrieve: read from local DB
  const { db } = require('./database');
  const claim = await db.getClaimById(claimId);
  if (!claim) {
    throw new Error(`Claim ${claimId} not found in local database`);
  }

  return {
    dataHash: claim.hash,
    owner: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Mock owner
    orgAddress: claim.orgId,
    timestamp: claim.timestamp
  };
}

module.exports = {
  initBlockchain,
  anchorClaim,
  getAnchor,
  isMock: () => !contractAvailable
};
