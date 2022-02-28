import { BN, ether } from '@openzeppelin/test-helpers';

export const ownerPrivateKey = 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

export function toBN (num: any) {
    return new BN(num);
}

export function cutSelector (data: any) {
    const hexPrefix = '0x';
    return hexPrefix + data.substr(hexPrefix.length + 8);
}
