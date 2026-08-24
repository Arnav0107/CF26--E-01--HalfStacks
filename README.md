# GreenProof - Decentralized Environmental Data Provenance Network

GreenProof is a decentralized environmental data provenance prototype that implements a cryptographically auditable registry of carbon project claims, corrections, and disputes. 

## Technical Defense: On-Chain Trust Model Upgrade

The E-01 provenance network utilizes an **on-chain verified trust model** to enforce organizational identity at the smart contract level, satisfying E-01's key requirements of *verifiable organizational identities* and *independent verification*.

### How It Works
1. **Cryptographic Bindings**: Instead of accepting a trusted, unverified `orgAddress` parameter as an assertion of identity, the smart contract's anchoring function relies on cryptographic proof:
   ```solidity
   function anchorClaim(bytes32 claimId, bytes32 dataHash, bytes calldata signature) external
   ```
2. **On-Chain Recovery**: Inside `DataProvenance.sol`, the contract reconstructs the standard Ethereum Signed Message hash from the canonical content `dataHash`:
   ```solidity
   bytes32 messageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", dataHash));
   ```
3. **ECDSA ecrecover Verification**: The contract splits the 65-byte signature into standard ECDSA parameters (`r`, `s`, `v`), normalizes `v` if needed, and calls the native `ecrecover` precompile:
   ```solidity
   address recoveredAddress = ecrecover(messageHash, v, r, s);
   require(recoveredAddress != address(0), "Invalid signature");
   ```
4. **Derived Identity**: The contract records `recoveredAddress` as the absolute, cryptographically-proven `orgAddress` for that claim anchor. This removes the backend server as a trusted gatekeeper for identity validation. Downstream verifiers can audit the blockchain anchor independently to confirm which organization signed the data without trusting any central database or API.

---

## Directory Architecture

The prototype contains the following components:

- **`/contracts` (Foundry)**
  - `src/DataProvenance.sol`: Upgraded Solidity smart contract executing on-chain signature verification.
  - `test/DataProvenance.t.sol`: Forge solidity tests utilizing the `vm.sign` cheatcode to verify valid signatures, invalid signature length, and tampered data hash detection.
  - `script/Deploy.s.sol`: Solidity deployment script.
- **`/backend` (Express.js REST API)**
  - Implements the data ingestion pipeline.
  - Supports standard REST endpoints, a backdoor tampering test endpoint, and a dedicated audit verification endpoint (`GET /api/claims/:id/verify`) which outputs `"anchorIdentitySource": "on-chain-ecrecover"`.
  - Automatically falls back to a local file-based JSON store if MongoDB is offline.
- **`/ml-service` (Python Seeding Script)**
  - `seed.py`: End-to-end data pipeline script. Fetching GHG emissions records, generating organization keypairs, signing payloads, and submitting claims, corrections, and disputes.
- **`/frontend` (React + Tailwind CSS)**
  - Sleek dark-mode dashboard showing summary metrics, claims, timeline tree ancestry visualizer, disputes comparisons, and an interactive **Tamper Lab** for real-time validation.

---

## Getting Started

### 1. Prerequisites
Ensure you have the following installed:
- Node.js (v18+)
- Python (v3.8+)

### 2. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Run the Seeding Script
Start the backend Express server first:
```bash
cd backend
npm start
```
Then run the seeding script in another terminal:
```bash
# Install Python packages
pip install eth-account requests

# Run seed script
cd ../ml-service
python seed.py
```

### 4. Launch the Application
With the backend running, open a web browser to:
`http://localhost:5000/`

You will see the claims directory, correction chains, disputes, and the interactive **Tamper Lab**.
