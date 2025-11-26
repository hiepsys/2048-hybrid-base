// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Leaderboard {
    struct Entry {
        address player;
        uint256 score;
        uint256 timestamp;
    }

    uint256 public constant MAX_ENTRIES = 50;
    Entry[] public leaderboard;

    event ScoreSubmitted(address indexed player, uint256 score, uint256 timestamp);

    constructor() {}

    function submitScore(uint256 score, bytes32 stateHash, bytes calldata signature) external {
        bytes32 message = prefixed(keccak256(abi.encodePacked("2048|", stateHash, "|", score)));
        require(recoverSigner(message, signature) == msg.sender, "Invalid signature");

        _insert(score);
        emit ScoreSubmitted(msg.sender, score, block.timestamp);
    }

    function _insert(uint256 score) internal {
        if (leaderboard.length < MAX_ENTRIES) {
            leaderboard.push(Entry({player: msg.sender, score: score, timestamp: block.timestamp}));
            _sortDesc();
            return;
        }
        if (score <= leaderboard[leaderboard.length - 1].score) return;
        leaderboard[leaderboard.length - 1] = Entry({player: msg.sender, score: score, timestamp: block.timestamp});
        _sortDesc();
    }

    function _sortDesc() internal {
        for (uint i = 1; i < leaderboard.length; i++) {
            Entry memory key = leaderboard[i];
            uint j = i;
            while (j > 0 && leaderboard[j-1].score < key.score) {
                leaderboard[j] = leaderboard[j-1];
                j--;
            }
            leaderboard[j] = key;
        }
    }

    function getLeaderboard() external view returns (Entry[] memory) {
        return leaderboard;
    }

    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    function recoverSigner(bytes32 message, bytes memory sig) internal pure returns (address) {
        require(sig.length == 65, "invalid signature length");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        if (v < 27) v += 27;
        return ecrecover(message, v, r, s);
    }
}
