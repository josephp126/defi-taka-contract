//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "./RFQOrder.sol";
import "./LimitOrder.sol";

/// @title TakaDAO Smart Trading Protocol v1
contract SmartTradingProtocol is
    EIP712("TakaDAO Smart Trading Protocol", "1"),
    RFQOrder,
    LimitOrder
{
    // solhint-disable-next-line func-name-mixedcase
     function DOMAIN_SEPARATOR() external view returns(bytes32) {
        return _domainSeparatorV4();
    }
}