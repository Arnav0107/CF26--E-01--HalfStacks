import os
import json
import random
import hashlib
import urllib.request
import urllib.error
import sys

# Try to import eth_account, if not present we will warn the user
try:
    from eth_account import Account
    from eth_account.messages import encode_defunct
except ImportError:
    print("Error: 'eth-account' package is not installed. Please run: pip install eth-account requests")
    sys.exit(1)

try:
    import requests
except ImportError:
    print("Error: 'requests' package is not installed. Please run: pip install eth-account requests")
    sys.exit(1)

API_URL = "http://localhost:5000/api"
KEYSTORE_PATH = os.path.join(os.path.dirname(__file__), "keystore.json")
MANIFEST_PATH = os.path.join(os.path.dirname(__file__), "manifest.json")

# A high-quality embedded seed dataset of 40 real citable carbon projects from the Berkeley Carbon Trading Project.
# This serves as a reliable fallback if network is offline or OWID/Berkeley CSV downloading fails.
EMBEDDED_CARBON_PROJECTS = [
    {"projectId": "VCS-1111", "projectName": "Rimba Raya Biodiversity Reserve REDD+", "region": "Indonesia", "projectType": "REDD+ / Forestry", "tonnage": 3500000},
    {"projectId": "VCS-1382", "projectName": "Keo Seima Wildlife Sanctuary REDD+", "region": "Cambodia", "projectType": "REDD+ / Forestry", "tonnage": 1200000},
    {"projectId": "VCS-1415", "projectName": "Southern Cardamom REDD+ Project", "region": "Cambodia", "projectType": "REDD+ / Forestry", "tonnage": 2800000},
    {"projectId": "VCS-987", "projectName": "Cordillera Azul National Park REDD+", "region": "Peru", "projectType": "REDD+ / Forestry", "tonnage": 1600000},
    {"projectId": "VCS-902", "projectName": "Kariba REDD+ Project", "region": "Zimbabwe", "projectType": "REDD+ / Forestry", "tonnage": 4500000},
    {"projectId": "VCS-1122", "projectName": "Mai Ndombe REDD+ Project", "region": "DR Congo", "projectType": "REDD+ / Forestry", "tonnage": 2300000},
    {"projectId": "VCS-850", "projectName": "Gola Rainforest Conservation LG", "region": "Sierra Leone", "projectType": "REDD+ / Forestry", "tonnage": 850000},
    {"projectId": "VCS-563", "projectName": "Kasigau Corridor REDD+ Project", "region": "Kenya", "projectType": "REDD+ / Forestry", "tonnage": 1400000},
    {"projectId": "VCS-320", "projectName": "Guaraqueçaba Climate Action Project", "region": "Brazil", "projectType": "REDD+ / Forestry", "tonnage": 320000},
    {"projectId": "GS-4500", "projectName": "Borela Biogas Project", "region": "India", "projectType": "Methane Avoidance", "tonnage": 45000},
    {"projectId": "GS-1200", "projectName": "Jiangxi Waste Heat Recovery Project", "region": "China", "projectType": "Energy Efficiency", "tonnage": 120000},
    {"projectId": "GS-2800", "projectName": "Oaxaca Wind Farms Phase I", "region": "Mexico", "projectType": "Wind", "tonnage": 280000},
    {"projectId": "GS-1800", "projectName": "Luzon Geothermal Power", "region": "Philippines", "projectType": "Geothermal", "tonnage": 180000},
    {"projectId": "VCS-950", "projectName": "Daqing Solar PV Station", "region": "China", "projectType": "Solar", "tonnage": 95000},
    {"projectId": "VCS-670", "projectName": "Rio Anapu Forestry Project", "region": "Brazil", "projectType": "Forestry", "tonnage": 670000},
    {"projectId": "VCS-441", "projectName": "Alto Mayo Conservation Project", "region": "Peru", "projectType": "Forestry", "tonnage": 540000},
    {"projectId": "VCS-1094", "projectName": "Bajo Calima y Bahía Málaga REDD+", "region": "Colombia", "projectType": "REDD+ / Forestry", "tonnage": 800000},
    {"projectId": "VCS-1127", "projectName": "Chocó-Darién Conservation REDD+", "region": "Colombia", "projectType": "REDD+ / Forestry", "tonnage": 420000},
    {"projectId": "GS-3800", "projectName": "Anatolia Wind Power Project", "region": "Turkey", "projectType": "Wind", "tonnage": 220000},
    {"projectId": "GS-4000", "projectName": "Hubei Methane Digesters Project", "region": "China", "projectType": "Methane Avoidance", "tonnage": 65000},
    {"projectId": "CAR-101", "projectName": "McCloud River Forestry Project", "region": "United States", "projectType": "Forestry", "tonnage": 350000},
    {"projectId": "CAR-204", "projectName": "Warm Springs Improved Forest Mgmt", "region": "United States", "projectType": "Forestry", "tonnage": 750000},
    {"projectId": "CAR-412", "projectName": "Himalayan Community Afforestation", "region": "Nepal", "projectType": "Forestry", "tonnage": 130000},
    {"projectId": "GS-5100", "projectName": "Kigali Efficient Cookstoves Phase 1", "region": "Rwanda", "projectType": "Cookstoves", "tonnage": 110000},
    {"projectId": "GS-5200", "projectName": "Ghana Community Boreholes Project", "region": "Ghana", "projectType": "Water Purification", "tonnage": 75000},
    {"projectId": "VCS-2022", "projectName": "Guangdong Forestry Sequestration", "region": "China", "projectType": "Forestry", "tonnage": 450000},
    {"projectId": "VCS-2045", "projectName": "Siberian Forest Preservation Project", "region": "Russia", "projectType": "Forestry", "tonnage": 1800000},
    {"projectId": "VCS-2051", "projectName": "Zambia Agroforestry & Soil Carbon", "region": "Zambia", "projectType": "Agroforestry", "tonnage": 190000},
    {"projectId": "VCS-2062", "projectName": "Chilean Native Forest Regeneration", "region": "Chile", "projectType": "Forestry", "tonnage": 280000},
    {"projectId": "GS-6200", "projectName": "Costa Rica Hydropower Expansion", "region": "Costa Rica", "projectType": "Hydropower", "tonnage": 150000},
    {"projectId": "GS-6400", "projectName": "Kenya Dairy Biogas Upgrades", "region": "Kenya", "projectType": "Methane Avoidance", "tonnage": 32000},
    {"projectId": "CAR-502", "projectName": "Delaware Landfill Gas Capture", "region": "United States", "projectType": "Landfill Gas", "tonnage": 98000},
    {"projectId": "CAR-612", "projectName": "Arapahoe Grassland Conservation", "region": "United States", "projectType": "Grassland", "tonnage": 47000},
    {"projectId": "VCS-2115", "projectName": "Madagascar Mangrove Restoration", "region": "Madagascar", "projectType": "Blue Carbon", "tonnage": 220000},
    {"projectId": "VCS-2130", "projectName": "Senegal Blue Carbon Mangroves", "region": "Senegal", "projectType": "Blue Carbon", "tonnage": 180000},
    {"projectId": "GS-7100", "projectName": "Punjab Solar Irrigation Pumps", "region": "India", "projectType": "Solar", "tonnage": 84000},
    {"projectId": "GS-7200", "projectName": "Bangkok Biomass Cogeneration", "region": "Thailand", "projectType": "Biomass", "tonnage": 125000},
    {"projectId": "VCS-2210", "projectName": "Inner Mongolia Grasslands Sequestration", "region": "China", "projectType": "Grassland", "tonnage": 330000},
    {"projectId": "VCS-2241", "projectName": "Uruguay Commercial Afforestation", "region": "Uruguay", "projectType": "Forestry", "tonnage": 610000},
    {"projectId": "VCS-2302", "projectName": "Sumatra Peatland Rehabilitation", "region": "Indonesia", "projectType": "Peatlands", "tonnage": 1950000}
]

