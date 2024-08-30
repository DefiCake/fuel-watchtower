// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract FuelMessagePortal {
    /// @dev Emitted when a message is sent from Ethereum to Fuel
    event MessageSent(
        bytes32 indexed sender, bytes32 indexed recipient, uint256 indexed nonce, uint64 amount, bytes data
    );

    /// @dev Emitted when a message is successfully relayed to Ethereum from Fuel
    event MessageRelayed(bytes32 indexed messageId, bytes32 indexed sender, bytes32 indexed recipient, uint64 amount);

    uint256 nonce = 0;

    function sendMessageMock(bytes32 recipient, bytes calldata data) public payable {
        emit MessageSent(bytes32(uint256(uint160(msg.sender))), recipient, nonce, uint64(msg.value), data);
        nonce++;
    }
}
