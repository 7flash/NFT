import * as Web3 from "web3";

declare type ContractTest = (accounts: string[]) => void;
declare type ExecutionBlock = () => void;

interface Artifacts {
    require(name: string): Web3.ContractInstance;
}

declare global {
    function contract(name: string, test: ContractTest): void;
    function before(executionBlock: ExecutionBlock): void;
    function beforeEach(executionBlock: ExecutionBlock): void;
    function describe(name: string, executionBlock?: ExecutionBlock): void;
    function it(name: string, executionBlock?: ExecutionBlock): void;

    var artifacts: Artifacts;
    var web3: Web3;
}
