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

    uint256 public currentGameNumber;
    uint256[] public gameNumbers;

    mapping(uint256 => Game) public games;

    struct Game {
        // Randomized player board
        // Player board is stored as a packed uint256 which contains both a 5x5 grid with random numbers
        // and a 5x5 bool matrix which shows which square is marked
        mapping(address => uint256) playerBoard;
        uint256 gameInitiatedTimestamp; // timestamp at which game has been initiated
        uint256 gameStartedTimestamp; // timestamp at which game has started
        uint256 lastTurnTimestamp; // timestamp of the last turn
        bool gameInitiated; // true if game has been initiated
        bool gameStarted; // true if game has started
        bool gameFinished; // true if game has been won
        uint8 lastDrawnNumber; // last number drawn
        uint256 playersJoined; // players joined in current game
        uint256 potAmount; // total pot amount for this game
    }

    IERC20 public immutable token; // erc-20 token used for entry fee and wins

    // Events
    event GameStarted(uint256 indexed gameId, uint256 indexed time);
    event DrawnNumber(uint256 indexed gameId, uint256 indexed number);
    event GameReset(uint256 indexed gameId, uint256 indexed time);

    event PlayerJoined(uint256 indexed gameId, address indexed player);
    event NumberMarked(
        uint256 indexed gameId,
        address indexed player,
        uint256 row,
        uint256 col
    );
    event GameWon(
        uint256 indexed gameId,
        address indexed player,
        uint256 startSquare,
        uint256 direction
    );

    // Constructor
    constructor(
        uint256 _joinDuration,
        uint256 _turnDuration,
        uint256 _joinFee,
        IERC20 _token
    ) {
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
     * Generates a new game id
     */
    function initiateGame() public onlyOwner {
        gameNumbers.push(currentGameNumber);
        Game storage game = games[currentGameNumber];
        game.gameInitiatedTimestamp = block.timestamp;
        currentGameNumber++;
    }

    /**
     * Start the game, allowing numbers to be drawn and players to call match
     */
    function start(uint256 gameId) public onlyOwner {
        require(
            block.timestamp >
                games[gameId].gameInitiatedTimestamp + joinDuration,
            "Need to wait for join duration"
        );
        require(
            games[gameId].playersJoined > 0,
            "Need at least one player to start the game"
        );
        require(!games[gameId].gameStarted, "Game has already started");
        games[gameId].gameStartedTimestamp = block.timestamp;
        games[gameId].gameStarted = true;
        games[gameId].lastTurnTimestamp = block.timestamp; // set to current timestamp to give time for players to get ready
        emit GameStarted(gameId, block.timestamp);
    }

    /**
     * Draw a random number between 0 - 255
     */
    function draw(uint256 gameId) public onlyOwner {
        require(games[gameId].gameStarted, "Game hasn't started");
        require(
            block.timestamp > games[gameId].lastTurnTimestamp + turnDuration,
            "Turn hasn't finished yet"
        );
        games[gameId].lastDrawnNumber = random();
        games[gameId].lastTurnTimestamp = block.timestamp;
        emit DrawnNumber(gameId, games[gameId].lastDrawnNumber);
    }

    /**
     * Reset a game which has been finished
     */
    function resetGame(uint256 gameId) public onlyOwner {
        require(games[gameId].gameFinished, "Game hasn't finished yet");
        games[gameId].gameInitiated = false;
        games[gameId].gameStarted = false;
        games[gameId].gameFinished = false;
        games[gameId].gameInitiatedTimestamp = 0;
        games[gameId].gameStartedTimestamp = 0;
        games[gameId].lastTurnTimestamp = 0;
        emit GameReset(gameId, block.timestamp);
    }

    /* ========================================================================================= */
    /*                                     Player functions                                      */
    /* ========================================================================================= */

    /**
     * Join the game and transfer the join fee
     * Generates a random 5x5 board for the player
     * Player needs to approve token before joining
     */
    function join(uint256 gameId) public {
        require(
            games[gameId].gameInitiatedTimestamp < block.timestamp,
            "Game hasn't started"
        );
        require(
            games[gameId].gameStartedTimestamp < block.timestamp,
            "Game has begun already, can't join"
        );

        // Transfer join fee
        token.safeTransferFrom(msg.sender, address(this), joinFee);

        // Initialize board
        uint8[][] memory _board = new uint8[][](5);
        bool[][] memory _marked = new bool[][](5);
        (_board, _marked) = generateBoard();

        games[gameId].playerBoard[msg.sender] = encodeGrid(_board, 0);
        games[gameId].playerBoard[msg.sender] = encodeBoolMatrix(
            _marked,
            games[gameId].playerBoard[msg.sender]
        );
        games[gameId].playersJoined++;
        games[gameId].potAmount += joinFee;
        emit PlayerJoined(gameId, msg.sender);
    }

    /**
     * Mark a number for a player
     * @param row of number
     * @param col of number
     */
    function markNumber(uint256 gameId, uint256 row, uint256 col) public {
        require(
            block.timestamp > games[gameId].gameStartedTimestamp,
            "Game hasn't started"
        );
        if (!getMarked(gameId, msg.sender, row, col)) {
            if (
                getBoardNumberOptimized(gameId, msg.sender, row, col) ==
                games[gameId].lastDrawnNumber
            ) {
                setMarked(gameId, msg.sender, row, col);
            }
        }
        emit NumberMarked(gameId, msg.sender, row, col);
    }

    /**
     * Win the game
     * Call only in case you have marked 5 consequential squares
     * Vertically, horizontally or diagonally
     * @param startSquare starting row or column which has been marked (start from 0)
     * @param direction 0 - horizontally (row), 1 - vertically (column), 2 - diagonally
     */
    function win(uint256 gameId, uint256 startSquare, uint8 direction) public {
        require(!games[gameId].gameFinished, "Game finished already");
        require(startSquare < 5, "Grid is only 5x5");
        // Counting horizontally
        if (direction == 0) {
            for (uint256 i = 0; i < 5; ++i) {
                if (!getMarked(gameId, msg.sender, startSquare, i)) {
                    return;
                }
            }
            // Counting vertically
        } else if (direction == 1) {
            for (uint256 i = 0; i < 5; ++i) {
                if (!getMarked(gameId, msg.sender, i, startSquare)) {
                    return;
                }
            }
            // Counting diagonally
        } else if (direction == 2) {
            require(startSquare == 0 || startSquare == 4, "Only two diagonals");
            if (startSquare == 0) {
                for (uint256 i = 0; i < 5; ++i) {
                    if (!getMarked(gameId, msg.sender, i, i)) {
                        return;
                    }
                }
            }
            if (startSquare == 4) {
                for (uint256 i = 4; i >= 0; --i) {
                    if (!getMarked(gameId, msg.sender, i, 4 - i)) {
                        return;
                    }
                }
            }
        }
        token.safeTransfer(msg.sender, games[gameId].potAmount);
        games[gameId].gameFinished = true;
        emit GameWon(gameId, msg.sender, startSquare, direction);
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
    function getBoard(
        uint256 gameId,
        address player
    ) public view returns (uint8[][] memory) {
        return decodeGrid(games[gameId].playerBoard[player]);
    }

    /**
     * Get player marked squares
     */
    function getMarkedSquares(
        uint256 gameId,
        address player
    ) external view returns (bool[][] memory _marked) {
        return decodeBoolMatrix(games[gameId].playerBoard[player]);
    }

    /**
     * Check if number is in board and return row and column of that number
     * Return (7, 7) if number is not in the board
     * We can rely that the board is 5x5
     */
    function checkIfNumberIsInBoard(
        uint256 gameId,
        address player,
        uint8 number
    ) public view returns (uint8 row, uint8 col) {
        uint8[][] memory board = getBoard(gameId, player);
        for (uint8 i = 0; i < 5; ++i) {
            for (uint8 j = 0; j < 5; ++j) {
                if (board[i][j] == number) {
                    return (i, j);
                }
            }
        }
        return (7, 7);
    }

    /**
     * Function to generate a board and a boolean matrix of marked squares
     * Uses random function to generate the numbers
     * @return board a 5x5 grid of numbers
     * @return markedSquares a 5x5 grid of booleans
     */
    function generateBoard()
        public
        view
        returns (uint8[][] memory board, bool[][] memory markedSquares)
    {
        uint8[][] memory _playerBoard = new uint8[][](5);
        bool[][] memory _marked = new bool[][](5);
        uint8 counter = 0;
        // Generate board
        for (uint256 i = 0; i < 5; ++i) {
            _playerBoard[i] = new uint8[](5);
            _marked[i] = new bool[](5);
            for (uint256 j = 0; j < 5; ++j) {
                _playerBoard[i][j] = (random(counter));
                counter++;
                _marked[i][j] = false;
            }
        }
        _marked[2][2] = true; // mark middle square
        return (_playerBoard, _marked);
    }

    function getBoardNumber(
        uint256 gameId,
        address player,
        uint8 row,
        uint8 col
    ) external view returns (uint8) {
        return uint8(decodeGrid(games[gameId].playerBoard[player])[row][col]);
    }

    /**
     * Get board number in a row and column from an encoded uint256 grid
     * @param player player address
     * @param row row number
     * @param col column number
     */
    function getBoardNumberOptimized(
        uint256 gameId,
        address player,
        uint row,
        uint col
    ) public view returns (uint8 boardNumber) {
        uint shift = (row * 5 + col) * 8; // access that row and col ; we access 8 bits at a time
        boardNumber = uint8(games[gameId].playerBoard[player] >> shift);
    }

    /**
     * Set marked square for player
     * Function essentially toggles a bit in the uint256 encoded grid / bool matrix
     * @param player player address
     * @param row row number
     * @param col column number
     */
    function setMarked(
        uint256 gameId,
        address player,
        uint row,
        uint col
    ) private {
        uint shift = 208 + row * 5 + col; // access that row and col
        games[gameId].playerBoard[player] |= uint(1 << shift);
    }

    /**
     * Get if square is marked for player at row and col
     * Function accesses bit value and converts it to bool at that row and col in
     * the encoded grid/bool matrix for player
     * @param player player address
     * @param row row number
     * @param col column number
     */
    function getMarked(
        uint256 gameId,
        address player,
        uint row,
        uint col
    ) public view returns (bool _result) {
        uint shift = 208 + row * 5 + col; // access that row and col
        return
            games[gameId].playerBoard[player] & (1 << shift) > 0 ? true : false;
    }

    /**
     * Encode a bool matrix in a uint256
     * Uses the same uint256 which stores the grid
     * Grid must be 5x5
     */
    function encodeBoolMatrix(
        bool[][] memory matrix,
        uint256 startNum
    ) public pure returns (uint256 result) {
        uint shift = 208;
        for (uint i = 0; i < 5; ++i) {
            for (uint j = 0; j < 5; ++j) {
                // Store the bool value starting from bit 208 in the uint256
                if (matrix[i][j]) startNum |= uint(1 << shift);
                shift += 1;
            }
        }
        return startNum;
    }

    /**
     * Decode a bool matrix from a uint256
     * Uses the same uint256 which stores the grid
     */
    function decodeBoolMatrix(
        uint256 matrixNum
    ) public pure returns (bool[][] memory matrix) {
        uint shift = 208;
        matrix = new bool[][](5);
        for (uint i = 0; i < 5; ++i) {
            matrix[i] = new bool[](5);
            for (uint j = 0; j < 5; ++j) {
                matrix[i][j] = matrixNum & (1 << shift) > 0 ? true : false;
                shift += 1;
            }
        }
    }

    /**
     * Encode uint8 matrix in uint256
     * Grid must be 5x5
     */
    function encodeGrid(
        uint8[][] memory grid,
        uint256 startNum
    ) public pure returns (uint256 result) {
        uint shift = 0;
        for (uint i = 0; i < 5; ++i) {
            for (uint j = 0; j < 5; ++j) {
                startNum |= uint(grid[i][j]) << shift;
                shift += 8;
            }
        }
        return startNum;
    }

    /**
     * Decode uint256 to a uint8 matrix
     * We know the matrix is 5x5
     */
    function decodeGrid(
        uint256 gridNum
    ) public pure returns (uint8[][] memory grid) {
        uint shift = 0;
        grid = new uint8[][](5);
        for (uint i = 0; i < 5; ++i) {
            grid[i] = new uint8[](5);
            for (uint j = 0; j < 5; ++j) {
                grid[i][j] = uint8(gridNum >> shift);
                shift += 8;
            }
        }
    }

    /**
     * Generates a random number from 0 - 255
     */
    function random() private view returns (uint8) {
        return uint8(uint(blockhash(block.number - 1)) % 255);
    }

    /**
     * Generate multiple random number in the same function
     * Used to generate player boards
     * @param counter variable which must be changed for each call to this function
     */
    function random(uint256 counter) private view returns (uint8) {
        return
            uint8(
                uint(
                    keccak256(
                        abi.encodePacked(
                            block.difficulty,
                            block.timestamp,
                            counter
                        )
                    )
                ) % 255
            );
    }
}
