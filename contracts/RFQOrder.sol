//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title RFQ Limit Order
abstract contract RFQOrder is EIP712 {
    using SafeERC20 for IERC20;
    
    /// @notice Emitted when RFQ gets filled
    event OrderFilledRFQ(bytes32 orderHash, uint256 makingAmount);

    struct OrderRFQ {
        uint256 info; // lowest 64 bits is the order id, next 64 bits is the expiration timestamp
        IERC20 makerAsset;
        IERC20 takerAsset;
        address maker;
        address allowedSender; // equals to Zero address on public orders
        uint256 makingAmount;
        uint256 takingAmount;
    }

    bytes32 public constant LIMIT_ORDER_RFQ_TYPEHASH = keccak256(
            "OrderRFQ(uint256 info,address makerAsset,address takerAsset,address maker,address allowedSender,uint256 makingAmount,uint256 takingAmount)"
    );

    mapping(address => mapping(uint256 => uint256)) private _invalidator;

    /// @notice Returns bitmask for double-spend invalidators based on lowest byte of order.info and filled quotes
    /// @return Result Each bit represents whether corresponding was already invalidated
    function _invalidatorForOrderRFQ(address maker, uint256 slot) external view returns (uint256) {
        return _invalidator[maker][slot];
    }

    /// @notice Cancels order's quote
    function cancelOrderRFQ(uint256 orderInfo) external {
        _invalidateOrder(msg.sender, orderInfo);
    }

    function _invalidateOrder(address maker, uint256 orderInfo) private {
        uint256 invalidatorSlot = uint64(orderInfo) >> 8;
        uint256 invalidatorBit = 1 << uint8(orderInfo);
        mapping(uint256 => uint256) storage invalidatorStorage = _invalidator[maker];
        uint256 invalidator = invalidatorStorage[invalidatorSlot];
        require(invalidator & invalidatorBit == 0, "LOP: invalidator order");
        invalidatorStorage[invalidatorSlot] = invalidator | invalidatorBit;
    }

    /// @notice Fills order's quote, fully or partially (whichever is possible)
    /// @param order Order quote to fill
    /// @param signature Signature to confirm quote ownership
    /// @param makingAmount Making amount
    /// @param takingAmount Taking amount
    function fillRFQOrder(
        OrderRFQ memory order,
        bytes calldata signature,
        uint256 makingAmount,
        uint256 takingAmount
    ) external returns(uint256, uint256) {
        return fillRFQOrderTo(order, signature, makingAmount, takingAmount, msg.sender);
    }

    /// @notice Same as `fillOrderRFQ` but allows to specify funds destination instead of `msg.sender`
    /// @param order Order quote to fill
    /// @param signature Signature to confirm quote ownership
    /// @param makingAmount Making amount
    /// @param takingAmount Taking amount
    /// @param target Address that will receive swap funds
    function fillRFQOrderTo(
        OrderRFQ memory order,
        bytes calldata signature,
        uint256 makingAmount,
        uint256 takingAmount,
        address target
    ) public returns(uint256, uint256) {
        require(target != address(0), "LOP: zero target is forbidden");

        address maker = order.maker;

        //validate order
        require(order.allowedSender == address(0) || order.allowedSender == msg.sender, "LOP: private order");

        uint256 info = order.info;
        uint256 expiration = uint128(info) >> 64;

    }


}
