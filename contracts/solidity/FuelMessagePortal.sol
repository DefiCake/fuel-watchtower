// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @dev Emitted when a message is sent from Ethereum to Fuel
event MessageSent(bytes32 indexed sender, bytes32 indexed recipient, uint256 indexed nonce, uint64 amount, bytes data);

/// @dev Emitted when a message is successfully relayed to Ethereum from Fuel
event MessageRelayed(bytes32 indexed messageId, bytes32 indexed sender, bytes32 indexed recipient, uint64 amount);

contract FuelMessagePortal {
    function sendMessageMock(bytes calldata data) public payable {}
}
