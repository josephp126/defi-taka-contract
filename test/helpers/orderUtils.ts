import { BigNumber } from 'ethers';
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

export const name:string = 'TakaDAO Smart Trading Protocol';
export const version:string = '1';


interface MessageTypeProperty {
    name: string;
    type: string;
}
interface MessageTypes {
    EIP712Domain: MessageTypeProperty[];
    [additionalProperties: string]: MessageTypeProperty[];
}
export interface TypedMessage<T extends MessageTypes> {
    types: T;
    primaryType: keyof T;
    domain: {
        name?: string;
        version?: string;
        chainId?: number;
        verifyingContract?: string;
    };
    message: Record<string, unknown>;
}

export function buildOrderRFQData (chainId:number, verifyingContract:string, order:Record<string, unknown>): TypedMessage<MessageTypes> {
    return {
        primaryType: 'OrderRFQ',
        types: { EIP712Domain, OrderRFQ },
        domain: { name, version, chainId, verifyingContract },
        message: order,
    };
}