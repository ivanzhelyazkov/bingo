const { expect } = require('chai');
const { bnDecimal, increaseTime } = require('../scripts/helpers');
const { deploymentFixture } = require('./fixture');

// Bingo contract tests
describe('Contract: Bingo', async () => {
    beforeEach(async () => {
          ({ bingo, joinDuration, turnDuration, player1, player2, player3 } = await deploymentFixture());
    })

  describe('Host functions', async () => {
    it('host should be able to initiate the game', async () => {
        await expect(bingo.initiateGame()).not.to.be.reverted;
        let initiateTimestamp = await bingo.gameInitiatedTimestamp();
        expect(initiateTimestamp).to.be.gt(0);
    }),

    it('host should be able to start the game', async () => {
        await bingo.initiateGame();
        await increaseTime(joinDuration);

        // need at least one player to join before starting game
        await bingo.connect(player1).join();
        
        await expect(bingo.start()).not.to.be.reverted;
        let startedTimestamp = await bingo.gameStartedTimestamp();
        expect(startedTimestamp).to.be.gt(0);
    }),

    it('host should be able to draw after starting the game', async () => {
        await bingo.initiateGame();

        await increaseTime(joinDuration);
        await bingo.connect(player1).join();
        await bingo.start();

        await increaseTime(turnDuration);
        await expect(bingo.draw()).not.to.be.reverted;
        let lastDrawnNumber = await bingo.lastDrawnNumber();

        expect(lastDrawnNumber).to.be.gt(0)
        expect(lastDrawnNumber).to.be.lt(255)
    }),

    it('host shouldn\'t be able to initiate the game twice', async () => {
        await bingo.initiateGame();
        await expect(bingo.initiateGame()).to.be.revertedWith('Game has been initiated');
    }),

    it('host shouldn\'t be able to start the game if game hasn\'t been initiated', async () => {
        await expect(bingo.start()).to.be.revertedWith('Need at least one player to start the game');
    }),

    it('host shouldn\'t be able to start the game if join duration hasn\'t passed', async () => {
        await bingo.initiateGame();
        
        await expect(bingo.start()).to.be.revertedWith('Need to wait for join duration');
    }),

    it('host shouldn\'t be able to start the game with no players joined', async () => {
        await bingo.initiateGame();
        await increaseTime(joinDuration);
        
        await expect(bingo.start()).to.be.revertedWith('Need at least one player to start the game');
    }),

    it('host shouldn\'t be able to start the game twice', async () => {
        await bingo.initiateGame();
        await increaseTime(joinDuration);

        // need at least one player to join before starting game
        await bingo.connect(player1).join();

        await bingo.start();
        
        await expect(bingo.start()).to.be.revertedWith('Game has already started');
    }),

    it('host shouldn\'t be able to draw before game has been initiated', async () => {
        await expect(bingo.draw()).to.be.revertedWith('Game hasn\'t started')
    }),

    it('host shouldn\'t be able to draw before turn duration has passed', async () => {
        await bingo.initiateGame();

        await increaseTime(joinDuration);
        await bingo.connect(player1).join();
        await bingo.start();

        await increaseTime(turnDuration);
        await bingo.draw()

        await increaseTime(turnDuration / 2);
        await expect(bingo.draw()).to.be.revertedWith('Turn hasn\'t finished yet');
    }),

    it('host shouldn\'t be able to draw if game has finished', async () => {
        await bingo.initiateGame();

        await increaseTime(joinDuration);
        await bingo.connect(player1).join();
        await bingo.start();

        await increaseTime(turnDuration);
        await bingo.draw()

        await increaseTime(turnDuration / 2);
        await expect(bingo.draw()).to.be.revertedWith('Turn hasn\'t finished yet');
    })
  })
})
