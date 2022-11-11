const { ethers, deployments } = require('hardhat');
const { deploy, deployArgs, bnDecimal  } = require('../scripts/helpers');

/**
 * Test fixture
 * Sets up contract for tests
 */
const deploymentFixture = deployments.createFixture(async () => {
  const joinDuration = 30 * 60; // 30 minutes
  const turnDuration = 5 * 60; // 5 minutes
  const joinFee = bnDecimal(1); // 1 wETH join fee
  const joinToken = await deploy('MockWeth'); // join token is weth

  let bingo = await deployArgs('Bingo', joinDuration, turnDuration, joinFee, joinToken.address);

  const [admin, player1, player2, player3] = await ethers.getSigners();
  // send weth to players
  await joinToken.transfer(player1.address, bnDecimal(10))
  await joinToken.transfer(player2.address, bnDecimal(10))
  await joinToken.transfer(player3.address, bnDecimal(10))

  // approve weth to Bingo contract
  // required to join game
  await joinToken.connect(player1).approve(bingo.address, bnDecimal(10))
  await joinToken.connect(player2).approve(bingo.address, bnDecimal(10))
  await joinToken.connect(player3).approve(bingo.address, bnDecimal(10))

  return { bingo, joinDuration, turnDuration, joinFee, joinToken, admin, player1, player2, player3 }
});

module.exports = { deploymentFixture };