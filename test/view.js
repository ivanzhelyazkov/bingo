const { expect } = require('chai');
const { isEqual } = require('underscore');
const { increaseTime, checkIfPlayerHasWon, getPlayerWinningSquare } = require('../scripts/helpers');
const { deploymentFixture } = require('./fixture');

// Bingo contract tests
describe('Contract: Bingo', async () => {
    beforeEach(async () => {
          ({ bingo, joinDuration, turnDuration, player1, player2, player3 } = await deploymentFixture());
    })

  describe('Player functions', async () => {
    it('should be able to generate board', async () => {
        let boardDetails = await bingo.generateBoard();
        let board = boardDetails.board;
        expect(board).not.be.undefined;
    }),

    it('should be able to encode 5x5 grid in one uint256', async() => {
        let grid = [[1, 2, 3, 4, 5], [1, 2, 3, 7, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5]];
        let res = await bingo.encodeGrid(grid, 0);
        let decoded = await bingo.decodeGrid(res);
        expect(isEqual(grid, decoded)).to.be.true;
    }),

    it('should be able to encode 5x5 bool matrix in one uint256', async() => {
        let matrix = [[false, true, true, false, true], 
            [true, true, true, false, true], [false, true, true, false, true],
            [false, true, true, false, true], [false, true, true, false, true]];
        let res = await bingo.encodeBoolMatrix(matrix, 0);
        let decoded = await bingo.decodeBoolMatrix(res);
        expect(isEqual(matrix, decoded)).to.be.true;
    })

    it('should be able to store both grid and bool matrix in one uint256', async() => {
        let grid = [[1, 2, 3, 4, 5], [1, 2, 3, 7, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5]];
        let matrix = [[false, true, true, false, true], 
            [true, true, true, false, true], [false, true, true, false, true],
            [false, true, true, false, true], [false, true, true, false, true]];
        let res = await bingo.encodeGrid(grid, 0);
        res = await bingo.encodeBoolMatrix(matrix, res);
        let decoded = await bingo.decodeGrid(res);
        let decodedMatrix = await bingo.decodeBoolMatrix(res);
        expect(isEqual(grid, decoded)).to.be.true;
        expect(isEqual(matrix, decodedMatrix)).to.be.true;
    })
  })
})
