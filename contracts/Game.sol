// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract Game is Ownable, ReentrancyGuard {
    enum GameStatus {
        NOT_INITIALIZED,
        INITIALIZED,
        IN_PROGRESS,
        COMPLETED
    }

    enum Hand {
        ROCK,
        SCISSOR,
        PAPER
    }

    struct GameInfo {
        GameStatus status;
        address winner;
        address player;
        bytes32 eOwnerHand; // Encrypted Owner Hand
        Hand playerHand;
        uint256 pFee; // Participation Fee for game
    }

    uint256 public currentGameID;
    uint256 public pFee; // Participation Fee for game

    mapping(uint256 => GameInfo) public gameList;

    event Receive(string);
    event GameFeeConfigured(uint256);
    event GameInitialized(uint256);
    event GameCompleted(uint256, address);

    constructor(uint256 _participationFee) {
        pFee = _participationFee;
    }

    // Generate this hash from the frontend side
    // keccak256(
    //         abi.encodePacked(_msgSender(), _hand, _commitment)
    // );
    function initializeGame(
        bytes32 _hash
    ) external payable onlyOwner nonReentrant {
        require(msg.value >= pFee, "deposit amount error");
        GameInfo storage game = gameList[currentGameID];
        if (msg.value > pFee) {
            (bool success, ) = payable(_msgSender()).call{
                value: msg.value - pFee
            }("");
            require(success, "call failed");
        }
        game.pFee = pFee;
        game.eOwnerHand = _hash;
        game.status = GameStatus.INITIALIZED;

        emit GameInitialized(currentGameID);
        currentGameID = ++currentGameID;
    }

    function join(uint256 _gameId, Hand _hand) external payable nonReentrant {
        GameInfo storage game = gameList[_gameId];
        require(_msgSender() != owner(), "Cannot play alone");
        require(game.status == GameStatus.INITIALIZED, "invalid game ID");
        require(msg.value >= game.pFee, "deposit amount mismatch");

        if (msg.value > game.pFee) {
            (bool success, ) = payable(_msgSender()).call{
                value: msg.value - game.pFee
            }("");
            require(success, "call failed");
        }
        game.playerHand = _hand;
        game.player = _msgSender();
        game.status = GameStatus.IN_PROGRESS;
    }

    function judgeWithHand(
        uint _gameId,
        Hand _ownerhand,
        bytes32 _commitment
    ) external nonReentrant {
        GameInfo storage game = gameList[_gameId];
        require(game.status == GameStatus.IN_PROGRESS, "Invalid game status");
        require(
            _msgSender() == game.player || _msgSender() == owner(),
            "Invalid judger"
        );
        require(
            game.eOwnerHand ==
                keccak256(
                    abi.encodePacked(owner(), uint256(_ownerhand), _commitment)
                ),
            "Owner hand is not same with saved one"
        );

        if (game.playerHand == _ownerhand) {
            game.winner = address(0);
            emit GameCompleted(_gameId, address(0));
        } else if (
            (game.playerHand == Hand.ROCK && _ownerhand == Hand.SCISSOR) ||
            (game.playerHand == Hand.PAPER && _ownerhand == Hand.ROCK) ||
            (game.playerHand == Hand.SCISSOR && _ownerhand == Hand.PAPER)
        ) {
            game.winner = game.player;
            emit GameCompleted(_gameId, game.player);
        } else {
            game.winner = owner();
            emit GameCompleted(_gameId, owner());
        }

        uint prize = game.pFee;
        if (game.winner == address(0)) {
            (bool sent0, ) = payable(owner()).call{value: prize}("");
            (bool sent1, ) = payable(game.player).call{value: prize}("");
            require(sent0 && sent1, "Failed to send Ether");
        } else {
            (bool sent, ) = payable(game.winner).call{value: prize * 2}("");
            require(sent, "Failed to send Ether");
        }
        game.status = GameStatus.COMPLETED;
    }

    function judge(uint _gameId, bytes32 _commitment) external nonReentrant {
        GameInfo storage game = gameList[_gameId];
        require(game.status == GameStatus.IN_PROGRESS, "Invalid game status");
        require(
            _msgSender() == game.player || _msgSender() == owner(),
            "Invalid judger"
        );
        bytes32 eOwnerHand = game.eOwnerHand;
        Hand _ownerhand;
        if (
            eOwnerHand ==
            keccak256(
                abi.encodePacked(owner(), uint256(Hand.PAPER), _commitment)
            )
        ) {
            _ownerhand = Hand.PAPER;
        } else if (
            eOwnerHand ==
            keccak256(
                abi.encodePacked(owner(), uint256(Hand.SCISSOR), _commitment)
            )
        ) {
            _ownerhand = Hand.SCISSOR;
        } else if (
            eOwnerHand ==
            keccak256(
                abi.encodePacked(owner(), uint256(Hand.ROCK), _commitment)
            )
        ) {
            _ownerhand = Hand.ROCK;
        } else {
            revert("Wrong Commitment");
        }

        if (game.playerHand == _ownerhand) {
            game.winner = address(0);
            emit GameCompleted(_gameId, address(0));
        } else if (
            (game.playerHand == Hand.ROCK && _ownerhand == Hand.SCISSOR) ||
            (game.playerHand == Hand.PAPER && _ownerhand == Hand.ROCK) ||
            (game.playerHand == Hand.SCISSOR && _ownerhand == Hand.PAPER)
        ) {
            game.winner = game.player;
        } else {
            game.winner = owner();
        }

        uint prize = game.pFee;
        if (game.winner == address(0)) {
            (bool sent0, ) = payable(owner()).call{value: prize}("");
            (bool sent1, ) = payable(game.player).call{value: prize}("");
            require(sent0 && sent1, "Failed to send Ether");
        } else {
            (bool sent, ) = payable(game.winner).call{value: prize * 2}("");
            require(sent, "Failed to send Ether");
        }
        game.status = GameStatus.COMPLETED;
    }

    function cancel(uint _gameId) external onlyOwner nonReentrant {
        GameInfo storage game = gameList[_gameId];
        require(game.status == GameStatus.INITIALIZED, "Cannot cancel");

        game.status = GameStatus.COMPLETED;
        (bool sent, ) = payable(_msgSender()).call{value: game.pFee}("");
        require(sent, "Failed to send Ether");
    }

    function configureFee(uint256 _pFee) external onlyOwner {
        pFee = _pFee;
        emit GameFeeConfigured(pFee);
    }

    receive() external payable {
        emit Receive("receive");
    }
}
