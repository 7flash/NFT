import * as BigNumber from "bignumber.js";
import * as Web3 from "web3";

// Solidity type definitions for easy readability
declare type Address = string;

declare type UInt = number | BigNumber.BigNumber;

declare type Bytes32 = string;

interface Log {
    event: string,
    args: object
}
