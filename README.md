# Taka Smart Trading Protocol Smart Contract

Takaprotocol is a decentralized exchange for discovering liquidity, trading multiple financial instruments(suca as crypto, FX, commodities, and more) and assets management, when the DeFi ecosystem is in need of advanced trading tools to manage investment risks.

## Smart Trading Protocol

Takaprotocol's smart trading protocol is a set of smart contracts that offers exclusive features for advanced traders, and beginners alike.

### About

This repository contains a smart contract for EVM based blockchains (Ethereum, Binance Smart Chain, etc.), this contract is core part of Smart Trading Protocol.

The smart contract allows users to place limit orders, and RFQ orders that later could be filled on-chain. Both types of orders are a data structure created off-chain and signed according to EIP-712.

Key features of the protocol are **extreme flexibility** and **high gas efficiency** that is achieved by using following order types-regular order, and RFQ order.

### Limit Order

Extremely **flexible** limit order, can be configured with:

1)Stop-loss-order.
    -Based on the conditional orders feature, a stop-loss order is executed when it reaches a particular price point set by the user.
    -When the price limit is reached, the open position will close to prevent further loss.
2)Take-profit order.
    -A Take-profit order is executed when it reaches a particular price point set by the user.
    -When the price limit is reached, the open position will close to take gains.
3)Stepwise buy and sell order.
    -The stepwise buy allows users to buy their assets in a laddered manner when the price decreased for instance by half of your asset for $10,000, the remainder 50% for $9,050.
    -The stepwise sell allows users to sell assets in intervals when the price rises.
4)Trailing buy.
    -Activates if set price value is reached.
    -When activated it begins to monitor price decreasing for smart trade.
    -The trailing level always differs from the price to a constant set value. If price outbreaks the level, smart trading buying begins.
5)Trailing take profit.
    -Activates after the profit level is reached.
    -After activation, it starts to monitor the price movement.For smart trade, it reaches only when the price moves up.
    -The trailing take-profit level always remains unchanged when the price crosses this level, it works with assets for sale in smart trade.
6)Trailing stop-loss.
    -This feature activates immediately after the fact of purchase in smart trade. It will follow the price up for smart trade.
    -Always remains at the specified price deletion. It will always remain at the specified distance from the price.

### RFQ order

**Gas optimized order** with restricted capabilities suitable **for market makers**

- Support expiration time
- Support cancellation by order id
- RFQ Order could be filled only once
- Partial Fill is possible (once)

### Supported tokens
- ERC 20
- ERC 721
- ERC 1155
- Other token standards could be supported via external extension

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.
