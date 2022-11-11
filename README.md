## Gas-optimized Bingo implemented in Solidity

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
- Each game has an associated game id, which is generated on `initiateGame` call 
- Games require at least 1 person to join before being able to call `start`   
- Players need to have approved ERC20 token before calling `join`   

## Instructions to run tests

- npm i
- npx hardhat test

## Max Gas costs

`initiateGame` - 92250  
`start` - 98350  
`win` - 50551  
`draw` - 38034  
`join` - 177813  
`markNumber` - 34986  

## Detailed gas costs (can also be seen from hh test for better formatting)

```
·-----------------------------|---------------------------|--------------|-----------------------------·
|    Solc version: 0.8.17     ·  Optimizer enabled: true  ·  Runs: 7777  ·  Block limit: 30000000 gas  │
······························|···························|··············|······························
|  Methods                                                                                             │
·············|················|·············|·············|··············|···············|··············
|  Contract  ·  Method        ·  Min        ·  Max        ·  Avg         ·  # calls      ·  eur (avg)  │
·············|················|·············|·············|··············|···············|··············
|  Bingo     ·  draw          ·      35222  ·      38034  ·       38007  ·          495  ·          -  │
·············|················|·············|·············|··············|···············|··············
|  Bingo     ·  initiateGame  ·      77950  ·      92250  ·       91229  ·           14  ·          -  │
·············|················|·············|·············|··············|···············|··············
|  Bingo     ·  join          ·     126513  ·     177813  ·      168606  ·           13  ·          -  │
·············|················|·············|·············|··············|···············|··············
|  Bingo     ·  markNumber    ·      28670  ·      34986  ·       33138  ·           75  ·          -  │
·············|················|·············|·············|··············|···············|··············
|  Bingo     ·  start         ·      98349  ·      98361  ·       98350  ·           10  ·          -  │
·············|················|·············|·············|··············|···············|··············
|  Bingo     ·  win           ·      48918  ·      53818  ·       50551  ·            3  ·          -  │
·············|················|·············|·············|··············|···············|··············
|  MockWeth  ·  approve       ·          -  ·          -  ·       46235  ·            3  ·          -  │
·············|················|·············|·············|··············|···············|··············
|  MockWeth  ·  transfer      ·      51354  ·      51366  ·       51362  ·            3  ·          -  │
·············|················|·············|·············|··············|···············|··············
|  Deployments                ·                                          ·  % of limit   ·             │
······························|·············|·············|··············|···············|··············
|  Bingo                      ·          -  ·          -  ·     2232307  ·        7.4 %  ·          -  │
······························|·············|·············|··············|···············|··············
|  MockWeth                   ·          -  ·          -  ·      770181  ·        2.6 %  ·          -  │
·-----------------------------|-------------|-------------|--------------|---------------|-------------·
```