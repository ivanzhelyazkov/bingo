//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IBingo {
    function checkIfNumberIsInBoard(
        uint256 gameId,
        address player,
        uint8 number
    ) external view returns (uint8 row, uint8 col);

    function currentGameNumber() external view returns (uint256);

    function decodeBoolMatrix(
        uint256 matrixNum
    ) external pure returns (bool[][] memory matrix);

    function decodeGrid(
        uint256 gridNum
    ) external pure returns (uint8[][] memory grid);

    function draw(uint256 gameId) external;

    function encodeBoolMatrix(
        bool[][] memory matrix,
        uint256 startNum
    ) external pure returns (uint256 result);

    function encodeGrid(
        uint8[][] memory grid,
        uint256 startNum
    ) external pure returns (uint256 result);

    function gameNumbers(uint256) external view returns (uint256);

    function games(
        uint256
    )
        external
        view
        returns (
            uint256 gameInitiatedTimestamp,
            uint256 gameStartedTimestamp,
            uint256 lastTurnTimestamp,
            bool gameInitiated,
            bool gameStarted,
            bool gameFinished,
            uint8 lastDrawnNumber,
            uint256 playersJoined
        );

    function generateBoard()
        external
        view
        returns (uint8[][] memory board, bool[][] memory markedSquares);

    function getBoard(
        uint256 gameId,
        address player
    ) external view returns (uint8[][] memory);

    function getBoardNumber(
        uint256 gameId,
        address player,
        uint8 row,
        uint8 col
    ) external view returns (uint8);

    function getBoardNumberOptimized(
        uint256 gameId,
        address player,
        uint256 row,
        uint256 col
    ) external view returns (uint8 boardNumber);

    function getMarked(
        uint256 gameId,
        address player,
        uint256 row,
        uint256 col
    ) external view returns (bool _result);

    function getMarkedSquares(
        uint256 gameId,
        address player
    ) external view returns (bool[][] memory _marked);

    function initiateGame() external;

    function join(uint256 gameId) external;

    function joinDuration() external view returns (uint256);

    function joinFee() external view returns (uint256);

    function markNumber(uint256 gameId, uint256 row, uint256 col) external;

    function owner() external view returns (address);

    function renounceOwnership() external;

    function resetGame(uint256 gameId) external;

    function start(uint256 gameId) external;

    function token() external view returns (address);

    function transferOwnership(address newOwner) external;

    function turnDuration() external view returns (uint256);

    function updateEntryFee(uint256 newJoinFee) external;

    function updateJoinDuration(uint256 newJoinDuration) external;

    function updateTurnDuration(uint256 newTurnDuration) external;

    function win(uint256 gameId, uint256 startSquare, uint8 direction) external;
}
