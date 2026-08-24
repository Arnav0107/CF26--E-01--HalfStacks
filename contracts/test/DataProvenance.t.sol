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
    bytes32 public dataHash2 = sha256("corrected-payload-data");
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
     * @notice Test 1: Verify correct anchoring of claims and ecrecover signer mapping with parentHash.
     */
    function testAnchorWithValidSignature_RecoversCorrectOrgAddress() public {
        bytes memory sig = generateSig(orgPrivateKey, dataHash1);

        // Genesis claim uses bytes32(0) as parentHash
        dataProvenance.anchorClaim(claimId1, dataHash1, bytes32(0), sig);

        // Verify the stored state
        (bytes32 storedHash, address owner, address storedOrgAddress, uint256 timestamp, bytes32 parentHash) = dataProvenance.getAnchor(claimId1);
        
        assertEq(storedHash, dataHash1);
        assertEq(owner, address(this));
        assertEq(storedOrgAddress, orgAddress);
        assertTrue(timestamp > 0);
        assertEq(parentHash, bytes32(0));
    }

    /**
     * @notice Test 2: Verify signature from wrong key records the actual signer.
     */
    function testAnchorWithSignatureFromWrongKey_StoresWrongSigner() public {
        bytes memory sig = generateSig(wrongPrivateKey, dataHash1);

        dataProvenance.anchorClaim(claimId1, dataHash1, bytes32(0), sig);

        (, , address storedOrgAddress, , ) = dataProvenance.getAnchor(claimId1);

        assertEq(storedOrgAddress, wrongOrgAddress);
        assertTrue(storedOrgAddress != orgAddress);
    }

    /**
     * @notice Test 3: Verify duplicate claimId is rejected.
     */
    function testDuplicateClaimIdReverts() public {
        bytes memory sig = generateSig(orgPrivateKey, dataHash1);
        dataProvenance.anchorClaim(claimId1, dataHash1, bytes32(0), sig);

        // Attempting to anchor the same claim ID again should fail
        vm.expectRevert("Claim ID already anchored");
        dataProvenance.anchorClaim(claimId1, dataHash1, bytes32(0), sig);
    }

    /**
     * @notice Test 4: Verify invalid signature length reverts.
     */
    function testInvalidSignatureLengthReverts() public {
        bytes memory shortSig = new bytes(64);
        
        vm.expectRevert("Invalid signature length");
        dataProvenance.anchorClaim(claimId1, dataHash1, bytes32(0), shortSig);

        bytes memory longSig = new bytes(66);
        
        vm.expectRevert("Invalid signature length");
        dataProvenance.anchorClaim(claimId1, dataHash1, bytes32(0), longSig);
    }

    /**
     * @notice Test 5: Verify signature check fails if dataHash is tampered after signing.
     */
    function testTamperedDataHashFailsSignatureCheck() public {
        bytes memory sig = generateSig(orgPrivateKey, dataHash1);

        dataProvenance.anchorClaim(claimId1, tamperedHash1, bytes32(0), sig);

        (, , address storedOrgAddress, , ) = dataProvenance.getAnchor(claimId1);

        assertTrue(storedOrgAddress != orgAddress);
    }

    /**
     * @notice Test 6: Verify correction claim anchoring stores and links parentHash correctly.
     */
    function testCorrectionClaimLinksParentHash() public {
        // 1. Genesis Claim
        bytes memory sig1 = generateSig(orgPrivateKey, dataHash1);
        dataProvenance.anchorClaim(claimId1, dataHash1, bytes32(0), sig1);
        
        // Retrieve hash to act as parentHash
        (bytes32 parentDigest, , , , ) = dataProvenance.getAnchor(claimId1);
        
        // 2. Correction Claim
        bytes memory sig2 = generateSig(orgPrivateKey, dataHash2);
        dataProvenance.anchorClaim(claimId2, dataHash2, parentDigest, sig2);
        
        // Retrieve and assert parentHash linkage
        (bytes32 storedHash, , address storedOrgAddress, , bytes32 parentHash) = dataProvenance.getAnchor(claimId2);
        assertEq(storedHash, dataHash2);
        assertEq(storedOrgAddress, orgAddress);
        assertEq(parentHash, parentDigest);
    }
}
