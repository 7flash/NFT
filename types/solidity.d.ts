import * as BigNumber from "bignumber.js";

// Solidity type definitions for easy readability
declare type Address = string;

declare type UInt = number | BigNumber.BigNumber;

declare type Bytes32 = string;

interface Log {
    event: string,
    args: object
}
