// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/DataProvenance.sol";

contract DataProvenanceTest is Test {
    DataProvenance public dataProvenance;

    // Test Private Keys and Addresses
    uint256 public orgPrivateKey = 0x1010101010101010101010101010101010101010101010101010101010101010;
    address public orgAddress;

    uint256 public wrongPrivateKey = 0x2020202020202020202020202020202020202020202020202020202020202020;
    address public wrongOrgAddress;

    // Test Data
    bytes32 public claimId1 = keccak256("claim-001");
    bytes32 public claimId2 = keccak256("claim-002");
    bytes32 public dataHash1 = sha256("original-payload-data");
    bytes32 public tamperedHash1 = sha256("tampered-payload-data");

    function setUp() public {
        dataProvenance = new DataProvenance();
        orgAddress = vm.addr(orgPrivateKey);
        wrongOrgAddress = vm.addr(wrongPrivateKey);
    }

    /**
     * @notice Helper to generate Ethereum-signed message signature in Foundry.
     */
    function generateSig(uint256 privateKey, bytes32 dataHash) internal pure returns (bytes memory) {
        bytes32 messageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", dataHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, messageHash);
        return abi.encodePacked(r, s, v);
    }

    /**
     * @notice Test 1: Verify correct anchoring of claims and ecrecover signer mapping.
     */
    function testAnchorWithValidSignature_RecoversCorrectOrgAddress() public {
        bytes memory sig = generateSig(orgPrivateKey, dataHash1);

        dataProvenance.anchorClaim(claimId1, dataHash1, sig);

        // Verify the stored state
        (bytes32 storedHash, address owner, address storedOrgAddress, uint256 timestamp) = dataProvenance.getAnchor(claimId1);
        
        assertEq(storedHash, dataHash1);
        assertEq(owner, address(this));
        assertEq(storedOrgAddress, orgAddress);
        assertTrue(timestamp > 0);
    }

    /**
     * @notice Test 2: Verify signature from wrong key records the actual signer, not spoofed one.
     */
    function testAnchorWithSignatureFromWrongKey_StoresWrongSigner() public {
        // Sign with wrongPrivateKey
        bytes memory sig = generateSig(wrongPrivateKey, dataHash1);

        dataProvenance.anchorClaim(claimId1, dataHash1, sig);

        (, , address storedOrgAddress, ) = dataProvenance.getAnchor(claimId1);

        // It should record the wrongOrgAddress because that is who signed it.
        // There is no address parameter to spoof.
        assertEq(storedOrgAddress, wrongOrgAddress);
        assertTrue(storedOrgAddress != orgAddress);
    }

    /**
     * @notice Test 3: Verify duplicate claimId is rejected.
     */
    function testDuplicateClaimIdReverts() public {
        bytes memory sig = generateSig(orgPrivateKey, dataHash1);
        dataProvenance.anchorClaim(claimId1, dataHash1, sig);

        // Attempting to anchor the same claim ID again should fail
        vm.expectRevert("Claim ID already anchored");
        dataProvenance.anchorClaim(claimId1, dataHash1, sig);
    }

    /**
     * @notice Test 4: Verify invalid signature length reverts.
     */
    function testInvalidSignatureLengthReverts() public {
        bytes memory shortSig = new bytes(64); // Invalid length (64 instead of 65)
        
        vm.expectRevert("Invalid signature length");
        dataProvenance.anchorClaim(claimId1, dataHash1, shortSig);

        bytes memory longSig = new bytes(66); // Invalid length (66 instead of 65)
        
        vm.expectRevert("Invalid signature length");
        dataProvenance.anchorClaim(claimId1, dataHash1, longSig);
    }

    /**
     * @notice Test 5: Verify signature check fails if dataHash is tampered after signing.
     */
    function testTamperedDataHashFailsSignatureCheck() public {
        // Sign dataHash1
        bytes memory sig = generateSig(orgPrivateKey, dataHash1);

        // Anchor with tamperedHash1 but using the signature generated for dataHash1.
        // ecrecover will reconstruct hash using tamperedHash1 and recover a garbage address.
        dataProvenance.anchorClaim(claimId1, tamperedHash1, sig);

        (, , address storedOrgAddress, ) = dataProvenance.getAnchor(claimId1);

        // Stored orgAddress will be some random recovered address, NOT the orgAddress.
        // Downstream consumers comparing storedOrgAddress to claim.orgId will flag the mismatch.
        assertTrue(storedOrgAddress != orgAddress);
    }
}
