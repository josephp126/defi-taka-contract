import { BN } from '@openzeppelin/test-helpers';
// import  '@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol:ERC20Permit';
import {signTypedMessage, TypedDataUtils} from 'eth-sig-util';
import { fromRpcSig } from 'ethereumjs-util';
import {cutSelector} from './utils'
import type { ERC20Permit} from "../../typechain-types";
import { ethers } from "hardhat";
import { Contract, Signer, BigNumber, Bytes, BytesLike } from "ethers";
import { parseEther } from 'ethers/lib/utils';

let permitContract: ERC20Permit;
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
// const defaultDeadline = new BN('18446744073709551615');
const defaultDeadline = '18446744073709551615';

export function domainSeparator (name: string, version: string, chainId: number, verifyingContract: string) {
    return '0x' + TypedDataUtils.hashStruct(
        'EIP712Domain',
        { name, version, chainId, verifyingContract },
        { EIP712Domain },
    ).toString('hex');
}

export function buildData (owner: any, name: string, version: string, chainId: any, verifyingContract: string, spender: any, nonce: any, value: any, deadline: any) : TypedMessage<MessageTypes> {
    return {
        primaryType: 'Permit',
        types: { EIP712Domain, Permit },
        domain: { name, version, chainId, verifyingContract },
        message: { owner, spender, value, nonce, deadline },
    };
}

export async function getPermit (owner: any, ownerPrivateKey: any, token: any, tokenVersion: any, chainId: number, spender: any, value: any, deadline = defaultDeadline) {
    // const permitContract = await ERC20Permit.at(token.address);
    permitContract = await token.attach(token.address);
    const nonce = (await permitContract.nonces(await owner.getAddress())).toNumber();
    const name = await permitContract.name()
    const data = buildData(await owner.getAddress(), name, tokenVersion, chainId, token.address, spender, nonce, value, deadline);
    const signature = signTypedMessage(Buffer.from(ownerPrivateKey, 'hex'), { data });
    const { v, r, s } = fromRpcSig(signature);
    // const permitCall = await permitContract.permit(await owner.getAddress(), spender, value, BigNumber.from(deadline), v, r, s);

    // console.log('permitcall',permitCall);
    let iface = new ethers.utils.Interface([
        "function permit(address,address,uint256,uint256,uint8,bytes32,bytes32)"
    ]);
    let permitdata = iface.encodeFunctionData("permit", [
         await owner.getAddress(), 
         spender, 
         value, 
         BigNumber.from(deadline), 
         v, 
         r, 
         s
    ]);
    console.log('permitdata', permitdata);
    return cutSelector(permitdata);
    // return cutSelector(permitCall);
}