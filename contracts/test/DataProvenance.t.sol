// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/DataProvenance.sol";

contract DataProvenanceTest is Test {
    DataProvenance public dataProvenance;

    // Test addresses
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public org1 = address(0x10);
    address public org2 = address(0x20);

    // Test data
    bytes32 public claimId1 = keccak256("claim-001");
    bytes32 public dataHash1 = sha256("original-payload-data");
    bytes32 public tamperedHash1 = sha256("tampered-payload-data");

    event ClaimAnchored(
        bytes32 indexed claimId,
        bytes32 indexed dataHash,
        address indexed orgAddress,
        address owner,
        uint256 timestamp
    );

    function setUp() public {
        dataProvenance = new DataProvenance();
    }

    /**
     * @notice Test 1: Verify correct anchoring of claims and matching state.
     */
    function testAnchorClaim() public {
        // Prank msg.sender to alice
        vm.prank(alice);
        
        // Expect the ClaimAnchored event to be emitted
        vm.expectEmit(true, true, true, true);
        emit ClaimAnchored(claimId1, dataHash1, org1, alice, block.timestamp);

        dataProvenance.anchorClaim(claimId1, dataHash1, org1);

        // Verify the stored state
        (bytes32 storedHash, address owner, address orgAddress, uint256 timestamp) = dataProvenance.getAnchor(claimId1);
        
        assertEq(storedHash, dataHash1);
        assertEq(owner, alice);
        assertEq(orgAddress, org1);
        assertEq(timestamp, block.timestamp);
    }

    /**
     * @notice Test 2: Verify duplicate claimId is rejected.
     */
    function testCannotAnchorDuplicateClaimId() public {
        dataProvenance.anchorClaim(claimId1, dataHash1, org1);

        // Attempting to anchor the same claim ID again should fail
        vm.expectRevert("Claim ID already anchored");
        dataProvenance.anchorClaim(claimId1, dataHash1, org2);
    }

    /**
     * @notice Test 3: Verify a tamper scenario where recomputed hash of modified data fails integrity check.
     */
    function testTamperScenario() public {
        // Anchor the original clean data
        dataProvenance.anchorClaim(claimId1, dataHash1, org1);

        // Fetch anchored details
        (bytes32 anchoredHash, , , ) = dataProvenance.getAnchor(claimId1);

        // Off-chain client recomputes hash from "original" data: should match
        bytes32 clientRecomputedHashOriginal = sha256("original-payload-data");
        assertEq(anchoredHash, clientRecomputedHashOriginal);

        // Off-chain client recomputes hash from "tampered" data: should NOT match
        bytes32 clientRecomputedHashTampered = sha256("tampered-payload-data");
        assertTrue(anchoredHash != clientRecomputedHashTampered);
    }
}
