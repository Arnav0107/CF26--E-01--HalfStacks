const express = require('express');
const router = express.Router();
const { db } = require('./database');
const cryptoHelper = require('./crypto');
const blockchain = require('./blockchain');
const { ethers } = require('ethers');
const demoOrgs = require('./demoOrgs');

// Register demo orgs in DB
async function registerDemoOrgs() {
  for (const org of demoOrgs) {
    try {
      const existing = await db.getOrgById(org.id);
      if (!existing) {
        await db.saveOrg({
          orgId: org.id.toLowerCase(),
          name: org.displayName,
          publicKey: org.id
        });
      }
    } catch (err) {
      console.error("Failed to seed demo org:", err);
    }
  }
}
registerDemoOrgs();

/**
 * Helper to check disputes for a project.
 * If multiple active claims exist for the same projectId with different tonnages,
 * we flag all of them as "disputed". If a correction resolves a dispute or if only
 * one active claim remains, it goes back to active.
 */
async function resolveDisputesForProject(projectId) {
  // Get all active/disputed claims for this project (exclude superseded ones)
  const claims = await db.findClaims({ projectId });
  const activeOrDisputed = claims.filter(c => c.status === 'active' || c.status === 'disputed');

  if (activeOrDisputed.length <= 1) {
    // If 1 or 0 claims, no dispute
    for (const claim of activeOrDisputed) {
      if (claim.status === 'disputed') {
        await db.updateClaimStatus(claim.claimId, 'active');
      }
    }
    return;
  }

  // Check if they have different tonnages
  const firstTonnage = Number(activeOrDisputed[0].tonnage);
  const hasConflict = activeOrDisputed.some(c => Number(c.tonnage) !== firstTonnage);

  if (hasConflict) {
    // Mark all as disputed
    for (const claim of activeOrDisputed) {
      if (claim.status !== 'disputed') {
        await db.updateClaimStatus(claim.claimId, 'disputed');
      }
    }
  } else {
    // Mark all as active
    for (const claim of activeOrDisputed) {
      if (claim.status === 'disputed') {
        await db.updateClaimStatus(claim.claimId, 'active');
      }
    }
  }
}

/**
 * POST /claims
 * Submits an initial claim.
 */
