// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DataProvenance {
    struct Anchor {
        bytes32 dataHash;
        address owner;        // The address that submitted the blockchain transaction (msg.sender)
        address orgAddress;   // The address of the organization, derived on-chain via signature verification
        uint256 timestamp;
        bytes32 parentHash;   // Hash of the parent version (or bytes32(0) if genesis)
    }

    // Maps claimId (hash) -> Anchor metadata
    mapping(bytes32 => Anchor) public anchors;

    event ClaimAnchored(
        bytes32 indexed claimId,
        bytes32 indexed dataHash,
        address indexed orgAddress,
        address owner,
        uint256 timestamp,
        bytes32 parentHash
    );

    /**
     * @notice Anchor a new environmental data claim.
     * @param claimId Unique identifier representing the claim.
     * @param dataHash SHA-256 content hash of the canonical claim payload.
     * @param parentHash Hash of the parent version (or bytes32(0) if genesis).
     * @param signature The 65-byte ECDSA signature over the dataHash signed by the organization.
     */
    function anchorClaim(bytes32 claimId, bytes32 dataHash, bytes32 parentHash, bytes calldata signature) external {
        require(claimId != bytes32(0), "Claim ID cannot be empty");
        require(dataHash != bytes32(0), "Data hash cannot be empty");
        require(anchors[claimId].timestamp == 0, "Claim ID already anchored");
        require(signature.length == 65, "Invalid signature length");

        // Split signature into r, s, v
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 0x20))
            v := byte(0, calldataload(add(signature.offset, 0x40)))
        }

        // Normalize v value (standard Ethereum is 27 or 28, but some signers return 0 or 1)
        if (v < 27) {
            v += 27;
        }

        require(v == 27 || v == 28, "Invalid signature v value");

        // Reconstruct the Ethereum Signed Message hash (matching ethers.verifyMessage)
        bytes32 messageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", dataHash));

        // Cryptographically recover the submitting organization's public address
        address recoveredAddress = ecrecover(messageHash, v, r, s);
        require(recoveredAddress != address(0), "Invalid signature");

        anchors[claimId] = Anchor({
            dataHash: dataHash,
            owner: msg.sender,
            orgAddress: recoveredAddress,
            timestamp: block.timestamp,
            parentHash: parentHash
        });

        emit ClaimAnchored(claimId, dataHash, recoveredAddress, msg.sender, block.timestamp, parentHash);
    }

    /**
     * @notice Get anchor details for a claim.
     */
    function getAnchor(bytes32 claimId) external view returns (
        bytes32 dataHash,
        address owner,
        address orgAddress,
        uint256 timestamp,
        bytes32 parentHash
    ) {
        Anchor memory anchor = anchors[claimId];
        require(anchor.timestamp != 0, "Claim ID not found");
        return (anchor.dataHash, anchor.owner, anchor.orgAddress, anchor.timestamp, anchor.parentHash);
    }
}
