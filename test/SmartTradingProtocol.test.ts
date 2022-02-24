import { expectRevert, time, constants } from '@openzeppelin/test-helpers';
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer, BigNumber } from "ethers";

import ethSigUtil from 'eth-sig-util';
import Wallet from 'ethereumjs-wallet'
import {SmartTradingProtocol} from '../typechain-types'
import { buildOrderRFQData } from './helpers/orderUtils';

describe("SmartTradingProtocol", async function () {
    let addr1:Signer;
    let  wallet: Signer;
    let accounts: Signer[];
    let swap: SmartTradingProtocol;
    const privatekey = '59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
    const account = Wallet.fromPrivateKey(Buffer.from(privatekey, 'hex'));

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

    before(async function () {
        accounts = await ethers.getSigners();
        [addr1, wallet] = accounts;
    });

    beforeEach(async function () {
        const TokenMock = await ethers.getContractFactory("TokenMock");
        const WrappedTokenMock = await ethers.getContractFactory("WrappedTokenMock");
        const SmartTradingProtocol = await ethers.getContractFactory("SmartTradingProtocol");
        this.dai = await TokenMock.deploy('DAI', 'DAI');
        this.weth = await WrappedTokenMock.deploy('WETH', 'WETH');
        swap = await SmartTradingProtocol.deploy();

        await this.dai.deployed();
        await this.weth.deployed();
        await swap.deployed();
        this.chainId = await this.dai.getChainId();

        await this.dai.mint(await wallet.getAddress(), '1000000');
        await this.weth.mint(await wallet.getAddress(), '1000000');
        await this.dai.mint(await addr1.getAddress(), '1000000');
        await this.weth.mint(await addr1.getAddress(), '1000000');

        await this.dai.approve(swap.address, '1000000');
        await this.weth.approve(swap.address, '1000000');
        // await this.dai.approve(swap.address, '1000000', { from: await wallet.getAddress() });
        // await this.weth.approve(swap.address, '1000000', { from: await wallet.getAddress() });
    });

    describe('OrderRFQ Cancelation', async function () {
        it('should cancel own order', async function () {
            await swap.cancelOrderRFQ('1');
            const invalidator = await swap.invalidatorForOrderRFQ(await addr1.getAddress(), '0');
            expect(BigNumber.from(invalidator)).to.be.equal(BigNumber.from('2'));
        });

        it('should cancel own order with huge number', async function () {
            await swap.cancelOrderRFQ('1023');
            const invalidator = await swap.invalidatorForOrderRFQ(await addr1.getAddress(), '3');
            expect(BigNumber.from(invalidator)).to.equal(BigNumber.from('1').shl(255));
        });

        it('should not fill cancelled order', async function () {
            const order = buildOrderRFQ('1', this.dai, this.weth, 1, 1);
            const data = buildOrderRFQData(this.chainId, swap.address, order);
            // const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

            // await swap.cancelOrderRFQ('1', { from: wallet });

            // await expectRevert(
            //     swap.fillOrderRFQ(order, signature, 1, 0),
            //     'LOP: invalidated order',
            // );
        });
       
    });


})
