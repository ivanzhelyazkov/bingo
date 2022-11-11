const { expect } = require('chai');
const { increaseTime, checkIfPlayerHasWon, getPlayerWinningSquare } = require('../scripts/helpers');
const { deploymentFixture } = require('./fixture');

// Bingo contract tests
describe('Contract: Bingo', async () => {
    beforeEach(async () => {
          ({ bingo, joinDuration, turnDuration, joinToken, player1, player2, player3 } = await deploymentFixture());
    })

  describe('Player functions', async () => {
    it('player should be able to join', async () => {
        await bingo.initiateGame();
        await expect(bingo.connect(player1).join(0)).not.to.be.reverted;
    }),

    it('player should be able to mark square', async () => {
        await bingo.initiateGame();

        await increaseTime(joinDuration);
        await bingo.connect(player1).join(0);
        await bingo.start(0);

        // Iterate until the player has found a matching number
        let playerBoard = await bingo.getBoard(0, player1.address);
        let numLocation = {
            row: 7,
            col: 7
        }
        let lastDrawnNumber;

        while(numLocation.row == 7) {
            await increaseTime(turnDuration);
            await bingo.draw(0);
            let game = await bingo.games(0);
            lastDrawnNumber = game.lastDrawnNumber;

            numLocation = await bingo.checkIfNumberIsInBoard(0, player1.address, lastDrawnNumber);
        }

        // expect drawn number to be eq to the location returned from *checkIfNumberIsInBoard*
        expect(lastDrawnNumber).to.be.eq(playerBoard[numLocation.row][numLocation.col]);

        // Mark the number
        await bingo.connect(player1).markNumber(0, numLocation.row, numLocation.col);

        let marked = await bingo.getMarkedSquares(0, player1.address);
        expect(marked[numLocation.row][numLocation.col]).to.be.eq(true);
    }),

    it('player should be able to win the game', async () => {
        await bingo.initiateGame();

        await increaseTime(joinDuration);
        await bingo.connect(player1).join(0);
        await bingo.start(0);

        // Iterate until the player has found a matching number
        let playerBoard = await bingo.getBoard(0, player1.address);
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
                await bingo.draw(0);
                let game = await bingo.games(0);
                lastDrawnNumber = await game.lastDrawnNumber;

                numLocation = await bingo.checkIfNumberIsInBoard(0, player1.address, lastDrawnNumber);
            }

            // expect drawn number to be eq to the location returned from *checkIfNumberIsInBoard*
            expect(lastDrawnNumber).to.be.eq(playerBoard[numLocation.row][numLocation.col]);

            // Mark the number
            await bingo.connect(player1).markNumber(0, numLocation.row, numLocation.col);

            marked = await bingo.getMarkedSquares(0, player1.address);
            expect(marked[numLocation.row][numLocation.col]).to.be.eq(true);
            playerHasWon = checkIfPlayerHasWon(marked)

            numLocation = {
                row: 7,
                col: 7
            }
        }

        let winning = getPlayerWinningSquare(marked);
        await bingo.connect(player1).win(0, winning[0], winning[1])
    }),

    it('player should receive pot reward on win', async () => {
        await bingo.initiateGame();

        await increaseTime(joinDuration);
        await bingo.connect(player1).join(0);
        await bingo.start(0);

        // Iterate until the player has found a matching number
        let playerBoard = await bingo.getBoard(0, player1.address);
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
                await bingo.draw(0);
                let game = await bingo.games(0);
                lastDrawnNumber = await game.lastDrawnNumber;

                numLocation = await bingo.checkIfNumberIsInBoard(0, player1.address, lastDrawnNumber);
            }

            // expect drawn number to be eq to the location returned from *checkIfNumberIsInBoard*
            expect(lastDrawnNumber).to.be.eq(playerBoard[numLocation.row][numLocation.col]);

            // Mark the number
            await bingo.connect(player1).markNumber(0, numLocation.row, numLocation.col);

            marked = await bingo.getMarkedSquares(0, player1.address);
            expect(marked[numLocation.row][numLocation.col]).to.be.eq(true);
            playerHasWon = checkIfPlayerHasWon(marked)

            numLocation = {
                row: 7,
                col: 7
            }
        }

        let game = await bingo.games(0);
        let potAmount = game.potAmount; 
        let bb = await joinToken.balanceOf(player1.address);
        let winning = getPlayerWinningSquare(marked);
        await bingo.connect(player1).win(0, winning[0], winning[1])
        let ba = await joinToken.balanceOf(player1.address);
        let gain = ba.sub(bb);
        expect(gain).to.be.eq(potAmount);
    }),

    it('fastest player to get a winning square should be able to win the game', async () => {
        await bingo.initiateGame();

        await increaseTime(joinDuration);
        await bingo.connect(player1).join(0);
        await bingo.connect(player2).join(0);
        await bingo.connect(player3).join(0);
        await bingo.start(0);

        // Iterate until the player has found a matching number
        let playerBoard = await bingo.getBoard(0, player1.address);
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
                await bingo.draw(0);
                let game = await bingo.games(0);
                lastDrawnNumber = await game.lastDrawnNumber;

                numLocation1 = await bingo.checkIfNumberIsInBoard(0, player1.address, lastDrawnNumber);
                numLocation2 = await bingo.checkIfNumberIsInBoard(0, player2.address, lastDrawnNumber);
                numLocation3 = await bingo.checkIfNumberIsInBoard(0, player3.address, lastDrawnNumber);
            }

            // user 1 got the first matching number
            if(numLocation1.row != 7) {
                // Mark the number
                await bingo.connect(player1).markNumber(0, numLocation1.row, numLocation1.col);
                marked1 = await bingo.getMarkedSquares(0, player1.address);
                player1HasWon = checkIfPlayerHasWon(marked1)
                numLocation1 = {
                    row: 7,
                    col: 7
                }
            }
            // user 2 got the first matching number
            if(numLocation2.row != 7) {
                // Mark the number
                await bingo.connect(player2).markNumber(0, numLocation2.row, numLocation2.col);
                marked2 = await bingo.getMarkedSquares(0, player2.address);
                player2HasWon = checkIfPlayerHasWon(marked2)
                numLocation2 = {
                    row: 7,
                    col: 7
                }
            }
            // user 3 got the first matching number
            if(numLocation3.row != 7) {
                // Mark the number
                await bingo.connect(player3).markNumber(0, numLocation3.row, numLocation3.col);
                marked3 = await bingo.getMarkedSquares(0, player3.address);
                player3HasWon = checkIfPlayerHasWon(marked3)
                numLocation3 = {
                    row: 7,
                    col: 7
                }
            }
        }

        if(player1HasWon) {
            let winning = getPlayerWinningSquare(marked1);
            await bingo.connect(player1).win(0, winning[0], winning[1])
        }
        if(player2HasWon) {
            let winning = getPlayerWinningSquare(marked2);
            await bingo.connect(player2).win(0, winning[0], winning[1])
        }
        if(player3HasWon) {
            let winning = getPlayerWinningSquare(marked3);
            await bingo.connect(player3).win(0, winning[0], winning[1])
        }
    }),

    it('should be able to play two games concurrently', async () => {
        await bingo.initiateGame(); // game 1
        await bingo.initiateGame(); // game 2

        await increaseTime(joinDuration);
        await bingo.connect(player1).join(0);
        await bingo.connect(player1).join(1);
        await bingo.start(0);
        await bingo.start(1);

        // Iterate until the player has found a matching number
        let playerBoard = await bingo.getBoard(0, player1.address);
        let playerBoard2 = await bingo.getBoard(1, player1.address);
        let numLocation1 = {
            row: 7,
            col: 7
        }
        let numLocation2 = {
            row: 7,
            col: 7
        }
        let lastDrawnNumber1;
        let lastDrawnNumber2;
        let playerHasWon1 = false;
        let playerHasWon2 = false;
        let marked1;
        let marked2;
        
        while(!(playerHasWon1 || playerHasWon2)) {
            while(numLocation1.row == 7 && numLocation2.row == 7) {
                await increaseTime(turnDuration);
                await bingo.draw(0);
                await bingo.draw(1);
                let game1 = await bingo.games(0);
                let game2 = await bingo.games(1);
                lastDrawnNumber1 = await game1.lastDrawnNumber;
                lastDrawnNumber2 = await game2.lastDrawnNumber;

                numLocation1 = await bingo.checkIfNumberIsInBoard(0, player1.address, lastDrawnNumber1);
                numLocation2 = await bingo.checkIfNumberIsInBoard(1, player1.address, lastDrawnNumber2);
            }

            // Mark the number
            if(numLocation1.row != 7) {
                await bingo.connect(player1).markNumber(0, numLocation1.row, numLocation1.col);

                marked1 = await bingo.getMarkedSquares(0, player1.address);
                expect(marked1[numLocation1.row][numLocation1.col]).to.be.eq(true);
                playerHasWon1 = checkIfPlayerHasWon(marked1)

                numLocation1 = {
                    row: 7,
                    col: 7
                }
            }
            // Mark the number
            if(numLocation2.row != 7) {
                await bingo.connect(player1).markNumber(1, numLocation2.row, numLocation2.col);

                marked2 = await bingo.getMarkedSquares(1, player1.address);
                expect(marked2[numLocation2.row][numLocation2.col]).to.be.eq(true);
                playerHasWon2 = checkIfPlayerHasWon(marked2)

                numLocation2 = {
                    row: 7,
                    col: 7
                }
            }
        }

        if(playerHasWon1) {
            let winning = getPlayerWinningSquare(marked1);
            await bingo.connect(player1).win(0, winning[0], winning[1])
        }
        if(playerHasWon2) {
            winning = getPlayerWinningSquare(marked2);
            await bingo.connect(player1).win(1, winning[0], winning[1])
        }
    })
  })
})
