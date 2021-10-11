// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract WavePortal {
    uint256 totalWaves;

    Wave[] waves;

    uint256 private seed;

    mapping(address => uint256) public lastWavedAt;

    address lastWinner;

    event NewWave(address indexed from, uint256 timestamp, string message);
    event Won(address indexed winner);

    struct Wave {
        address waver;
        string message;
        uint256 timestamp;
    }

    constructor () payable {
        console.log("Log from constructor");
    }

    function wave(string memory waveMsg) public {
        require(
            lastWavedAt[msg.sender] + 15 minutes < block.timestamp,
            "Wait 15m"
        );
        lastWavedAt[msg.sender] = block.timestamp;
        
        totalWaves += 1;
        waves.push(Wave(msg.sender, waveMsg, block.timestamp));
        uint256 randomNumber = (block.difficulty + block.timestamp + seed) % 100;
        console.log("Random # generated: %s", randomNumber);
        seed = randomNumber;
        if (randomNumber < 50) {
            uint256 prizeAmount = 0.0001 ether;
            require(
                prizeAmount <= address(this).balance,
                "Trying to withdraw more money than the contract has."
            );
            (bool success, ) = (msg.sender).call{value: prizeAmount}("");
            require(success, "Failed to withdraw money from contract.");
            emit Won(msg.sender);
            lastWinner = msg.sender;
        }

        emit NewWave(msg.sender, block.timestamp, waveMsg);
    }

    function getTotalWaves() public view returns (uint256) {
        console.log("Total waves: %d", totalWaves);
        return totalWaves;
    }

    function getAllWaves() public view returns (Wave[] memory) {
        return waves;
    }
}