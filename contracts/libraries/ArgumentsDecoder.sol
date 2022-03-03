//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/// @title Library with gas efficient alternatives to `abi.decode`
library ArgumentsDecoder {
    
    function decodeTargetAndCalldata(bytes memory data) internal pure returns(address, bytes memory) {
        address target;
        bytes memory args;
        assembly {  // solhint-disable-line no-inline-assembly
            target := mload(add(data, 0x14))
            args := add(data, 0x14)
            mstore(args, sub(mload(data), 0x14))
        }
        return (target, args);
    }

     function decodeBool(bytes memory data) internal pure returns(bool) {
        bool value;
        assembly { // solhint-disable-line no-inline-assembly
            value := eq(mload(add(data, 0x20)), 1)
        }
        return value;
    }

    function decodeUint256(bytes memory data) internal pure returns(uint256) {
        uint256 value;
        assembly { // solhint-disable-line no-inline-assembly
            value := mload(add(data, 0x20))
        }
        return value;
    }

}
