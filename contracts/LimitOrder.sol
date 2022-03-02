//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./helpers/AmountCalculator.sol";
import "./libraries/Permitable.sol";

/// @title Regular Limit Order 
abstract contract LimitOrder is
    EIP712,
    AmountCalculator,
    Permitable
{
    using Address for address;

    /// @notice Emitted every time order gets filled, including partial fills
    event OrderFilled(
        address indexed maker,
        bytes32 orderHash,
        uint256 remaining
    );

    /// @notice Emitted when order gets cancelled
    event OrderCancelled(
        address indexed maker,
        bytes32 orderHash,
        uint256 remainingRaw
    );

    

}