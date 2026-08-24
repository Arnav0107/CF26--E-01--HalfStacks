// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DataProvenance {
    struct Anchor {
        bytes32 dataHash;
        address owner;        // The address that submitted the blockchain transaction
        address orgAddress;   // The address of the organization claiming the data (from signature)
        uint256 timestamp;
    }

    // Maps claimId (hash) -> Anchor metadata
    mapping(bytes32 => Anchor) public anchors;

    event ClaimAnchored(
        bytes32 indexed claimId,
        bytes32 indexed dataHash,
        address indexed orgAddress,
        address owner,
        uint256 timestamp
    );

    /**
     * @notice Anchor a new environmental data claim.
     * @param claimId Unique identifier representing the claim (e.g. SHA-256 hash or UUID).
     * @param dataHash SHA-256 content hash of the canonical claim payload.
     * @param orgAddress The public address of the organization submitting the claim.
     */
    function anchorClaim(bytes32 claimId, bytes32 dataHash, address orgAddress) external {
        require(claimId != bytes32(0), "Claim ID cannot be empty");
        require(dataHash != bytes32(0), "Data hash cannot be empty");
        require(orgAddress != address(0), "Organization address cannot be empty");
        require(anchors[claimId].timestamp == 0, "Claim ID already anchored");

        anchors[claimId] = Anchor({
            dataHash: dataHash,
            owner: msg.sender,
            orgAddress: orgAddress,
            timestamp: block.timestamp
        });

        emit ClaimAnchored(claimId, dataHash, orgAddress, msg.sender, block.timestamp);
    }

    /**
     * @notice Get anchor details for a claim.
     */
    function getAnchor(bytes32 claimId) external view returns (bytes32 dataHash, address owner, address orgAddress, uint256 timestamp) {
        Anchor memory anchor = anchors[claimId];
        require(anchor.timestamp != 0, "Claim ID not found");
        return (anchor.dataHash, anchor.owner, anchor.orgAddress, anchor.timestamp);
    }
}
