## Bingo implemented in Solidity
## Metastreet task

## Definition:
Design and implement the smart contract for a decentralized, provably fair Bingo game. Bingo is a luck-based game in which players match a randomized board of numbers with random numbers drawn by a host. The first player to achieve a line of numbers on their board and claim Bingo wins.

**Bingo rules:**

- 5x5 board, middle spot is free
- Sequence of 5 marked numbers in a row, column, or diagonal to win

**Project requirements:**

- Support multiple players in a game
- Support multiple concurrent games
- Each player pays an ERC20 entry fee, transferred on join
- Winner wins the pot of entry fees, transferred on win
- Games have a minimum join duration before start
- Games have a minimum turn duration between draws
- Admin can update the entry fee, join duration, and turn duration

## Design assumptions

- Host must first call initiateGame to allow players to join
- Players which aren't participating won't be able to call mark (they won't have an initialized board)

## Instructions to run tests

- npm i
- cp example.env .env
- npx hardhat test
