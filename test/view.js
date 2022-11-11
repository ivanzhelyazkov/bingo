const { expect } = require('chai');
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

    it('should be able to get random bytes', async () => {
        let bytes = await bingo.randomBytes();
        console.log('bytes:', bytes);
    }),

    it('should be able to store uint in uint256', async() => {
        let res = await bingo.encodeNum(1, 2, 3, 4);
        console.log('res:', res);
        let reversed = await bingo.decodeNum(res);
        console.log('reversed:', reversed);
    }),

    it('should be able to encode grid in uint256', async() => {
        let res = await bingo.encodeGrid([[1, 2, 3, 4, 5], [1, 2, 3, 7, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5]]);
        console.log('res:', res);
        let reversed = await bingo.decodeGrid(res);
        console.log('reversed:', reversed);
    }),

    it('should be able to encode bool matrix in uint256', async() => {
        let res = await bingo.encodeGrid([[0, 1, 1, 0, 1], [0, 1, 1, 0, 1], [0, 1, 1, 0, 1], [0, 1, 1, 0, 1], [0, 1, 1, 0, 1]]);
        console.log('res:', res);
        let reversed = await bingo.decodeGrid(res);
        console.log('reversed:', reversed);
    })
  })
})
