// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract OrgRegistry {
    address public owner;
    
    // Mapping from organization public address to attested organization name
    mapping(address => string) public orgNames;

    event OrgRegistered(address indexed org, string name);

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Register or update an organization's attested name.
     * @param org The organization's public address.
     * @param name The attested name of the organization.
     */
    function registerOrg(address org, string calldata name) external onlyOwner {
        require(org != address(0), "Invalid organization address");
        orgNames[org] = name;
        emit OrgRegistered(org, name);
    }
}
