import { Address } from "cluster";

// import { BN } from '@openzeppelin/test-helpers';
import ethSigUtil from 'eth-sig-util';
// import { fromRpcSig } from 'ethereumjs-util';

export const EIP712Domain = [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
];

const Permit = [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
];

export function domainSeparator (name: String, version: String, chainId: any, verifyingContract: Address) {
    return '0x' + ethSigUtil.TypedDataUtils.hashStruct(
        'EIP712Domain',
        { name, version, chainId, verifyingContract },
        { EIP712Domain },
    ).toString('hex');
}

export function buildData (owner: Address, name: String, version: String, chainId: any, verifyingContract: Address, spender: Address, nonce: any, value: any, deadline: any) {
    return {
        primaryType: 'Permit',
        types: { EIP712Domain, Permit },
        domain: { name, version, chainId, verifyingContract },
        message: { owner, spender, value, nonce, deadline },
    };
}
