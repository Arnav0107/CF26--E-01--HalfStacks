const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/environmental_provenance";
let useMongo = false;

// Mongoose Models
let ClaimModel;
let OrgModel;

// File-based backup paths
const CLAIMS_FILE = path.join(__dirname, '..', 'db_claims.json');
const ORGS_FILE = path.join(__dirname, '..', 'db_orgs.json');

// Initialize empty files if they don't exist
if (!fs.existsSync(CLAIMS_FILE)) fs.writeFileSync(CLAIMS_FILE, JSON.stringify([]));
if (!fs.existsSync(ORGS_FILE)) fs.writeFileSync(ORGS_FILE, JSON.stringify([]));

function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Failed to write to ${filePath}:`, err);
  }
}

// Connect to Database
async function connectDB() {
  try {
    console.log(`Attempting MongoDB connection at ${MONGODB_URI}...`);
    // Set connection timeout to 3 seconds for fast fallback
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000
    });
    useMongo = true;
    console.log("Connected to MongoDB successfully!");
  } catch (err) {
    console.warn("MongoDB connection failed! Falling back to Local JSON database...");
    useMongo = false;
  }

  // Define Mongoose Models (always compile, but only use if useMongo is true)
  const ClaimSchema = new mongoose.Schema({
    claimId: { type: String, required: true, unique: true },
    projectId: { type: String, required: true },
    projectName: { type: String, required: true },
    region: { type: String, required: true },
    projectType: { type: String, required: true },
    tonnage: { type: Number, required: true },
    orgId: { type: String, required: true },
    hash: { type: String, required: true },
    signature: { type: String, required: true },
    parentHash: { type: String, default: null },
    version: { type: Number, default: 1 },
    status: { type: String, enum: ['active', 'superseded', 'disputed'], default: 'active' },
    txHash: { type: String, required: true },
    anchored: { type: Boolean, default: false },
    blockchainMode: { type: String, enum: ['on-chain', 'mock'], default: 'mock' },
    timestamp: { type: Number, required: true },
    notes: { type: String, default: '' }
  });

  const OrgSchema = new mongoose.Schema({
    orgId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    publicKey: { type: String, required: true }
  });

  // Check if models are already compiled to prevent mongoose error on reload
  ClaimModel = mongoose.models.Claim || mongoose.model('Claim', ClaimSchema);
  OrgModel = mongoose.models.Org || mongoose.model('Org', OrgSchema);
}

// DB Operations
const db = {
  // Claims CRUD
  async saveClaim(claimData) {
    if (useMongo) {
      const claim = new ClaimModel(claimData);
      return await claim.save();
    } else {
      const claims = readJsonFile(CLAIMS_FILE);
      // Remove any existing with same claimId to prevent duplicates
      const filtered = claims.filter(c => c.claimId !== claimData.claimId);
      filtered.push(claimData);
      writeJsonFile(CLAIMS_FILE, filtered);
      return claimData;
    }
  },

  async updateClaimStatus(claimId, status) {
    if (useMongo) {
      return await ClaimModel.findOneAndUpdate({ claimId }, { status }, { new: true });
    } else {
      const claims = readJsonFile(CLAIMS_FILE);
      const claim = claims.find(c => c.claimId === claimId);
      if (claim) {
        claim.status = status;
        writeJsonFile(CLAIMS_FILE, claims);
      }
      return claim;
    }
  },

  async getClaimById(claimId) {
    if (useMongo) {
      return await ClaimModel.findOne({ claimId }).lean();
    } else {
      const claims = readJsonFile(CLAIMS_FILE);
      return claims.find(c => c.claimId === claimId) || null;
    }
  },

  async findClaims(filter = {}) {
    if (useMongo) {
      return await ClaimModel.find(filter).lean();
    } else {
      let claims = readJsonFile(CLAIMS_FILE);
      return claims.filter(c => {
        for (let key in filter) {
          if (c[key] !== filter[key]) return false;
        }
        return true;
      });
    }
  },

  // Orgs CRUD
  async saveOrg(orgData) {
    if (useMongo) {
      const org = new OrgModel(orgData);
      return await org.save();
    } else {
      const orgs = readJsonFile(ORGS_FILE);
      const filtered = orgs.filter(o => o.orgId !== orgData.orgId);
      filtered.push(orgData);
      writeJsonFile(ORGS_FILE, filtered);
      return orgData;
    }
  },

  async getOrgById(orgId) {
    if (useMongo) {
      return await OrgModel.findOne({ orgId }).lean();
    } else {
      const orgs = readJsonFile(ORGS_FILE);
      return orgs.find(o => o.orgId === orgId) || null;
    }
  },

  async findOrgs() {
    if (useMongo) {
      return await OrgModel.find({}).lean();
    } else {
      return readJsonFile(ORGS_FILE);
    }
  },

  // Database maintenance
  async clearAll() {
    if (useMongo) {
      await ClaimModel.deleteMany({});
      await OrgModel.deleteMany({});
    } else {
      writeJsonFile(CLAIMS_FILE, []);
      writeJsonFile(ORGS_FILE, []);
    }
    console.log("Database cleared successfully.");
  },

  // Direct tamper method for Demo/TamperLab
  async tamperClaimTonnage(claimId, newTonnage) {
    if (useMongo) {
      return await ClaimModel.findOneAndUpdate({ claimId }, { tonnage: Number(newTonnage) }, { new: true });
    } else {
      const claims = readJsonFile(CLAIMS_FILE);
      const claim = claims.find(c => c.claimId === claimId);
      if (claim) {
        claim.tonnage = Number(newTonnage);
        writeJsonFile(CLAIMS_FILE, claims);
      }
      return claim;
    }
  }
};

module.exports = {
  connectDB,
  db,
  isUsingMongo: () => useMongo
};
