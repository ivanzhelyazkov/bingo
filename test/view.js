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
    })
  })
})
