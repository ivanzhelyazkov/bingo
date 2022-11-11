//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockWeth is ERC20 {
    constructor() ERC20("WETH", "WETH") {
        _mint(msg.sender, 10000000000000000000 * 10**uint256(decimals()));
    }
}
