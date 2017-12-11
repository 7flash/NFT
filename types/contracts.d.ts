import * as BigNumber from "bignumber.js";
import * as Web3 from "web3";

type Address = string;
type TransactionOptions = Partial<Transaction>;
type PayableTransactionOptions = Partial<PayableTransaction>;
type UInt = number | BigNumber.BigNumber;

interface Transaction {
  hash: string;
  nonce: number;
  blockHash: string | null;
  blockNumber: number | null;
  transactionIndex: number | null;
  from: Address | ContractInstance;
  to: string | null;
  gasPrice: UInt;
  gas: number;
  input: string;
}

export interface TransactionReturnPayload {
    tx: string;
    receipt: TransactionReceipt;
    logs: TransactionLog[];
}

interface TransactionReceipt {
    transactionHash: string;
    transactionIndex: UInt;
    blockHash: string;
    blockNumber: UInt;
    gasUsed: UInt;
    cumulativeGasUsed: UInt;
    contractAddress: Address;
    logs: TransactionLog[];
    status: UInt;
}

export interface Log {
    event: string;
    args: object;
}

interface TransactionLog extends Log {
    logIndex: UInt;
    transactionIndex: UInt;
    transactionHash: string;
    blockHash: string;
    blockNumber: UInt;
    address: string;
    type: string;
}

interface PayableTransaction extends Transaction {
  value: UInt;
}

interface ContractInstance {
  address: string;
  sendTransaction(options?: PayableTransactionOptions): Promise<void>;
}

interface Contract<T> {
  "new"(...args: any[]): Promise<T>;
  deployed(): Promise<T>;
  at(address: string): T;
}

export interface Artifacts {
    require(name: "Migrations"): Contract<MigrationsContractInstance>;
    require(name: "NFT"): Contract<NFTContractInstance>;
}

export interface MigrationsContractInstance extends ContractInstance {
    setCompleted(completed: UInt, options?: Transaction): Promise<void>;
    upgrade(newAddress: Address): Promise<void>;
}

export interface NFTContractInstance extends ContractInstance {
    name(): Promise<string>;
    symbol(): Promise<string>;
    totalSupply(): Promise<UInt>;
    balanceOf(owner: Address): Promise<UInt>;
    ownerOf(tokenId: UInt): Promise<Address>;
    isERC721(): Promise<boolean>;
    approve(to: Address, tokenId: UInt, options?: TransactionOptions):
        Promise<TransactionReturnPayload>;
    transfer(to: Address, tokenId: UInt, options?: TransactionOptions):
        Promise<TransactionReturnPayload>;
    transferFrom(from: Address, to: Address, tokenId: UInt, options?: TransactionOptions):
        Promise<TransactionReturnPayload>;
    tokenOfOwnerByIndex(owner: Address, index: UInt): Promise<UInt>;
    tokenMetadata(tokenId: UInt): Promise<string>;
}
