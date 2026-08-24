const { ethers } = require('ethers');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const CONTRACT_ADDRESS_FILE = path.join(__dirname, '..', '..', 'contracts', 'deployed_address.txt');
const ORG_REGISTRY_ADDRESS_FILE = path.join(__dirname, '..', '..', 'contracts', 'deployed_orgregistry_address.txt');

let provider = null;
let wallet = null;
let contract = null;
let orgRegistryContract = null;
let contractAvailable = false;
let orgRegistryAvailable = false;

// ABI of DataProvenance.sol (Upgraded for parentHash)
const CONTRACT_ABI = [
  "function anchorClaim(bytes32 claimId, bytes32 dataHash, bytes32 parentHash, bytes signature) external",
  "function getAnchor(bytes32 claimId) external view returns (bytes32 dataHash, address owner, address orgAddress, uint256 timestamp, bytes32 parentHash)",
  "event ClaimAnchored(bytes32 indexed claimId, bytes32 indexed dataHash, address indexed orgAddress, address owner, uint256 timestamp, bytes32 parentHash)"
];

// ABI of OrgRegistry.sol (Stated attestation mapping extension point)
const ORG_REGISTRY_ABI = [
  "function orgNames(address org) external view returns (string)",
  "function registerOrg(address org, string calldata name) external"
];

async function initBlockchain() {
  try {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    // Simple check if provider is reachable
    await provider.getNetwork();

    // Well-known public Anvil/Hardhat test key — local dev only, never used on any live network.
    const privateKey = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    wallet = new ethers.Wallet(privateKey, provider);

    // Read DataProvenance contract address
    if (fs.existsSync(CONTRACT_ADDRESS_FILE)) {
      const contractAddress = fs.readFileSync(CONTRACT_ADDRESS_FILE, 'utf8').trim();
      contract = new ethers.Contract(contractAddress, CONTRACT_ABI, wallet);
      contractAvailable = true;
      console.log(`Blockchain initialized. Connected to DataProvenance at ${contractAddress}`);
    } else {
      console.warn("DataProvenance contract address file not found. Running in MOCK mode.");
    }

    // Read OrgRegistry contract address
    if (fs.existsSync(ORG_REGISTRY_ADDRESS_FILE)) {
      const registryAddress = fs.readFileSync(ORG_REGISTRY_ADDRESS_FILE, 'utf8').trim();
      orgRegistryContract = new ethers.Contract(registryAddress, ORG_REGISTRY_ABI, wallet);
      orgRegistryAvailable = true;
      console.log(`Blockchain initialized. Connected to OrgRegistry at ${registryAddress}`);
    } else {
      console.warn("OrgRegistry contract address file not found. Registry mapping fallback enabled.");
    }
  } catch (err) {
    console.warn("Could not connect to local blockchain network. Running blockchain in MOCK mode.");
    contractAvailable = false;
    orgRegistryAvailable = false;
  }
}

/**
 * Anchors the claim on the blockchain.
 * Returns { txHash, anchored: boolean, mode: "on-chain" | "mock" }
 */
async function anchorClaim(claimId, dataHash, parentHash, signature) {
  const claimIdBytes32 = ethers.id(claimId);
  const dataHashBytes32 = dataHash.startsWith('0x') ? dataHash : '0x' + dataHash;
  const parentHashBytes32 = parentHash 
    ? (parentHash.startsWith('0x') ? parentHash : '0x' + parentHash)
    : ethers.ZeroHash;
  const sigBytes = signature.startsWith('0x') ? signature : '0x' + signature;

  if (contractAvailable) {
    try {
      const tx = await contract.anchorClaim(claimIdBytes32, dataHashBytes32, parentHashBytes32, sigBytes);
      const receipt = await tx.wait();
      console.log(`Claim ${claimId} anchored on-chain! Tx: ${receipt.hash}`);
      return {
        txHash: receipt.hash,
        anchored: true,
        mode: "on-chain"
      };
    } catch (err) {
      console.error(`On-chain anchoring failed for claim ${claimId}:`, err.message);
      // Fallback to mock on error
    }
  }

  // Mock Anchoring Fallback (Resilience Mode)
  const mockTxHash = '0x' + crypto.createHash('sha256')
    .update(claimId + dataHash + (parentHash || "") + signature + Date.now().toString())
    .digest('hex');
  console.log(`[MOCK BLOCKCHAIN] Anchored claim ${claimId} (Mock Tx: ${mockTxHash})`);
  return {
    txHash: mockTxHash,
    anchored: false,
    mode: "mock"
  };
}

/**
 * Retrieves the on-chain anchor details.
 * Returns { dataHash, owner, orgAddress, timestamp, parentHash, anchored: boolean, mode: "on-chain" | "mock" }
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
        timestamp: Number(result.timestamp),
        parentHash: result.parentHash === ethers.ZeroHash ? null : result.parentHash.substring(2),
        anchored: true,
        mode: "on-chain"
      };
    } catch (err) {
      console.warn(`Failed to fetch anchor from contract for ${claimId}: ${err.message}. Using mock fallback.`);
    }
  }

  // Mock retrieve: read from local DB
  const { db } = require('./database');
  const claim = await db.getClaimById(claimId);
  if (!claim) {
    throw new Error(`Claim ${claimId} not found in local database`);
  }

  // Cryptographically recover orgAddress from claim's signature (mocking contract's on-chain ecrecover)
  let recoveredOrgAddress;
  try {
    const hashHex = claim.hash.startsWith('0x') ? claim.hash : '0x' + claim.hash;
    const sigHex = claim.signature.startsWith('0x') ? claim.signature : '0x' + claim.signature;
    recoveredOrgAddress = ethers.verifyMessage(ethers.getBytes(hashHex), sigHex);
  } catch (err) {
    console.warn(`Mock signature recovery failed for ${claimId}: ${err.message}. Using stored orgId.`);
    recoveredOrgAddress = claim.orgId;
  }

  // CRITICAL SECURITY NOTE: In mock fallback mode, the parentHash is NOT recovered cryptographically.
  // We read it directly from the local database record and report it.
  const parentHash = claim.parentHash;

  return {
    dataHash: claim.hash,
    owner: wallet ? wallet.address : "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Fixed mock owner address
    orgAddress: recoveredOrgAddress,
    timestamp: claim.timestamp,
    parentHash: parentHash,
    anchored: false,
    mode: "mock"
  };
}

/**
 * Resolves an organization address to a verified registry name.
 * Non-blocking, falls back to local DB org names or placeholder addresses.
 */
async function getOrgName(orgAddress) {
  const formattedAddress = ethers.getAddress(orgAddress);
  
  if (orgRegistryAvailable) {
    try {
      const name = await orgRegistryContract.orgNames(formattedAddress);
      if (name && name.trim().length > 0) {
        return name;
      }
    } catch (err) {
      // Fail through silently
    }
  }

  // Mock Fallback: Look up org details in the local DB
  try {
    const { db } = require('./database');
    const org = await db.getOrgById(orgAddress.toLowerCase());
    if (org && org.name) {
      return org.name;
    }
  } catch (err) {
    // Fail through silently
  }

  // Default placeholder
  return `Organization (${orgAddress.substring(0, 8)})`;
}

module.exports = {
  initBlockchain,
  anchorClaim,
  getAnchor,
  getOrgName,
  isMock: () => !contractAvailable
};