router.post('/claims', async (req, res) => {
  try {
    const { claimId, projectId, projectName, region, projectType, tonnage, orgId, signature } = req.body;

    if (!claimId || !projectId || !projectName || !region || !projectType || tonnage === undefined || !orgId || !signature) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if claimId already exists
    const existing = await db.getClaimById(claimId);
    if (existing) {
      return res.status(400).json({ error: `Claim ID ${claimId} already exists` });
    }

    // Prepare claim object to canonicalize
    const claimPayload = {
      projectId,
      projectName,
      region,
      projectType,
      tonnage: Number(tonnage),
      orgId,
      parentHash: null
    };

    // 1. Canonicalize
    const canonical = cryptoHelper.canonicalizeClaim(claimPayload);

    // 2. Hash
    const hash = cryptoHelper.hashText(canonical);

    // 3. Verify Signature
    const isSigValid = cryptoHelper.verifySignature(hash, signature, orgId);
    if (!isSigValid) {
      return res.status(400).json({ error: "Invalid signature. Recovered address does not match orgId." });
    }

    // 4. Register Org if not exists
    const existingOrg = await db.getOrgById(orgId);
    if (!existingOrg) {
      await db.saveOrg({
        orgId,
        name: `Organization (${orgId.substring(0, 6)})`,
        publicKey: orgId // orgId is the Ethereum public address
      });
    }

    // 5. Anchor on blockchain (returns { txHash, anchored, mode })
    const anchorResult = await blockchain.anchorClaim(claimId, hash, null, signature);

    // Save claim
    const savedClaim = await db.saveClaim({
      claimId,
      projectId,
      projectName,
      region,
      projectType,
      tonnage: Number(tonnage),
      orgId,
      hash,
      signature,
      parentHash: null,
      version: 1,
      status: 'active',
      txHash: anchorResult.txHash,
      anchored: anchorResult.anchored,
      blockchainMode: anchorResult.mode,
      timestamp: Date.now()
    });

    // 6. Check/Resolve disputes
    await resolveDisputesForProject(projectId);

    // Refetch to return correct status
    const finalClaim = await db.getClaimById(claimId);
    res.status(201).json(finalClaim);
  } catch (err) {
    console.error("Error creating claim:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /claims/:id/correct
 * Submits a corrected version of a claim.
 */
router.post('/claims/:id/correct', async (req, res) => {
  try {
    const parentId = req.params.id;
    const { claimId, tonnage, notes, orgId, signature } = req.body;

    if (!claimId || tonnage === undefined || !orgId || !signature) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if new claimId already exists
    const existingNew = await db.getClaimById(claimId);
    if (existingNew) {
      return res.status(400).json({ error: `Claim ID ${claimId} already exists` });
    }

    // Get parent claim
    const parentClaim = await db.getClaimById(parentId);
    if (!parentClaim) {
      return res.status(404).json({ error: `Parent claim ${parentId} not found` });
    }

    if (parentClaim.status === 'superseded') {
      return res.status(400).json({ error: `Parent claim ${parentId} has already been superseded` });
    }

    if (parentClaim.orgId.toLowerCase() !== orgId.toLowerCase()) {
      return res.status(403).json({ error: "Only the submitting organization can correct this claim" });
    }

    // Prepare corrected payload
    const claimPayload = {
      projectId: parentClaim.projectId,
      projectName: parentClaim.projectName,
      region: parentClaim.region,
      projectType: parentClaim.projectType,
      tonnage: Number(tonnage),
      orgId,
      parentHash: parentClaim.hash
    };

    // 1. Canonicalize
    const canonical = cryptoHelper.canonicalizeClaim(claimPayload);

    // 2. Hash
    const hash = cryptoHelper.hashText(canonical);

    // 3. Verify Signature
    const isSigValid = cryptoHelper.verifySignature(hash, signature, orgId);
    if (!isSigValid) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    // 4. Anchor on blockchain
    const anchorResult = await blockchain.anchorClaim(claimId, hash, parentClaim.hash, signature);

    // 5. Mark parent claim as superseded
    await db.updateClaimStatus(parentId, 'superseded');

    // Save corrected claim
    const correctedClaim = await db.saveClaim({
      claimId,
      projectId: parentClaim.projectId,
      projectName: parentClaim.projectName,
      region: parentClaim.region,
      projectType: parentClaim.projectType,
      tonnage: Number(tonnage),
      orgId,
      hash,
      signature,
      parentHash: parentClaim.hash,
      version: parentClaim.version + 1,
      status: 'active',
      txHash: anchorResult.txHash,
      anchored: anchorResult.anchored,
      blockchainMode: anchorResult.mode,
      timestamp: Date.now(),
      notes: notes || ''
    });

    // 6. Check disputes for the project
    await resolveDisputesForProject(parentClaim.projectId);

    // Refetch to return correct status
    const finalClaim = await db.getClaimById(claimId);
    res.status(201).json(finalClaim);
  } catch (err) {
    console.error("Error correcting claim:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /claims/:id/verify
 * Cryptographic audit/verification endpoint.
 */
router.get('/claims/:id/verify', async (req, res) => {
  try {
    const claimId = req.params.id;
    const errors = [];
    const chainDetails = [];

    // 1. Refetch from database
    const claim = await db.getClaimById(claimId);
    if (!claim) {
      return res.status(404).json({ error: `Claim ${claimId} not found` });
    }

    // 2. Audit current claim
    const canonical = cryptoHelper.canonicalizeClaim(claim);
    const recomputedHash = cryptoHelper.hashText(canonical);
    const dbHashMatches = recomputedHash === claim.hash;

    if (!dbHashMatches) {
      errors.push(`Local database content tampered! Recomputed hash: ${recomputedHash}, stored database hash: ${claim.hash}`);
    }

    // Signature verification
    const sigVerified = cryptoHelper.verifySignature(recomputedHash, claim.signature, claim.orgId);
    if (!sigVerified) {
      errors.push("Cryptographic signature invalid for local data!");
    }

    // Fetch blockchain status
    const chainStatus = await blockchain.checkBlockchainStatus();
    const isLiveChainActive = chainStatus.connected && chainStatus.contractFound;

    // Fetch blockchain anchor
    let anchoredHash = null;
    let anchoredOrg = null;
    let anchorVerified = false;
    let anchorDetails = null;
    let liveVerification = "unavailable"; // "verified" | "failed" | "unavailable"

    if (isLiveChainActive) {
      try {
        anchorDetails = await blockchain.getAnchor(claimId);
        anchoredHash = anchorDetails.dataHash;
        anchoredOrg = anchorDetails.orgAddress;
        
        const hashMatch = (anchoredHash.toLowerCase() === recomputedHash.toLowerCase());
        const orgMatch = (anchoredOrg.toLowerCase() === claim.orgId.toLowerCase());
        
        anchorVerified = hashMatch && orgMatch;
        
        if (anchorVerified) {
          liveVerification = "verified";
        } else {
          liveVerification = "failed";
          if (!hashMatch) {
            errors.push(`On-chain anchor hash mismatch! Anchored: ${anchoredHash}, Recomputed: ${recomputedHash}`);
          }
          if (!orgMatch) {
            errors.push(`On-chain anchor org mismatch! Anchored org: ${anchoredOrg}, Claim org: ${claim.orgId}`);
          }
        }
      } catch (err) {
        liveVerification = "failed";
        errors.push(`Blockchain anchor retrieval failed: ${err.message}`);
      }
    } else {
      liveVerification = "unavailable";
      anchorVerified = false;
    }

    chainDetails.push({
      claimId: claim.claimId,
      version: claim.version,
      dbHash: claim.hash,
      recomputedHash,
      anchoredHash,
      signatureVerified: sigVerified,
      anchorVerified,
      tonnage: claim.tonnage,
      anchored: claim.anchored || false, // Persisted write-time flag (Fix Step 3)
      blockchainMode: claim.blockchainMode || "mock", // Persisted write-time flag (Fix Step 3)
      liveVerification
    });

    // 3. Walk parent chain
    let currentParentHash = claim.parentHash;
    let currentVersion = claim.version;
    let chainVerified = true;

    while (currentParentHash) {
      const parentClaims = await db.findClaims({ hash: currentParentHash });
      const parent = parentClaims[0];

      if (!parent) {
        errors.push(`Broken history chain: parent claim with hash ${currentParentHash} not found in database.`);
        chainVerified = false;
        break;
      }

      const pCanonical = cryptoHelper.canonicalizeClaim(parent);
      const pRecomputedHash = cryptoHelper.hashText(pCanonical);
      const pDbHashMatches = pRecomputedHash === parent.hash;
      const pSigVerified = cryptoHelper.verifySignature(pRecomputedHash, parent.signature, parent.orgId);

      let pAnchoredHash = null;
      let pAnchorVerified = false;
      let pAnchor = null;
      let pLiveVerification = "unavailable";

      if (isLiveChainActive) {
        try {
          pAnchor = await blockchain.getAnchor(parent.claimId);
          pAnchoredHash = pAnchor.dataHash;
          pAnchorVerified = (pAnchoredHash.toLowerCase() === pRecomputedHash.toLowerCase()) && 
                            (pAnchor.orgAddress.toLowerCase() === parent.orgId.toLowerCase());
          pLiveVerification = pAnchorVerified ? "verified" : "failed";
        } catch (e) {
          pLiveVerification = "failed";
        }
      } else {
        pLiveVerification = "unavailable";
      }

      chainDetails.push({
        claimId: parent.claimId,
        version: parent.version,
        dbHash: parent.hash,
        recomputedHash: pRecomputedHash,
        anchoredHash: pAnchoredHash,
        signatureVerified: pSigVerified,
        anchorVerified: pAnchorVerified,
        tonnage: parent.tonnage,
        anchored: parent.anchored || false, // Persisted write-time flag (Fix Step 3)
        blockchainMode: parent.blockchainMode || "mock", // Persisted write-time flag (Fix Step 3)
        liveVerification: pLiveVerification
      });

      // Chain integrity: we check db hash match and signature, and only complain about anchor if chain is active and it failed
      const anchorCheckOk = isLiveChainActive ? pAnchorVerified : true;
      if (!pDbHashMatches || !pSigVerified || !anchorCheckOk) {
        chainVerified = false;
        errors.push(`History chain verification failed at Version ${parent.version} (Claim: ${parent.claimId})`);
      }

      currentParentHash = parent.parentHash;
    }

    const isValid = errors.length === 0;

    res.json({
      claimId: claim.claimId,
      isValid,
      recomputedHash,
      anchoredHash,
      signatureVerified: sigVerified,
      anchorVerified,
      chainVerified,
      anchorIdentitySource: "on-chain-ecrecover",
      anchored: claim.anchored || false, // Persisted write-time flag (Fix Step 3)
      blockchainMode: claim.blockchainMode || "mock", // Persisted write-time flag (Fix Step 3)
      liveVerification, // "verified" | "failed" | "unavailable" (Fix Step 3)
      errors,
      chain: chainDetails.reverse() // Sort chronologically: oldest first
    });
  } catch (err) {
    console.error("Verification failed:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /claims/:id/verify-signer
 * Live cryptographic re-derivation endpoint.
 * Recovers signer address from the signature live, and returns comparisons.
 */
router.get('/claims/:id/verify-signer', async (req, res) => {
  try {
    const claim = await db.getClaimById(req.params.id);
    if (!claim) {
      return res.status(404).json({ error: `Claim ${req.params.id} not found` });
    }

    // 1. Recompute canonical form and data hash
    const canonical = cryptoHelper.canonicalizeClaim(claim);
    const dataHash = cryptoHelper.hashText(canonical);

    // 2. Perform live ecrecover using ethers
    let recoveredOrgAddress = "";
    let signatureValid = false;
    try {
      const hashHex = dataHash.startsWith('0x') ? dataHash : '0x' + dataHash;
      const sigHex = claim.signature.startsWith('0x') ? claim.signature : '0x' + claim.signature;
      const messageBytes = ethers.getBytes(hashHex);
      recoveredOrgAddress = ethers.verifyMessage(messageBytes, sigHex);
      signatureValid = recoveredOrgAddress.toLowerCase() === claim.orgId.toLowerCase();
    } catch (err) {
      recoveredOrgAddress = "Invalid signature formatting / Cannot recover";
      signatureValid = false;
    }

    res.json({
      claimId: claim.claimId,
      rawSignature: claim.signature,
      dataHash,
      storedOrgAddress: claim.orgId,
      recoveredOrgAddress,
      signatureValid
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /claims/:id/verify-tampered-signature-simulation
 * Simulation endpoint for signature corruption.
 * Flips a character in the signature, runs ecrecover, and returns comparison.
 */
router.get('/claims/:id/verify-tampered-signature-simulation', async (req, res) => {
  try {
    const claim = await db.getClaimById(req.params.id);
    if (!claim) {
      return res.status(404).json({ error: `Claim ${req.params.id} not found` });
    }

    // 1. Recompute canonical form and data hash
    const canonical = cryptoHelper.canonicalizeClaim(claim);
    const dataHash = cryptoHelper.hashText(canonical);

    // 2. Controlled signature corruption (flip a character)
    const originalSignature = claim.signature;
    const prefix = originalSignature.startsWith('0x') ? '0x' : '';
    const rawHex = originalSignature.startsWith('0x') ? originalSignature.substring(2) : originalSignature;
    
    let tamperedSignature = originalSignature;
    if (rawHex.length > 10) {
      const charArray = rawHex.split('');
      const originalChar = charArray[8];
      const newChar = originalChar === 'a' ? 'b' : 'a';
      charArray[8] = newChar;
      tamperedSignature = prefix + charArray.join('');
    }

    // 3. Rerun ecrecover with corrupted signature
    let recoveredOrgAddress = "";
    let signatureValid = false;
    try {
      const hashHex = dataHash.startsWith('0x') ? dataHash : '0x' + dataHash;
      const sigHex = tamperedSignature.startsWith('0x') ? tamperedSignature : '0x' + tamperedSignature;
      const messageBytes = ethers.getBytes(hashHex);
      recoveredOrgAddress = ethers.verifyMessage(messageBytes, sigHex);
      signatureValid = recoveredOrgAddress.toLowerCase() === claim.orgId.toLowerCase();
    } catch (err) {
      recoveredOrgAddress = "Invalid signature formatting / Cannot recover";
      signatureValid = false;
    }

    res.json({
      claimId: claim.claimId,
      originalSignature,
      tamperedSignature,
      storedOrgAddress: claim.orgId,
      recoveredOrgAddress,
      signatureValid
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /claims
 * Returns all claims (active/superseded/disputed). Supports filtering by projectId.
 */
router.get('/claims', async (req, res) => {
  try {
    const filter = {};
    if (req.query.projectId) {
      filter.projectId = req.query.projectId;
    }
    const claims = await db.findClaims(filter);
    // Sort by timestamp dec
    claims.sort((a, b) => b.timestamp - a.timestamp);
    
    // Dynamic read-only non-blocking lookup of org names from OrgRegistry
    const enrichedClaims = await Promise.all(claims.map(async c => {
      const orgName = await blockchain.getOrgName(c.orgId);
      return { ...c, orgName };
    }));
    
    res.json(enrichedClaims);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /disputes
 * Returns all disputed claims.
 */
router.get('/disputes', async (req, res) => {
  try {
    const claims = await db.findClaims({ status: 'disputed' });
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /claims/:id
 * Returns a specific claim.
 */
router.get('/claims/:id', async (req, res) => {
  try {
    const claim = await db.getClaimById(req.params.id);
    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }
    
    const orgName = await blockchain.getOrgName(claim.orgId);
    res.json({ ...claim, orgName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /claims/:id/tamper (Backdoor for Tamper Lab)
 */
router.post('/claims/:id/tamper', async (req, res) => {
  try {
    const { tonnage } = req.body;
    if (tonnage === undefined) {
      return res.status(400).json({ error: "Missing tonnage field" });
    }
    const updated = await db.tamperClaimTonnage(req.params.id, tonnage);
    if (!updated) {
      return res.status(404).json({ error: "Claim not found" });
    }
    res.json({ message: "Claim database row tampered successfully", claim: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /clear
 * Clears database (for re-runs and idempotency).
 */
router.post('/clear', async (req, res) => {
  try {
    await db.clearAll();
    res.json({ message: "Database cleared successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /status
 * Returns blockchain connection status and server info.
 */
router.get('/status', async (req, res) => {
  try {
    const status = await blockchain.checkBlockchainStatus();
    res.json({
      status: "online",
      blockchainConnected: status.connected,
      contractFound: status.contractFound
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /demo-orgs
 * Returns safe details of mock organizations.
 */
router.get('/demo-orgs', (req, res) => {
  try {
    const safeOrgs = demoOrgs.map(org => ({
      id: org.id,
      displayName: org.displayName
    }));
    res.json(safeOrgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /claims/submit-demo
 * Submits a new claim signed on-the-fly using Anvil's test keys.
 */
router.post('/claims/submit-demo', async (req, res) => {
  try {
    const { projectName, region, tonnage, methodology, parentClaimId, demoOrgId, targetProjectId } = req.body;

    if (parentClaimId && targetProjectId) {
      return res.status(400).json({ error: "parentClaimId and targetProjectId are mutually exclusive" });
    }

    if (!targetProjectId && (!projectName || !region || tonnage === undefined || !methodology || !demoOrgId)) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (targetProjectId && (tonnage === undefined || !demoOrgId)) {
      return res.status(400).json({ error: "Missing tonnage or demoOrgId" });
    }

    const demoOrg = demoOrgs.find(org => org.id.toLowerCase() === demoOrgId.toLowerCase());
    if (!demoOrg) {
      return res.status(400).json({ error: `Demo organization ID ${demoOrgId} not found` });
    }

    let projectId;
    let finalProjectName = projectName;
    let finalRegion = region;
    let finalProjectType = methodology;
    let parentHash = null;
    let version = 1;
    let parentClaim = null;

    if (parentClaimId) {
      parentClaim = await db.getClaimById(parentClaimId);
      if (!parentClaim) {
        return res.status(404).json({ error: `Parent claim ${parentClaimId} not found` });
      }
      if (parentClaim.status === 'superseded') {
        return res.status(400).json({ error: `Parent claim ${parentClaimId} is already superseded` });
      }
      if (parentClaim.orgId.toLowerCase() !== demoOrg.id.toLowerCase()) {
        return res.status(403).json({ error: "Only the submitting organization can correct this claim" });
      }

      projectId = parentClaim.projectId;
      finalProjectName = parentClaim.projectName;
      finalRegion = parentClaim.region;
      parentHash = parentClaim.hash;
      version = parentClaim.version + 1;
      finalProjectType = parentClaim.projectType; // Lock type to match parent
    } else if (targetProjectId) {
      const existingClaims = await db.findClaims({ projectId: targetProjectId });
      if (!existingClaims || existingClaims.length === 0) {
        return res.status(404).json({ error: `Project ID ${targetProjectId} not found` });
      }
      const baseClaim = existingClaims[0];
      projectId = targetProjectId;
      finalProjectName = baseClaim.projectName;
      finalRegion = baseClaim.region;
      finalProjectType = baseClaim.projectType;
      parentHash = null;
      version = 1;
    } else {
      projectId = "DEMO-" + Math.floor(100000 + Math.random() * 900000);
    }

    const claimId = parentClaimId
      ? "demo-correct-" + Date.now().toString().slice(-4) + Math.floor(10 + Math.random() * 90)
      : "demo-claim-" + Date.now().toString().slice(-4) + Math.floor(10 + Math.random() * 90);

    const claimPayload = {
      projectId,
      projectName: finalProjectName,
      region: finalRegion,
      projectType: finalProjectType,
      tonnage: Number(tonnage),
      orgId: demoOrg.id,
      parentHash: parentHash
    };

    // 1. Canonicalize
    const canonical = cryptoHelper.canonicalizeClaim(claimPayload);

    // 2. Hash
    const hash = cryptoHelper.hashText(canonical);

    // 3. Generate signature using demo account key
    const wallet = new ethers.Wallet(demoOrg.privateKey);
    const messageBytes = ethers.getBytes(hash.startsWith('0x') ? hash : '0x' + hash);
    const signature = await wallet.signMessage(messageBytes);

    // 4. Ensure organization is mapped locally
    const existingOrg = await db.getOrgById(demoOrg.id);
    if (!existingOrg) {
      await db.saveOrg({
        orgId: demoOrg.id.toLowerCase(),
        name: demoOrg.displayName,
        publicKey: demoOrg.id
      });
    }

    // 5. Anchor on contract
    const anchorResult = await blockchain.anchorClaim(claimId, hash, parentHash, signature);

    // 6. If correction, mark parent superseded
    if (parentClaimId) {
      await db.updateClaimStatus(parentClaimId, 'superseded');
    }

    // 7. Save claim
    await db.saveClaim({
      claimId,
      projectId,
      projectName: finalProjectName,
      region: finalRegion,
      projectType: finalProjectType,
      tonnage: Number(tonnage),
      orgId: demoOrg.id,
      hash,
      signature,
      parentHash: parentHash,
      version,
      status: 'active',
      txHash: anchorResult.txHash,
      anchored: anchorResult.anchored,
      blockchainMode: anchorResult.mode,
      timestamp: Date.now(),
      notes: parentClaimId ? "Dynamic Web Correction" : (targetProjectId ? "Dispute Test Claim" : "Dynamic Web Initial Claim")
    });

    // 8. Check/resolve disputes
    await resolveDisputesForProject(projectId);

    const finalClaim = await db.getClaimById(claimId);
    res.status(201).json(finalClaim);
  } catch (err) {
    console.error("Error creating demo claim:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
