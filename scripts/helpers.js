const { ethers } = require("hardhat");

/**
 * Utility function to check if player has won
 * @param {*} marked 
 * @returns 
 */
function checkIfPlayerHasWon(marked) {
    let res = getPlayerWinningSquare(marked);
    if(res[0] == -1) {
        return false;
    } else {
        return true;
    }
}

/**
 * Get winning squares for player
 * @param {*} marked 
 * @returns 
 */
function getPlayerWinningSquare(marked) {
    // go through rows
    for(let i = 0 ; i < marked.length ; ++i) {
        if(marked[i][0]) {
            for(let j = 1 ; j < marked[i].length ; ++j) {
                if(!marked[i][j])
                    break;
                if(j == 4) {
                    return [i, 0];
                }
            }
        }
    }
    // go through cols
    for(let i = 0 ; i < marked.length ; ++i) {
        if(marked[0][i]) {
            for(let j = 1 ; j < marked[i].length ; ++j) {
                if(!marked[j][i])
                    break;
                if(j == 4) {
                    return [i, 1];
                }
            }
        }
    }
    // go through diagonals
    for(let i = 0 ; i < marked.length ; ++i) {
        if(!marked[i][i]) {
            break;
        }
        if(i == 4) {
            return [0, 2];
        }
    }
    for(let i = marked.length - 1; i >= 0 ; --i) {
        if(!marked[i][i + 1 - marked.length]) {
            break;
        }
        if(i == 0) {
            return [i, 2];
        }
    }
    return [-1, -1];
}


/**
 * Deploy a contract by name without constructor arguments
 */
 async function deploy(contractName) {
    let Contract = await ethers.getContractFactory(contractName);
    return await Contract.deploy({gasLimit: 8888888});
}

/**
 * Deploy a contract by name with constructor arguments
 */
async function deployArgs(contractName, ...args) {
    let Contract = await ethers.getContractFactory(contractName);
    return await Contract.deploy(...args, {gasLimit: 8888888});
}

/**
 * Mine several blocks in network
 * @param {Number} blockCount how many blocks to mine
 */
 async function mineBlocks(blockCount) {
    for(let i = 0 ; i < blockCount ; ++i) {
        await network.provider.send("evm_mine");
    }
}

/**
 * Increase time in Hardhat Network
 */
 async function increaseTime(time) {
    await network.provider.send("evm_increaseTime", [time]);
    await network.provider.send("evm_mine");
}

/**
 * Returns bignumber scaled to 18 decimals
 */
 function bnDecimal(amount) {
    let decimal = Math.pow(10, 18);
    let decimals = bn(decimal.toString());
    return bn(amount).mul(decimals);
}


/**
 * Return BigNumber
 */
 function bn(amount) {
    return ethers.BigNumber.from(amount);
}

module.exports = { deploy, deployArgs, mineBlocks, increaseTime, bnDecimal, checkIfPlayerHasWon, getPlayerWinningSquare }