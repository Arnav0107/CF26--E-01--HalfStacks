const express = require('express');
const router = express.Router();
const { db } = require('./database');
const cryptoHelper = require('./crypto');
const blockchain = require('./blockchain');

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

    // 5. Anchor on blockchain
    const txHash = await blockchain.anchorClaim(claimId, hash, orgId);

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
      txHash,
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
    const txHash = await blockchain.anchorClaim(claimId, hash, orgId);

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
      txHash,
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

    // Fetch blockchain anchor
    let anchoredHash = null;
    let anchoredOrg = null;
    let anchorVerified = false;
    let anchorDetails = null;

    try {
      anchorDetails = await blockchain.getAnchor(claimId);
      anchoredHash = anchorDetails.dataHash;
      anchoredOrg = anchorDetails.orgAddress;
      
      const hashMatch = (anchoredHash.toLowerCase() === recomputedHash.toLowerCase());
      const orgMatch = (anchoredOrg.toLowerCase() === claim.orgId.toLowerCase());
      
      anchorVerified = hashMatch && orgMatch;
      
      if (!hashMatch) {
        errors.push(`On-chain anchor hash mismatch! Anchored: ${anchoredHash}, Recomputed: ${recomputedHash}`);
      }
      if (!orgMatch) {
        errors.push(`On-chain anchor org mismatch! Anchored org: ${anchoredOrg}, Claim org: ${claim.orgId}`);
      }
    } catch (err) {
      errors.push(`Blockchain anchor retrieval failed: ${err.message}`);
    }

    chainDetails.push({
      claimId: claim.claimId,
      version: claim.version,
      dbHash: claim.hash,
      recomputedHash,
      anchoredHash,
      signatureVerified: sigVerified,
      anchorVerified,
      tonnage: claim.tonnage
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
      try {
        const pAnchor = await blockchain.getAnchor(parent.claimId);
        pAnchoredHash = pAnchor.dataHash;
        pAnchorVerified = (pAnchoredHash.toLowerCase() === pRecomputedHash.toLowerCase()) && 
                          (pAnchor.orgAddress.toLowerCase() === parent.orgId.toLowerCase());
      } catch (e) {
        // Warning
      }

      chainDetails.push({
        claimId: parent.claimId,
        version: parent.version,
        dbHash: parent.hash,
        recomputedHash: pRecomputedHash,
        anchoredHash: pAnchoredHash,
        signatureVerified: pSigVerified,
        anchorVerified: pAnchorVerified,
        tonnage: parent.tonnage
      });

      if (!pDbHashMatches || !pSigVerified || !pAnchorVerified) {
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
      errors,
      chain: chainDetails.reverse() // Sort chronologically: oldest first
    });
  } catch (err) {
    console.error("Verification failed:", err);
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
    res.json(claims);
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
    res.json(claim);
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

module.exports = router;
