//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Bingo is Ownable {
    using SafeERC20 for IERC20;

    // State variables
    uint256 public joinDuration; // time for joining the game after game has been initiated in seconds
    uint256 public turnDuration; // time for taking a turn in the game in seconds
    uint256 public joinFee; // fee to join the game in wei

    mapping(address => uint8[][]) public playerBoard; // Randomized player board
    mapping(address => bool[][]) public marked; // true if square has been marked for player

    uint256 public gameInitiatedTimestamp; // timestamp at which game has been initiated and players can join
    uint256 public gameStartedTimestamp; // timestamp at which game has started
    uint256 public lastTurnTimestamp; // timestamp of the last turn

    bool public gameInitiated; // true if game has been initiated
    bool public gameStarted; // true if game has started
    bool public gameFinished; // true if game has been won

    uint8 public lastDrawnNumber; // last number drawn

    uint256 public playersJoined; // players joined in current game

    IERC20 public immutable token; // erc-20 token used for entry fee and wins

    // Constructor
    constructor(uint256 _joinDuration, uint256 _turnDuration, uint256 _joinFee, IERC20 _token) {
        joinDuration = _joinDuration;
        turnDuration = _turnDuration;
        joinFee = _joinFee;
        token = _token;
    }

    /* ========================================================================================= */
    /*                                     Host functions                                        */
    /* ========================================================================================= */

    /**
     * Initiate a game, allowing players to join
     * Game can only be started after the joinDuration has passed
     */
    function initiateGame() public onlyOwner {
        require(!gameInitiated, "Game has been initiated");
        gameInitiatedTimestamp = block.timestamp;
        gameInitiated = true;
    }

    /**
     * Start the game, allowing numbers to be drawn and players to call match
     */
    function start() public onlyOwner {
        require(block.timestamp > gameInitiatedTimestamp + joinDuration, "Need to wait for join duration");
        require(playersJoined > 0, "Need at least one player to start the game");
        require(!gameStarted, "Game has already started");
        gameStartedTimestamp = block.timestamp;
        gameStarted = true;
        lastTurnTimestamp = block.timestamp; // set to current timestamp to give time for players to get ready
    }

    /**
     * Draw a random number between 0 - 255
     */
    function draw() public onlyOwner {
        require(gameStarted, "Game hasn't started");
        require(block.timestamp > lastTurnTimestamp + turnDuration, "Turn hasn't finished yet");
        lastDrawnNumber = random();
        lastTurnTimestamp = block.timestamp;
    }

    /**
     * Reset a game which has been finished
     */
    function resetGame() public onlyOwner {
        require(gameFinished, "Game hasn't finished yet");
        gameInitiated = false;
        gameStarted = false;
        gameFinished = false;
        gameInitiatedTimestamp = 0;
        gameStartedTimestamp = 0;
        lastTurnTimestamp = 0;
    }

    /* ========================================================================================= */
    /*                                     Player functions                                      */
    /* ========================================================================================= */

    /**
     * Join the game and transfer the join fee
     * Generates a random 5x5 board for the player
     * Player needs to approve token before joining
     */
    function join() public {
        require(gameInitiatedTimestamp < block.timestamp, "Game hasn't started");
        require(gameStartedTimestamp < block.timestamp, "Game has begun already, can't join");

        // Transfer join fee
        token.safeTransferFrom(msg.sender, address(this), joinFee);

        // Initialize board
        playerBoard[msg.sender] = new uint8[][](5);
        marked[msg.sender] = new bool[][](5);
        uint8 counter = 0;
        for(uint256 i = 0 ; i < 5 ; ++i) {
            for(uint256 j = 0 ; j < 5 ; ++j) {
                playerBoard[msg.sender][i].push(random(counter));
                counter++;
                marked[msg.sender][i].push(false);
            }
        }
        marked[msg.sender][2][2] = true; // mark middle square
        playersJoined++;
    }

    /**
     * Mark a number for a player
     * @param row of number
     * @param col of number
     */
    function markNumber(uint256 row, uint256 col) public {
        require(block.timestamp > gameStartedTimestamp, "Game hasn't started");
        if(!marked[msg.sender][row][col]) {
            if(playerBoard[msg.sender][row][col] == lastDrawnNumber) {
                marked[msg.sender][row][col] = true;
            }
        }
    }

    /**
     * Win the game
     * Call only in case you have marked 5 consequential squares
     * Vertically, horizontally or diagonally
     * @param startSquare starting row or column which has been marked (start from 0)
     * @param direction 0 - horizontally (row), 1 - vertically (column), 2 - diagonally
     */
    function win(uint256 startSquare, uint8 direction) public {
        require(!gameFinished, "Game finished already");
        require(startSquare < 4, "Grid is only 5x5");
        // Counting horizontally
        if(direction == 0) {
            for(uint256 i = 0 ; i < 5 ; ++i) {
                if(!marked[msg.sender][startSquare][i]) {
                    return;
                }
            }
        // Counting vertically
        } else if(direction == 1) {
            for(uint256 i = 0 ; i < 5 ; ++i) {
                if(!marked[msg.sender][i][startSquare]) {
                    return;
                }
            }
        // Counting diagonally
        } else if(direction == 2) {
            require(startSquare == 0 || startSquare == 4, "Only two diagonals");
            if(startSquare == 0) {
                for(uint256 i = 0 ; i < 5 ; ++i) {
                    if(!marked[msg.sender][i][i]) {
                        return;
                    }
                }
            }
            if(startSquare == 4) {
                for(uint256 i = 4 ; i >= 0 ; --i) {
                    if(!marked[msg.sender][i][4 - i]) {
                        return;
                    }
                }
            }
        }
        token.safeTransfer(msg.sender, token.balanceOf(address(this)));
        gameFinished = true;
    }

    /* ========================================================================================= */
    /*                                            Management                                     */
    /* ========================================================================================= */

    /**
     * Function to update the entry fee for joining a game
     * @param newJoinFee new fee amount
     */
    function updateEntryFee(uint256 newJoinFee) public onlyOwner {
        joinFee = newJoinFee;
    }

    /**
     * Function to update the join duration for joining a game
     * @param newJoinDuration new join duration
     */
    function updateJoinDuration(uint256 newJoinDuration) public onlyOwner {
        joinDuration = newJoinDuration;
    }

    /**
     * Function to update the turn duration for joining a game
     * @param newTurnDuration new turn duration
     */
    function updateTurnDuration(uint256 newTurnDuration) public onlyOwner {
        turnDuration = newTurnDuration;
    }

    /* ========================================================================================= */
    /*                                            View                                           */
    /* ========================================================================================= */

    /**
     * Get player board
     */
    function getBoard(address player) public view returns(uint8[][] memory board) {
        return playerBoard[player];
    }

    /**
     * Get player marked squares
     */
    function getMarkedSquares(address player) public view returns(bool[][] memory _marked) {
        return marked[player];
    }

    /**
     * Check if number is in board and return row and column of that number
     * Return (7, 7) if number is not in the board
     * We can rely that the board is 5x5
     */
    function checkIfNumberIsInBoard(address player, uint8 number) public view returns(uint8 row, uint8 col) {
        uint8[][] memory board = getBoard(player);
        for(uint8 i = 0 ; i < 5 ; ++i) {
            for(uint8 j = 0 ; j < 5 ; ++j) {
                if(board[i][j] == number) {
                    return (i, j);
                }
            }
        }
        return (7, 7);
    }

    /**
     * Generates a random number from 0 - 255
     */
    function random() private view returns(uint8) {
        return uint8(uint(blockhash(block.number - 1)) % 255);
    }


    /**
     * Generate multiple random number in the same function
     * Used to generate player boards
     * @param counter variable which must be changed for each call to this function
     */
    function random(uint8 counter) private view returns (uint8) {
        return uint8(uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, counter))) % 255);
    }
}