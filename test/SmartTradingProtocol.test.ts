import { expectRevert, BN, time, constants } from '@openzeppelin/test-helpers';
import { expect } from "chai";
import { ethers } from "hardhat";

import { bufferToHex } from 'ethereumjs-util';
import ethSigUtil from 'eth-sig-util';
import Wallet from 'ethereumjs-wallet'

import { buildOrderRFQData } from './helpers/orderUtils';

describe("SmartTradingProtocol", async function () {
    let addr1:any, wallet: any;

    function buildOrderRFQ (info: any, makerAsset: any, takerAsset: any, makingAmount: any, takingAmount: any, allowedSender = constants.ZERO_ADDRESS) {
        return {
            info,
            makerAsset: makerAsset.address,
            takerAsset: takerAsset.address,
            maker: wallet,
            allowedSender,
            makingAmount,
            takingAmount,
        };
    }
    describe('OrderRFQ Cancelation', async function () {
        it('should cancel own order', async function () {
            await this.swap.cancelOrderRFQ('1');
            const invalidator = await this.swap.invalidatorForOrderRFQ(addr1, '0');
            expect(invalidator).to.be.bignumber.equal(toBN('2'));
        });

        it('should cancel own order with huge number', async function () {
            await this.swap.cancelOrderRFQ('1023');
            const invalidator = await this.swap.invalidatorForOrderRFQ(addr1, '3');
            expect(invalidator).to.be.bignumber.equal(toBN('1').shln(255));
        });

        it('should not fill cancelled order', async function () {
            const order = buildOrderRFQ('1', this.dai, this.weth, 1, 1);
            const data = buildOrderRFQData(this.chainId, this.swap.address, order);
            const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

            await this.swap.cancelOrderRFQ('1', { from: wallet });

            await expectRevert(
                this.swap.fillOrderRFQ(order, signature, 1, 0),
                'LOP: invalidated order',
            );
        });
       
    });


})
