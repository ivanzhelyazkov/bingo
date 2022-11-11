const { expect } = require('chai');
const { increaseTime, checkIfPlayerHasWon, getPlayerWinningSquare } = require('../scripts/helpers');
const { deploymentFixture } = require('./fixture');

// Bingo contract tests
describe('Contract: Bingo', async () => {
    beforeEach(async () => {
          ({ bingo, joinDuration, turnDuration, player1, player2, player3 } = await deploymentFixture());
    })

  describe('Player functions', async () => {
    it('player should be able to join', async () => {
        await bingo.initiateGame();
        await expect(bingo.connect(player1).join()).not.to.be.reverted;
    }),

    it('player should be able to mark square', async () => {
        await bingo.initiateGame();

        await increaseTime(joinDuration);
        await bingo.connect(player1).join();
        await bingo.start();

        // Iterate until the player has found a matching number
        let playerBoard = await bingo.getBoard(player1.address);
        let numLocation = {
            row: 7,
            col: 7
        }
        let lastDrawnNumber;

        while(numLocation.row == 7) {
            await increaseTime(turnDuration);
            await bingo.draw();
            lastDrawnNumber = await bingo.lastDrawnNumber();

            numLocation = await bingo.checkIfNumberIsInBoard(player1.address, lastDrawnNumber);
        }

        // expect drawn number to be eq to the location returned from *checkIfNumberIsInBoard*
        expect(lastDrawnNumber).to.be.eq(playerBoard[numLocation.row][numLocation.col]);

        // Mark the number
        await bingo.connect(player1).markNumber(numLocation.row, numLocation.col);

        let marked = await bingo.getMarkedSquares(player1.address);
        expect(marked[numLocation.row][numLocation.col]).to.be.eq(true);
    }),

    it('player should be able to win the game', async () => {
        await bingo.initiateGame();

        await increaseTime(joinDuration);
        await bingo.connect(player1).join();
        await bingo.start();

        // Iterate until the player has found a matching number
        let playerBoard = await bingo.getBoard(player1.address);
        let numLocation = {
            row: 7,
            col: 7
        }
        let lastDrawnNumber;
        let playerHasWon = false;
        let marked;
        
        while(!playerHasWon) {
            while(numLocation.row == 7) {
                await increaseTime(turnDuration);
                await bingo.draw();
                lastDrawnNumber = await bingo.lastDrawnNumber();

                numLocation = await bingo.checkIfNumberIsInBoard(player1.address, lastDrawnNumber);
            }

            // expect drawn number to be eq to the location returned from *checkIfNumberIsInBoard*
            expect(lastDrawnNumber).to.be.eq(playerBoard[numLocation.row][numLocation.col]);

            // Mark the number
            await bingo.connect(player1).markNumber(numLocation.row, numLocation.col);

            marked = await bingo.getMarkedSquares(player1.address);
            expect(marked[numLocation.row][numLocation.col]).to.be.eq(true);
            playerHasWon = checkIfPlayerHasWon(marked)

            numLocation = {
                row: 7,
                col: 7
            }
        }

        let winning = getPlayerWinningSquare(marked);
        await bingo.connect(player1).win(winning[0], winning[1])
    }),

    it('fastest player to get a winning square should be able to win the game', async () => {
        await bingo.initiateGame();

        await increaseTime(joinDuration);
        await bingo.connect(player1).join();
        await bingo.connect(player2).join();
        await bingo.connect(player3).join();
        await bingo.start();

        // Iterate until the player has found a matching number
        let playerBoard = await bingo.getBoard(player1.address);
        let numLocation1 = {
            row: 7,
            col: 7
        }
        let numLocation2 = {
            row: 7,
            col: 7
        }
        let numLocation3 = {
            row: 7,
            col: 7
        }
        let lastDrawnNumber;
        let player1HasWon = false;
        let player2HasWon = false;
        let player3HasWon = false;
        let marked1;
        let marked2;
        let marked3;
        
        while(!(player1HasWon || player2HasWon || player3HasWon)) {
            while(numLocation1.row == 7 && numLocation2.row == 7 && numLocation3.row == 7) {
                await increaseTime(turnDuration);
                await bingo.draw();
                lastDrawnNumber = await bingo.lastDrawnNumber();

                numLocation1 = await bingo.checkIfNumberIsInBoard(player1.address, lastDrawnNumber);
                numLocation2 = await bingo.checkIfNumberIsInBoard(player2.address, lastDrawnNumber);
                numLocation3 = await bingo.checkIfNumberIsInBoard(player3.address, lastDrawnNumber);
            }

            // user 1 got the first matching number
            if(numLocation1.row != 7) {
                // Mark the number
                await bingo.connect(player1).markNumber(numLocation1.row, numLocation1.col);
                marked1 = await bingo.getMarkedSquares(player1.address);
                player1HasWon = checkIfPlayerHasWon(marked1)
                numLocation1 = {
                    row: 7,
                    col: 7
                }
            }
            // user 2 got the first matching number
            if(numLocation2.row != 7) {
                // Mark the number
                await bingo.connect(player2).markNumber(numLocation2.row, numLocation2.col);
                marked2 = await bingo.getMarkedSquares(player2.address);
                player2HasWon = checkIfPlayerHasWon(marked2)
                numLocation2 = {
                    row: 7,
                    col: 7
                }
            }
            // user 3 got the first matching number
            if(numLocation3.row != 7) {
                // Mark the number
                await bingo.connect(player3).markNumber(numLocation3.row, numLocation3.col);
                marked3 = await bingo.getMarkedSquares(player3.address);
                player3HasWon = checkIfPlayerHasWon(marked3)
                numLocation3 = {
                    row: 7,
                    col: 7
                }
            }
        }

        if(player1HasWon) {
            let winning = getPlayerWinningSquare(marked1);
            await bingo.connect(player1).win(winning[0], winning[1])
        }
        if(player2HasWon) {
            let winning = getPlayerWinningSquare(marked2);
            await bingo.connect(player2).win(winning[0], winning[1])
        }
        if(player3HasWon) {
            let winning = getPlayerWinningSquare(marked3);
            await bingo.connect(player3).win(winning[0], winning[1])
        }
    })
  })
})
