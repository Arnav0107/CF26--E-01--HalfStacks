# GreenProof - Decentralized Environmental Data Provenance Network

GreenProof is a decentralized environmental data provenance network prototype built for E-01 (Intelligent Systems Track). It implements a cryptographically auditable registry of carbon project claims, corrections, and disputes. 

---

## 1. Core Cryptographic Trust Model & Pipeline

GreenProof establishes a **consistent, cryptographically-provable pseudonymous identity (address-bound via ecrecover)**. An `OrgRegistry` smart contract is mapped as the stated extension point for real-world attestation.

### The Pipeline Sequence
1. **Canonicalization**: The JSON parameters (projectName, region, tonnage, methodology, etc.) are sorted alphabetically and serialized into a deterministic canonical string.
2. **Hashing**: The canonical payload is hashed with SHA-256 (`dataHash`).
3. **ECDSA Signing**: The hash is signed with the organization's private key (using the personal sign prefix `\x19Ethereum Signed Message:\n32`) to produce a signature string.
4. **On-Chain Anchoring**: The `DataProvenance` contract receives the `claimId`, `dataHash`, `parentHash`, and `signature`. It executes `ecrecover` over the message hash and signature, dynamically recovering the author's public address and mapping it as the immutable publisher on the ledger.
5. **Dynamic verification**: The audit engine walks the parent chain back to genesis, recomputing hashes and validating signatures at every step.

---

## 2. Directory Architecture

The repository is structured into the following folders:

* **`/contracts` (Foundry Smart Contracts)**:
  * `src/DataProvenance.sol`: Solidity smart contract executing signature validation and claim anchoring.
  * `src/OrgRegistry.sol`: Organization authorization records.
  * `script/Deploy.s.sol`: Deployment script for Anvil/local network.
* **`/backend` (Express.js REST API)**:
  * Manages claim ingestion, database updates, and dispute resolutions.
  * Dynamically maps demo keys for on-the-fly signing.
  * Automatically falls back to a local JSON file database if MongoDB is not running.
* **`/frontend` (React + Vite + Tailwind CSS)**:
  * High-performance dashboard visualizer.
  * Includes the **Register Claim** form, the 3-step **Update Claim** wizard (Diff review + 4-point verification checks), **Verify Signer** (ecrecover execution pane), and the **Tamper Lab** simulation.
* **`/ml-service` (Python Seeding)**:
  * `seed.py`: Seeding script that populates the registry with carbon credit records, signatures, and mock dispute claims.

---

## 3. Installation & Getting Started

### Prerequisites
Make sure you have the following installed:
- **Node.js** (v18+)
- **Python** (v3.8+)
- **Foundry** (for local blockchain node and contracts). Install via:
  ```bash
  curl -L https://foundry.paradigm.xyz | bash
  foundryup
  ```

---

### Step 1: Start the Local Blockchain Node (Anvil)
Anvil simulates a local Ethereum network on port 8545:
```bash
anvil --host 127.0.0.1 --port 8545
```
*(Leave this terminal running in the background).*

---

### Step 2: Compile & Deploy the Contracts
Navigate to `/contracts` and run the deployment script against Anvil:
```bash
cd contracts
# Build smart contracts
forge build

# Deploy contracts and output deployed addresses
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```
The script will write contract deployment addresses to `contracts/deployed_address.txt` and `contracts/deployed_orgregistry_address.txt`.

---

### Step 3: Install & Start Backend Services
1. Navigate to `/backend`, install dependencies, and start:
   ```bash
   cd ../backend
   npm install
   npm start
   ```
   *(The server will print its API base URL: `http://localhost:5000/api`)*

---

### Step 4: Seed the Database
In a new terminal window, seed initial carbon credits data using the python script:
```bash
cd ml-service
# Install required libraries
pip install eth-account requests

# Run seeder
python seed.py
```
*Note: The seeder introduces a 400ms transaction delay to prevent nonce collision errors on anvil.*

---

### Step 5: Install & Build the Frontend
1. Navigate to `/frontend` and install packages:
   ```bash
   cd ../frontend
   npm install
   ```
2. Build the production package (Vite builds statically to backend public directory):
   ```bash
   npm run build
   ```

---

## 4. Running the Web Application

With the backend running on `npm start`, open a web browser to:
👉 **`http://localhost:5000/`**

### Active Interactive Labs:
* **Environmental Claims Directory**: Lists claims. Identifies superseded claims and points to their corrections (e.g., `→ superseded by v2`).
* **Verify Signer**: Displays live, on-demand re-derivation of signatures to prove authorship.
* **Update Claim**: A 3-step wizard (Select target → Diff tonnage side-by-side → Live 4-Point cryptographic audit check).
* **Tamper Lab**:
  * **Tamper Data**: Mutates database records to observe integrity hash failures.
  * **Tamper Signature**: Simulated byte corruption of signature strings to verify authorship forgery rejection.
* **Disputes Panel**: Tests multi-org disputes when two organizations lodge conflicting tonnage assessments on the same Project ID.
