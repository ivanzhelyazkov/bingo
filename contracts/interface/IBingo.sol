pragma solidity ^0.8.0;

interface IBingo {
    function checkIfNumberIsInBoard(
        address player,
        uint8 number
    ) external view returns (uint8 row, uint8 col);

    function decodeBoolMatrix(
        uint256 matrixNum
    ) external pure returns (bool[][] memory matrix);

    function decodeGrid(
        uint256 gridNum
    ) external pure returns (uint8[][] memory grid);

    function draw() external;

    function encodeBoolMatrix(
        bool[][] memory matrix,
        uint256 startNum
    ) external pure returns (uint256 result);

    function encodeGrid(
        uint8[][] memory grid,
        uint256 startNum
    ) external pure returns (uint256 result);

    function gameFinished() external view returns (bool);

    function gameInitiated() external view returns (bool);

    function gameInitiatedTimestamp() external view returns (uint256);

    function gameStarted() external view returns (bool);

    function gameStartedTimestamp() external view returns (uint256);

    function generateBoard()
        external
        view
        returns (uint8[][] memory board, bool[][] memory markedSquares);

    function getBoard(address player) external view returns (uint8[][] memory);

    function getBoardNumber(
        address player,
        uint8 row,
        uint8 col
    ) external view returns (uint8);

    function getBoardNumberOptimized(
        address player,
        uint256 row,
        uint256 col
    ) external view returns (uint8 boardNumber);

    function getMarked(
        address player,
        uint256 row,
        uint256 col
    ) external view returns (bool _result);

    function getMarkedSquares(
        address player
    ) external view returns (bool[][] memory _marked);

    function initiateGame() external;

    function join() external;

    function joinDuration() external view returns (uint256);

    function joinFee() external view returns (uint256);

    function lastDrawnNumber() external view returns (uint8);

    function lastTurnTimestamp() external view returns (uint256);

    function markNumber(uint256 row, uint256 col) external;

    function owner() external view returns (address);

    function playerBoard(address) external view returns (uint256);

    function playersJoined() external view returns (uint256);

    function renounceOwnership() external;

    function resetGame() external;

    function start() external;

    function token() external view returns (address);

    function transferOwnership(address newOwner) external;

    function turnDuration() external view returns (uint256);

    function updateEntryFee(uint256 newJoinFee) external;

    function updateJoinDuration(uint256 newJoinDuration) external;

    function updateTurnDuration(uint256 newTurnDuration) external;

    function win(uint256 startSquare, uint8 direction) external;
}
