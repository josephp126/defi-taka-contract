import { expectRevert, time, constants } from '@openzeppelin/test-helpers';
import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer, BigNumber } from "ethers";

import { signTypedMessage } from 'eth-sig-util';
import Wallet from 'ethereumjs-wallet'
import { SmartTradingProtocol, TokenMock, WrappedTokenMock } from '../typechain-types'
import { buildOrderRFQData, name, version } from './helpers/orderUtils';
import { ownerPrivateKey } from './helpers/utils';
import { getPermit, domainSeparator } from './helpers/eip712'
import { profileEVM, gasspectEVM } from './helpers/profileEVM'

describe("SmartTradingProtocol", async function () {
    let owner: Signer;
    let wallet: Signer;
    let accounts: Signer[];
    let swap: SmartTradingProtocol;
    let dai: TokenMock;
    let weth: WrappedTokenMock;

    // const privatekey = 'd7f6ba85816a785036f9fc52c7c2e7cbfa4cd2a6cf077d25e8a8f87a3e600c87';
    //we must use this privatekey for this contract test;
    const privatekey = '59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
    const account = Wallet.fromPrivateKey(Buffer.from(privatekey, 'hex'));

    async function buildOrderRFQ(info: any, makerAsset: any, takerAsset: any, makingAmount: any, takingAmount: any, allowedSender = constants.ZERO_ADDRESS) {
        return {
            info,
            makerAsset: makerAsset.address,
            takerAsset: takerAsset.address,
            maker: await wallet.getAddress(),
            allowedSender,
            makingAmount,
            takingAmount,
        };
    }

    before(async function () {
        accounts = await ethers.getSigners();
        [owner, wallet] = accounts;
    });

    beforeEach(async function () {
        const TokenMock = await ethers.getContractFactory("TokenMock");
        const WrappedTokenMock = await ethers.getContractFactory("WrappedTokenMock");
        const SmartTradingProtocol = await ethers.getContractFactory("SmartTradingProtocol");
        dai = await TokenMock.deploy('DAI', 'DAI');
        weth = await WrappedTokenMock.deploy('WETH', 'WETH');
        swap = await SmartTradingProtocol.deploy();

        await dai.deployed();
        await weth.deployed();
        await swap.deployed();
        this.chainId = (await dai.getChainId()).toNumber();

        await dai.mint(await wallet.getAddress(), '1000000');
        await weth.mint(await wallet.getAddress(), '1000000');
        await dai.mint(await owner.getAddress(), '1000000');
        await weth.mint(await owner.getAddress(), '1000000');

        await dai.approve(swap.address, '1000000');
        await weth.approve(swap.address, '1000000');
        await dai.connect(wallet).approve(swap.address, '1000000');
        await weth.connect(wallet).approve(swap.address, '1000000');
    });
    describe('Eip712', async function () {
        
        // We get the chain id from the contract because Ganache (used for coverage) does not return the same chain id
        // from within the EVM as from the JSON RPC interface.
        // See https://github.com/trufflesuite/ganache-core/issues/515

        it('domain separator', async function () {
            expect(
                await swap.DOMAIN_SEPARATOR(),
            ).to.equal(
                domainSeparator(name, version, this.chainId, swap.address),
            );
        });
    });

    describe('OrderRFQ Cancelation', async function () {
        it('should cancel own order', async function () {
            await swap.cancelOrderRFQ('1');
            const invalidator = await swap.invalidatorForOrderRFQ(await owner.getAddress(), '0');
            expect(BigNumber.from(invalidator)).to.be.equal(BigNumber.from('2'));
        });

        it('should cancel own order with huge number', async function () {
            await swap.cancelOrderRFQ('1023');
            const invalidator = await swap.invalidatorForOrderRFQ(await owner.getAddress(), '3');
            expect(BigNumber.from(invalidator)).to.equal(BigNumber.from('1').shl(255));
        });

        it('should not fill cancelled order', async function () {
            const order = await buildOrderRFQ('1', dai, weth, 1, 1);
            const data = buildOrderRFQData(this.chainId, swap.address, order);
            const signature = signTypedMessage(account.getPrivateKey(), { data });

            await swap.connect(wallet).cancelOrderRFQ('1');
            await expect(swap.fillRFQOrder(order, signature, 1, 0)).to.revertedWith('LOP: invalidated order');

        });
    });

    describe('Expiration', async function () {

        it('should fill RFQ order when not expired', async function () {
            const order = await buildOrderRFQ('20203181441137406086353707335681', dai, weth, 1, 1);
            const data = buildOrderRFQData(this.chainId, swap.address, order);
            const signature = signTypedMessage(account.getPrivateKey(), { data });

            const makerDai = await dai.balanceOf(await wallet.getAddress());
            const takerDai = await dai.balanceOf(await owner.getAddress());
            const makerWeth = await weth.balanceOf(await wallet.getAddress());
            const takerWeth = await weth.balanceOf(await owner.getAddress());

            await swap.fillRFQOrder(order, signature, 1, 0);

            expect(BigNumber.from(await dai.balanceOf(await wallet.getAddress()))).to.equal(BigNumber.from(makerDai).sub(1));
            expect(BigNumber.from(await dai.balanceOf(await owner.getAddress()))).to.equal(BigNumber.from(takerDai).add(1));
            expect(BigNumber.from(await weth.balanceOf(await wallet.getAddress()))).to.equal(BigNumber.from(makerWeth).add(1));
            expect(BigNumber.from(await weth.balanceOf(await owner.getAddress()))).to.equal(BigNumber.from(takerWeth).sub(1));
        });

        it('should partial fill RFQ order', async function () {
            const order = await buildOrderRFQ('20203181441137406086353707335681', dai, weth, 2, 2);
            const data = buildOrderRFQData(this.chainId, swap.address, order);
            const signature = signTypedMessage(account.getPrivateKey(), { data });

            const makerDai = await dai.balanceOf(await wallet.getAddress());
            const takerDai = await dai.balanceOf(await owner.getAddress());
            const makerWeth = await weth.balanceOf(await wallet.getAddress());
            const takerWeth = await weth.balanceOf(await owner.getAddress());

            await swap.fillRFQOrder(order, signature, 1, 0);

            expect(BigNumber.from(await dai.balanceOf(await wallet.getAddress()))).to.be.equal(BigNumber.from(makerDai).sub(1));
            expect(BigNumber.from(await dai.balanceOf(await owner.getAddress()))).to.be.equal(BigNumber.from(takerDai).add(1));
            expect(BigNumber.from(await weth.balanceOf(await wallet.getAddress()))).to.be.equal(BigNumber.from(makerWeth).add(1));
            expect(BigNumber.from(await weth.balanceOf(await owner.getAddress()))).to.be.equal(BigNumber.from(takerWeth).sub(1));
        });

        it('should fully fill RFQ order', async function () {
            const order = await buildOrderRFQ('20203181441137406086353707335681', dai, weth, 1, 1);
            const data = buildOrderRFQData(this.chainId, swap.address, order);
            const signature = signTypedMessage(account.getPrivateKey(), { data });

            const makerDai = await dai.balanceOf(await wallet.getAddress());
            const takerDai = await dai.balanceOf(await owner.getAddress());
            const makerWeth = await weth.balanceOf(await wallet.getAddress());
            const takerWeth = await weth.balanceOf(await owner.getAddress());

            await swap.fillRFQOrder(order, signature, 0, 0);

            expect(BigNumber.from(await dai.balanceOf(await wallet.getAddress()))).to.be.equal(BigNumber.from(makerDai).sub(1));
            expect(BigNumber.from(await dai.balanceOf(await owner.getAddress()))).to.be.equal(BigNumber.from(takerDai).add(1));
            expect(BigNumber.from(await weth.balanceOf(await wallet.getAddress()))).to.be.equal(BigNumber.from(makerWeth).add(1));
            expect(BigNumber.from(await weth.balanceOf(await owner.getAddress()))).to.be.equal(BigNumber.from(takerWeth).sub(1));
        });

        it('should not fill RFQ order when expired', async function () {
            const order = await buildOrderRFQ('308276084001730439550074881', dai, weth, 1, 1);
            const data = buildOrderRFQData(this.chainId, swap.address, order);
            const signature = signTypedMessage(account.getPrivateKey(), { data });

            await expect(swap.fillRFQOrder(order, signature, 1, 0)).to.revertedWith('LOP: order expired');
        });

        it('should not partial fill RFQ order when 0', async function () {
            const order = await buildOrderRFQ('20203181441137406086353707335681', dai, weth, 5, 10);
            const data = buildOrderRFQData(this.chainId, swap.address, order);
            const signature = signTypedMessage(account.getPrivateKey(), { data });

            await expect(swap.fillRFQOrder(order, signature, 0, 1)).to.revertedWith('LOP: can\'t swap 0 amount');
        });

    });

    describe('Permit', function () {
        describe('fillOrderRFQToWithPermit', function () {
            it('DAI => WETH', async function () {
                // await dai.connect(account.getAddressString()).approve(swap.address, '1000000');
                await dai.connect(wallet).approve(swap.address, '1000000');
                const order = await buildOrderRFQ('20203181441137406086353707335681', dai, weth, 1, 1);
                const data = buildOrderRFQData(this.chainId, swap.address, order);
                const signature = signTypedMessage(account.getPrivateKey(), { data });

                const permit: any = await getPermit(owner, ownerPrivateKey, weth, '1', this.chainId, swap.address, '1');
                const makerDai = await dai.balanceOf(await wallet.getAddress());
                const takerDai = await dai.balanceOf(await owner.getAddress());
                const makerWeth = await weth.balanceOf(await wallet.getAddress());
                const takerWeth = await weth.balanceOf(await owner.getAddress());
                // const allowance = await weth.allowance(account.getAddressString(), swap.address);
                const allowance = await weth.allowance(await wallet.getAddress(), swap.address);
                await swap.fillRFQOrderToWithPermit(order, signature, 1, 0, await owner.getAddress(), permit);

                expect(BigNumber.from(await dai.balanceOf(await wallet.getAddress()))).to.equal(BigNumber.from(makerDai).sub(1));
                expect(BigNumber.from(await dai.balanceOf(await owner.getAddress()))).to.equal(BigNumber.from(takerDai).add(1));
                expect(BigNumber.from(await weth.balanceOf(await wallet.getAddress()))).to.equal(BigNumber.from(makerWeth).add(1));
                expect(BigNumber.from(await weth.balanceOf(await owner.getAddress()))).to.equal(BigNumber.from(takerWeth).sub(1));
                // expect(BigNumber.from(allowance)).to.eq(BigNumber.from('0'));
                expect(BigNumber.from(allowance)).to.eq(BigNumber.from('1000000'));
            });

            it('rejects reused signature', async function () {
                // await dai.approve(swap.address, '1000000', { from: account.getAddressString() });
                await dai.connect(wallet).approve(swap.address, '1000000');
                const order = await buildOrderRFQ('20203181441137406086353707335681', dai, weth, 1, 1);
                const data = buildOrderRFQData(this.chainId, swap.address, order);
                const signature = signTypedMessage(account.getPrivateKey(), { data });

                const permit = await getPermit(owner, ownerPrivateKey, weth, '1', this.chainId, swap.address, '1');
                await swap.fillRFQOrderToWithPermit(order, signature, 0, 1, await owner.getAddress(), permit);
                await expect(swap.fillRFQOrderToWithPermit(order, signature, 0, 1, await owner.getAddress(), permit)).to.revertedWith('ERC20Permit: invalid signature');
            });

            it('rejects other signature', async function () {
                // await dai.approve(swap.address, '1000000', { from: account.getAddressString() });
                dai.approve(swap.address, '1000000');
                const order = await buildOrderRFQ('20203181441137406086353707335681', dai, weth, 1, 1);
                const data = buildOrderRFQData(this.chainId, swap.address, order);
                const signature = signTypedMessage(account.getPrivateKey(), { data });

                const otherWallet = Wallet.generate();
                const permit = await getPermit(owner, otherWallet.getPrivateKey(), weth, '1', this.chainId, swap.address, '1');
                await expect(swap.fillRFQOrderToWithPermit(order, signature, 0, 1, await owner.getAddress(), permit)).to.revertedWith('ERC20Permit: invalid signature');
            });

            it('rejects expired permit', async function () {
                const latestBlock = await ethers.provider.getBlock("latest")
                const deadline = latestBlock.timestamp - time.duration.weeks(1);
                console.log('deadline', deadline);
                const order = await buildOrderRFQ('20203181441137406086353707335681', dai, weth, 1, 1);
                const data = buildOrderRFQData(this.chainId, swap.address, order);
                const signature = signTypedMessage(account.getPrivateKey(), { data });

                const permit = await getPermit(owner, ownerPrivateKey, weth, '1', this.chainId, swap.address, '1', deadline.toString());
                await expect(swap.fillRFQOrderToWithPermit(order, signature, 0, 1, await owner.getAddress(), permit)).to.revertedWith('expired deadline');
            });

        })
    });

    describe('wip', async function () {
        it('transferFrom', async function () {
            await dai.connect(wallet).approve(await owner.getAddress(), '2');
            await dai.connect(owner).transferFrom(await wallet.getAddress(), await owner.getAddress(), '1');
        });



        it('should swap fully based on RFQ signature', async function () {
            // Order: 1 DAI => 1 WETH
            // Swap:  1 DAI => 1 WETH

            for (const salt of ['000000000000000000000001', '000000000000000000000002']) {
                const order = await buildOrderRFQ(salt, dai, weth, 1, 1);
                const data = buildOrderRFQData(this.chainId, swap.address, order);
                const signature = signTypedMessage(account.getPrivateKey(), { data });

                const makerDai = await dai.balanceOf(await wallet.getAddress());
                const takerDai = await dai.balanceOf(await owner.getAddress());
                const makerWeth = await weth.balanceOf(await wallet.getAddress());
                const takerWeth = await weth.balanceOf(await owner.getAddress());

                const receipt = await swap.fillRFQOrder(order, signature, 1, 0);

                expect(
                    await profileEVM(receipt.hash, ['CALL', 'STATICCALL', 'SSTORE', 'SLOAD', 'EXTCODESIZE']),
                ).to.be.deep.equal([2, 1, 7, 7, 2]);

                await gasspectEVM(receipt.hash);

                expect(BigNumber.from(await dai.balanceOf(await wallet.getAddress()))).to.equal(BigNumber.from(makerDai).sub(1));
                expect(BigNumber.from(await dai.balanceOf(await owner.getAddress()))).to.equal(BigNumber.from(takerDai).add(1));
                expect(BigNumber.from(await weth.balanceOf(await wallet.getAddress()))).to.equal(BigNumber.from(makerWeth).add(1));
                expect(BigNumber.from(await weth.balanceOf(await owner.getAddress()))).to.equal(BigNumber.from(takerWeth).sub(1));
            }
        });

    });

})
