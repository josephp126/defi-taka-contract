const { expectRevert, BN, time, constants } = require('@openzeppelin/test-helpers');
const { expect } = require("chai");
const { ethers } = require("hardhat");

const { bufferToHex } = require('ethereumjs-util');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;

describe("SmartTradingProtocol", async function () {
    let addr:any, wallet: any;

})