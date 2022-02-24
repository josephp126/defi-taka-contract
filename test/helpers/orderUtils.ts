import { EIP712Domain } from './eip712';

export const OrderRFQ = [
    { name: 'info', type: 'uint256' },
    { name: 'makerAsset', type: 'address' },
    { name: 'takerAsset', type: 'address' },
    { name: 'maker', type: 'address' },
    { name: 'allowedSender', type: 'address' },
    { name: 'makingAmount', type: 'uint256' },
    { name: 'takingAmount', type: 'uint256' },
];

export const nameProtocol = 'TakaDAO Smart Trading Protocol';
export const version = '1';

export function buildOrderRFQData (chainId:any, verifyingContract:any, order:any) {
    return {
        primaryType: 'OrderRFQ',
        types: { EIP712Domain, OrderRFQ },
        domain: { nameProtocol, version, chainId, verifyingContract },
        message: order,
    };
}