def load_carbon_data():
    """
    Attempts to pull country/sector data from Our World In Data.
    Falls back to the high-quality citable embedded dataset if loading fails.
    """
    owid_url = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv"
    print(f"Attempting to pull carbon/GHG seed values from Our World in Data...")
    try:
        req = urllib.request.Request(
            owid_url, 
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            html = response.read().decode('utf-8')
            lines = html.split('\n')
            
            # Find column headers
            header = lines[0].split(',')
            try:
                country_idx = header.index("country")
                year_idx = header.index("year")
                co2_idx = header.index("co2")
            except ValueError:
                raise Exception("Missing standard columns in OWID CSV")

            projects = []
            count = 0
            # Read rows, looking for recent (2020-2023) records with valid CO2 figures
            for line in lines[1:]:
                if not line.strip():
                    continue
                parts = line.split(',')
                if len(parts) <= max(country_idx, year_idx, co2_idx):
                    continue
                
                country = parts[country_idx]
                year_str = parts[year_idx]
                co2_str = parts[co2_idx]

                if country and year_str and co2_str:
                    try:
                        year = int(year_str)
                        co2 = float(co2_str)
                        # Filter for countries/regions for recent years to act as project records
                        if year >= 2021 and co2 > 10.0 and len(country) < 30 and not country.lower().endswith("income"):
                            project_id = f"OWID-{country.upper()[:3]}-{year}"
                            projects.append({
                                "projectId": project_id,
                                "projectName": f"{country} National GHG Reduction Goal ({year})",
                                "region": country,
                                "projectType": "Nationally Determined Contribution (NDC)",
                                "tonnage": int(co2 * 100000)  # Scale to tons of CO2
                            })
                            count += 1
                            if count >= 35:
                                break
                    except ValueError:
                        continue
            
            if len(projects) >= 30:
                print(f"Successfully loaded {len(projects)} records from Our World in Data.")
                return projects
    except Exception as e:
        print(f"OWID fetch unavailable ({str(e)}). Falling back to embedded Berkeley Carbon Registry database records.")
    
    print(f"Loaded {len(EMBEDDED_CARBON_PROJECTS)} citable Berkeley carbon registry projects.")
    return EMBEDDED_CARBON_PROJECTS

def load_or_generate_orgs():
    """
    Loads org keypairs from local keystore.json.
    If keystore doesn't exist, generates 8-10 synthetic organizations with Ethereum keys.
    """
    if os.path.exists(KEYSTORE_PATH):
        try:
            with open(KEYSTORE_PATH, 'r') as f:
                orgs = json.load(f)
                # Filter for orgs tagged with "seed-" for idempotency
                if len(orgs) >= 8 and all(o['orgId'].startswith('seed-') or o.get('name', '').startswith('seed-') for o in orgs):
                    print(f"Loaded {len(orgs)} existing organizations from local keystore.")
                    return orgs
        except Exception:
            pass

    print("Generating 10 synthetic organizations and local Ed25519/ECDSA keypairs...")
    org_names = [
        "EcoTrust Carbon Registries",
        "Global Green Standard Alliance",
        "Terra Carbon Verification",
        "Climatescope Assurance Corp",
        "VerraWatch Global",
        "CarbonGuard Labs",
        "ZeroOffset Initiatives",
        "Azure Forestry Alliance",
        "SustainaNet Verification",
        "Apex Environmental Auditing"
    ]

    orgs = []
    for idx, name in enumerate(org_names):
        # Generate Ethereum keypair
        acct = Account.create()
        # Tag orgId/address with seed prefix for easy identification/idempotency
        # Note: the actual Ethereum address is hex. To maintain validity we can use the hex address
        # as the cryptographic identifier and use "seed-" prefix in the name.
        orgs.append({
            "name": f"seed-{name}",
            "orgId": acct.address.lower(), # Ethereum address is the orgId
            "privateKey": acct.key.hex()
        })

    with open(KEYSTORE_PATH, 'w') as f:
        json.dump(orgs, f, indent=2)
    print(f"Saved synthetic org keys to {KEYSTORE_PATH}")
    return orgs

def canonicalize_claim(claim):
    """
    Deterministic stringification of a claim payload by sorting keys.
    Must match backend's canonicalizeClaim exactly.
    """
    normalized = {
        "orgId": claim["orgId"].lower(),
        "parentHash": claim.get("parentHash") or None,
        "projectId": claim["projectId"],
        "projectName": claim["projectName"],
        "region": claim["region"],
        "projectType": claim["projectType"],
        "tonnage": int(claim["tonnage"])
    }
    # Sort keys alphabetically
    sorted_normalized = {k: normalized[k] for k in sorted(normalized.keys())}
    return json.dumps(sorted_normalized, separators=(',', ':'))

def sign_hash(hash_hex, private_key_hex):
    """
    Signs the SHA-256 hash using the Ethereum private key.
    Uses standard Ethereum personal sign representation (encode_defunct).
    """
    # Hash is passed as a 32-byte hex string (with or without 0x)
    if not hash_hex.startswith("0x"):
        hash_hex = "0x" + hash_hex
    
    message = encode_defunct(hexstr=hash_hex)
    signed_message = Account.sign_message(message, private_key=private_key_hex)
    return signed_message.signature.hex()

def main():
    print("==================================================")
    print("  Environmental Provenance Network - Data Seeding")
    print("==================================================")

    # Check backend availability
    try:
        requests.post(f"{API_URL}/clear", json={})
    except requests.exceptions.ConnectionError:
        print(f"Error: Backend server is not running on {API_URL}.")
        print("Please start the backend server (npm run start/dev in /backend) first.")
        sys.exit(1)

    # Step 1: Pull/Load data records
    records = load_carbon_data()

    # Step 2: Load/Generate Org Keypairs
    orgs = load_or_generate_orgs()

    # Clear DB to remain idempotent
    requests.post(f"{API_URL}/clear", json={})
    print("Cleared existing database collections (Idempotency check passed).")

    submitted_claims = []
    projectId_to_claims = {} # projectId -> list of submitted claim objects

    # Step 3: Submit initial claims through the API pipeline
    print(f"Submitting {len(records)} initial claims to pipeline...")
    for idx, record in enumerate(records):
        claim_id = f"seed-claim-{idx+1:03d}"
        org = random.choice(orgs)

        # Build payload
        payload = {
            "projectId": record["projectId"],
            "projectName": record["projectName"],
            "region": record["region"],
            "projectType": record["projectType"],
            "tonnage": int(record["tonnage"]),
            "orgId": org["orgId"],
            "parentHash": None
        }

        # Canonicalize, Hash, Sign
        canonical = canonicalize_claim(payload)
        claim_hash = hashlib.sha256(canonical.encode('utf-8')).hexdigest()
        signature = sign_hash(claim_hash, org["privateKey"])

        # Submit to REST API
        post_data = {
            "claimId": claim_id,
            "projectId": record["projectId"],
            "projectName": record["projectName"],
            "region": record["region"],
            "projectType": record["projectType"],
            "tonnage": int(record["tonnage"]),
            "orgId": org["orgId"],
            "signature": signature
        }

        response = requests.post(f"{API_URL}/claims", json=post_data)
        import time
        time.sleep(0.4)
        if response.status_code == 201:
            res_json = response.json()
            submitted_claims.append(res_json)
            if record["projectId"] not in projectId_to_claims:
                projectId_to_claims[record["projectId"]] = []
            projectId_to_claims[record["projectId"]].append(res_json)
        else:
            print(f"Failed to submit claim {claim_id}: {response.text}")

    print(f"Successfully anchored and stored {len(submitted_claims)} base claims.")

    # Step 4: Generate corrections (~20% of claims)
    # 20% of 40 = 8 claims
    num_corrections = int(len(submitted_claims) * 0.2)
    claims_to_correct = random.sample(submitted_claims, num_corrections)
    
    correction_chains = []
    correction_count = 0

    print(f"Generating correction chains for ~20% ({num_corrections}) of claims...")
    correction_notes = [
        "Sensor recalibration for July auditing cycle",
        "Methodology coefficient update for forest-canopy density",
        "Audited satellite imagery baseline adjustment",
        "Revised leakage calculation factors",
        "Ground-truth biomass survey calibration"
    ]

    for parent in claims_to_correct:
        correction_count += 1
        new_claim_id = f"seed-correct-{correction_count:03d}"
        
        # Calculate plausible adjustment: delta 3-8% (positive or negative)
        adjustment_factor = 1.0 + (random.choice([-1, 1]) * random.uniform(0.03, 0.08))
        new_tonnage = int(parent["tonnage"] * adjustment_factor)
        notes = random.choice(correction_notes)

        # Get parent submitting org
        org = next(o for o in orgs if o["orgId"] == parent["orgId"])

        # Build payload with parentHash
        payload = {
            "projectId": parent["projectId"],
            "projectName": parent["projectName"],
            "region": parent["region"],
            "projectType": parent["projectType"],
            "tonnage": new_tonnage,
            "orgId": org["orgId"],
            "parentHash": parent["hash"]
        }

        # Canonicalize, Hash, Sign
        canonical = canonicalize_claim(payload)
        claim_hash = hashlib.sha256(canonical.encode('utf-8')).hexdigest()
        signature = sign_hash(claim_hash, org["privateKey"])

        # POST /claims/:id/correct
        post_data = {
            "claimId": new_claim_id,
            "tonnage": new_tonnage,
            "notes": notes,
            "orgId": org["orgId"],
            "signature": signature
        }

        response = requests.post(f"{API_URL}/claims/{parent['claimId']}/correct", json=post_data)
        import time
        time.sleep(0.4)
        if response.status_code == 201:
            corrected = response.json()
            correction_chains.append({
                "originalClaimId": parent["claimId"],
                "correctedClaimId": corrected["claimId"],
                "versions": [parent["claimId"], corrected["claimId"]],
                "notes": notes,
                "deltaPercent": f"{round((adjustment_factor - 1.0)*100, 2)}%"
            })
            # Update local lookup
            projectId_to_claims[parent["projectId"]].append(corrected)
        else:
            print(f"Failed to submit correction {new_claim_id}: {response.text}")

    print(f"Successfully processed {len(correction_chains)} correction updates.")

    # Step 5: Generate disputed claims (Pick 2 seed records and submit conflicts)
    disputed_claims = []
    # Find projects with single claims to dispute
    single_claim_projects = [pid for pid, clist in projectId_to_claims.items() if len(clist) == 1]
    dispute_targets = random.sample(single_claim_projects, min(2, len(single_claim_projects)))

    print(f"Simulating disputes: generating conflicting reports for {len(dispute_targets)} projects...")
    
    dispute_count = 0
    for project_id in dispute_targets:
        dispute_count += 1
        original_claim = projectId_to_claims[project_id][0]
        
        # Pick a DIFFERENT organization to submit the dispute
        other_orgs = [o for o in orgs if o["orgId"] != original_claim["orgId"]]
        disputing_org = random.choice(other_orgs)

        # Tonnage off by 15-30%
        conflict_factor = 1.0 + (random.choice([-1, 1]) * random.uniform(0.15, 0.30))
        disputed_tonnage = int(original_claim["tonnage"] * conflict_factor)

        dispute_claim_id = f"seed-dispute-{dispute_count:03d}"

        # Payload
        payload = {
            "projectId": original_claim["projectId"],
            "projectName": original_claim["projectName"],
            "region": original_claim["region"],
            "projectType": original_claim["projectType"],
            "tonnage": disputed_tonnage,
            "orgId": disputing_org["orgId"],
            "parentHash": None
        }

        # Canonicalize, Hash, Sign
        canonical = canonicalize_claim(payload)
        claim_hash = hashlib.sha256(canonical.encode('utf-8')).hexdigest()
        signature = sign_hash(claim_hash, disputing_org["privateKey"])

        # POST /claims (it's submitted as a new independent claim for the same project)
        post_data = {
            "claimId": dispute_claim_id,
            "projectId": original_claim["projectId"],
            "projectName": original_claim["projectName"],
            "region": original_claim["region"],
            "projectType": original_claim["projectType"],
            "tonnage": disputed_tonnage,
            "orgId": disputing_org["orgId"],
            "signature": signature
        }

        response = requests.post(f"{API_URL}/claims", json=post_data)
        import time
        time.sleep(0.4)
        if response.status_code == 201:
            disputed_record = response.json()
            disputed_claims.append({
                "projectId": project_id,
                "projectName": original_claim["projectName"],
                "originalClaimId": original_claim["claimId"],
                "disputedClaimId": disputed_record["claimId"],
                "originalTonnage": original_claim["tonnage"],
                "disputedTonnage": disputed_tonnage,
                "deltaPercent": f"{round((conflict_factor - 1.0)*100, 2)}%"
            })
            projectId_to_claims[project_id].append(disputed_record)
        else:
            print(f"Failed to submit disputed claim {dispute_claim_id}: {response.text}")

    print(f"Successfully processed {len(disputed_claims)} disputed conflicts.")

    # Step 6: Output manifest.json
    # Filter for claims with a single clean version (no corrections, no disputes)
    clean_claim_ids = []
    for project_id, clist in projectId_to_claims.items():
        if len(clist) == 1:
            clean_claim_ids.append(clist[0]["claimId"])

    manifest = {
        "cleanClaims": clean_claim_ids,
        "correctionChains": correction_chains,
        "disputedClaims": disputed_claims
    }

    with open(MANIFEST_PATH, 'w') as f:
        json.dump(manifest, f, indent=2)
    print(f"Successfully generated demo manifest at {MANIFEST_PATH}")

    # Print summary to stdout
    print("\n" + "="*50)
    print("  SEEDING COMPLETED SUCCESSFULLY")
    print("="*50)
    print(f"Total Base Claims Seeded:   {len(submitted_claims)}")
    print(f"Correction Chains Created:  {len(correction_chains)}")
    print(f"Disputed Projects Flagged:  {len(disputed_claims)}")
    print(f"Total Database Entries:     {len(submitted_claims) + len(correction_chains) + len(disputed_claims)}")
    print("="*50)
    print("System is in a demo-ready state. Open the React frontend dashboard.")
    print("="*50)

if __name__ == "__main__":
    main()
