const crypto = require('crypto');
const { ethers } = require('ethers');

/**
 * Deterministically stringifies a claim's core parameters by sorting keys alphabetically.
 */
function canonicalizeClaim(claim) {
  const normalized = {
    orgId: claim.orgId.toLowerCase(),
    parentHash: claim.parentHash || null,
    projectId: claim.projectId,
    projectName: claim.projectName,
    projectType: claim.projectType,
    region: claim.region,
    tonnage: Number(claim.tonnage)
  };

  const sortedKeys = Object.keys(normalized).sort();
  const sortedObj = {};
  for (const key of sortedKeys) {
    sortedObj[key] = normalized[key];
  }
  return JSON.stringify(sortedObj);
}

/**
 * Computes the SHA-256 hash of a string.
 */
function hashText(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Verifies that the signature matches the claiming organization's ID (Ethereum Address).
 * The signature was created over the SHA-256 hash of the canonicalized claim data.
 */
function verifySignature(canonicalHash, signature, orgId) {
  try {
    // Ensure the hash has a 0x prefix for ethers
    const hashHex = canonicalHash.startsWith('0x') ? canonicalHash : '0x' + canonicalHash;
    const sigHex = signature.startsWith('0x') ? signature : '0x' + signature;
    
    // In ethers v6, verifyMessage accepts a Uint8Array of bytes,
    // which corresponds exactly to Python's encode_defunct(hexstr=hashHex)
    const messageBytes = ethers.getBytes(hashHex);
    const recoveredAddress = ethers.verifyMessage(messageBytes, sigHex);

    return recoveredAddress.toLowerCase() === orgId.toLowerCase();
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}

module.exports = {
  canonicalizeClaim,
  hashText,
  verifySignature
};
