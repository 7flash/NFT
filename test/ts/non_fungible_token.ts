import * as BigNumber from "bignumber.js";
import * as chai from "chai";
import * as Web3 from "web3";
import * as ABIDecoder from "abi-decoder";

import {TestMintableNFTContract} from "../../types/generated/test_mintable_n_f_t";
import {BigNumberSetup} from "./utils/bignumber_setup.js";
import {chaiSetup} from "./utils/chai_setup.js";
import {INVALID_OPCODE, REVERT_ERROR} from "./utils/constants";
import {LogApproval, LogTransfer} from "./utils/logs";

// Set up Chai
chaiSetup.configure();
const expect = chai.expect;

// Configure BigNumber exponentiation
BigNumberSetup.configure();

// Import truffle contract instance
const mintableNftContract = artifacts.require("TestMintableNFT");

// Initialize ABI Decoder for deciphering log receipts
ABIDecoder.addABI(mintableNftContract.abi);

contract("Non-Fungible Token", (ACCOUNTS) => {
    let mintableNft: TestMintableNFTContract;

    const NFT_NAME = "Example NFT";
    const NFT_SYMBOL = "ENT";

    const CONTRACT_OWNER = ACCOUNTS[0];
    const TOKEN_OWNER_1 = ACCOUNTS[1];
    const TOKEN_OWNER_2 = ACCOUNTS[2];
    const TOKEN_OWNER_3 = ACCOUNTS[3];

    const TOKEN_ID_1 = new BigNumber.BigNumber(0);
    const TOKEN_ID_2 = (new BigNumber.BigNumber(2)).pow(64); // 2 ** 64
    const TOKEN_ID_3 = (new BigNumber.BigNumber(2)).pow(128); // 2 ** 128
    const NONEXISTENT_TOKEN_ID = new BigNumber.BigNumber(13);
    const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

    const METADATA_STRING_1 = "ipfs://QmZU8bKEG8fhcQwKoLHfjtJoKBzvUT5LFR3f8dEz86WdVe";
    const METADATA_STRING_2 = "https://www.example.com";
    const METADATA_STRING_3 = "unstructured arbitrary metadata string";

    const TX_DEFAULTS = { from: CONTRACT_OWNER, gas: 4000000 };

    const deployNft = async () => {
        const instance =
            await mintableNftContract.new(
                NFT_NAME, NFT_SYMBOL, TX_DEFAULTS);

        // The generated contract typings we use ingest raw Web3 contract instances,
        // so we create a Web3 contract instance from the Truffle contract instance

        const web3ContractInstance =
            web3.eth.contract(instance.abi).at(instance.address);

        mintableNft = new TestMintableNFTContract(
            web3ContractInstance, TX_DEFAULTS);
    }

    const deployAndInitNft = async () => {
        await deployNft();

        await mintableNft.mint
            .sendTransactionAsync(TOKEN_OWNER_1, TOKEN_ID_1, METADATA_STRING_1);
        await mintableNft.mint
            .sendTransactionAsync(TOKEN_OWNER_2, TOKEN_ID_2, METADATA_STRING_2);
        await mintableNft.mint
            .sendTransactionAsync(TOKEN_OWNER_3, TOKEN_ID_3, METADATA_STRING_3);
    }

    before(deployNft);

    describe("Flags", () => {
        it("should expose implementsERC721 method", async () => {
            await expect(mintableNft.implementsERC721.callAsync()).to.eventually.equal(true);
        });
    });

    describe("General NFT Metadata", () => {
        it("should expose name variable", async () => {
            const test =  await mintableNft.name.callAsync();
            await expect(mintableNft.name.callAsync()).to.eventually.equal(NFT_NAME);
        });

        it("should expose symbol variable", async () => {
            await expect(mintableNft.symbol.callAsync()).to.eventually.equal(NFT_SYMBOL);
        });
    });

    describe("#totalSupply()", async () => {
        it("should return 0 for initial supply", async () => {
            await expect(mintableNft.totalSupply.callAsync()).to.eventually.bignumber.equal(0);
        });

        it("should return correct current supply after each mint", async () => {
            await mintableNft.mint
                .sendTransactionAsync(TOKEN_OWNER_1, TOKEN_ID_1, METADATA_STRING_1);
            await expect(mintableNft.totalSupply.callAsync()).to.eventually.bignumber.equal(1);

            await mintableNft.mint
                .sendTransactionAsync(TOKEN_OWNER_2, TOKEN_ID_2, METADATA_STRING_2);
            await expect(mintableNft.totalSupply.callAsync()).to.eventually.bignumber.equal(2);

            await mintableNft.mint
                .sendTransactionAsync(TOKEN_OWNER_3, TOKEN_ID_3, METADATA_STRING_3);
            await expect(mintableNft.totalSupply.callAsync()).to.eventually.bignumber.equal(3);
        });
    });

    describe('#balanceOf()', async () => {
        before(deployAndInitNft);

        it("should return 1 for each owner's balance", async () => {
            await expect(mintableNft.balanceOf.callAsync(TOKEN_OWNER_1))
                .to.eventually.bignumber.equal(1);
            await expect(mintableNft.balanceOf.callAsync(TOKEN_OWNER_2))
                .to.eventually.bignumber.equal(1);
            await expect(mintableNft.balanceOf.callAsync(TOKEN_OWNER_3))
                .to.eventually.bignumber.equal(1);
        });
    });

    describe('#tokenOfOwnerByIndex()', async () => {
        before(deployAndInitNft);

        it("should return current token at index 0 for each user", async () => {
            await expect(mintableNft.tokenOfOwnerByIndex
                .callAsync(TOKEN_OWNER_1, new BigNumber.BigNumber(0)))
                .to.eventually.bignumber.equal(TOKEN_ID_1);
            await expect(mintableNft.tokenOfOwnerByIndex
                .callAsync(TOKEN_OWNER_2, new BigNumber.BigNumber(0)))
                .to.eventually.bignumber.equal(TOKEN_ID_2);
            await expect(mintableNft.tokenOfOwnerByIndex
                .callAsync(TOKEN_OWNER_3, new BigNumber.BigNumber(0)))
                .to.eventually.bignumber.equal(TOKEN_ID_3);
        });

        it("should throw if called at index > balanceOf(owner)", async () => {
            await expect(mintableNft.tokenOfOwnerByIndex
                .callAsync(TOKEN_OWNER_1, new BigNumber.BigNumber(1)))
                .to.eventually.be.rejectedWith(INVALID_OPCODE);
            await expect(mintableNft.tokenOfOwnerByIndex
                .callAsync(TOKEN_OWNER_2, new BigNumber.BigNumber(1)))
                .to.eventually.be.rejectedWith(INVALID_OPCODE);
                await expect(mintableNft.tokenOfOwnerByIndex
                    .callAsync(TOKEN_OWNER_3, new BigNumber.BigNumber(1)))
                    .to.eventually.be.rejectedWith(INVALID_OPCODE);
        });
    });

    describe("#tokenMetadata()", async () => {
        before(deployAndInitNft);

        it("should return correct metadata for each token", async () => {
            await expect(mintableNft.tokenMetadata.callAsync(TOKEN_ID_1))
                .to.eventually.equal(METADATA_STRING_1);
            await expect(mintableNft.tokenMetadata.callAsync(TOKEN_ID_2))
                .to.eventually.equal(METADATA_STRING_2);
            await expect(mintableNft.tokenMetadata.callAsync(TOKEN_ID_3))
                .to.eventually.equal(METADATA_STRING_3);
        });
    });

    describe("#transfer()", async () => {
        before(deployAndInitNft);

        describe("user transfers token he doesn't own", async () => {
            it("should throw", async () => {
                await expect(mintableNft.transfer
                    .sendTransactionAsync(TOKEN_OWNER_1, TOKEN_ID_2,
                        { from: TOKEN_OWNER_1 }))
                        .to.eventually.be.rejectedWith(REVERT_ERROR);
            });
        });

        describe("user transfers token that doesn't exist", async () => {
            it("should throw", async () => {
                await expect(mintableNft.transfer
                    .sendTransactionAsync(TOKEN_OWNER_1, NONEXISTENT_TOKEN_ID,
                        { from: TOKEN_OWNER_1 }))
                        .to.eventually.be.rejectedWith(REVERT_ERROR);
            });
        });

        describe("user transfers token he owns", async () => {
            let res: Web3.TransactionReceipt;

            before(async () => {
                const txHash = await mintableNft.transfer
                    .sendTransactionAsync(TOKEN_OWNER_2, TOKEN_ID_1,
                        { from: TOKEN_OWNER_1 });
                res = await web3.eth.getTransactionReceipt(txHash);
            });

            it("should emit transfer log", async () => {
                const [approvalLog, transferLog] = ABIDecoder.decodeLogs(res.logs);
                const logExpected =
                    LogTransfer(mintableNft.address, TOKEN_OWNER_1, TOKEN_OWNER_2, TOKEN_ID_1);

                expect(transferLog).to.deep.equal(logExpected);
            });

            it("should belong to new owner", async () => {
                await expect(mintableNft.ownerOf.callAsync(TOKEN_ID_1))
                    .to.eventually.equal(TOKEN_OWNER_2);
            });

            it("should update owners' token balances correctly", async () => {
                await expect(mintableNft.balanceOf.callAsync(TOKEN_OWNER_1))
                    .to.eventually.bignumber.equal(0);
                await expect(mintableNft.balanceOf.callAsync(TOKEN_OWNER_2))
                    .to.eventually.bignumber.equal(2);
                await expect(mintableNft.balanceOf.callAsync(TOKEN_OWNER_3))
                    .to.eventually.bignumber.equal(1);
            });

            it("should update owners' iterable token lists", async () => {
                // TOKEN_OWNER_1
                await expect(mintableNft.tokenOfOwnerByIndex.callAsync(TOKEN_OWNER_1,
                    new BigNumber.BigNumber(0))).to.eventually.be.rejectedWith(INVALID_OPCODE);

                // TOKEN_OWNER_2
                await expect(mintableNft.tokenOfOwnerByIndex.callAsync(TOKEN_OWNER_2,
                    new BigNumber.BigNumber(0))).to.eventually.bignumber.equal(TOKEN_ID_2);
                await expect(mintableNft.tokenOfOwnerByIndex.callAsync(TOKEN_OWNER_2,
                    new BigNumber.BigNumber(1))).to.eventually.bignumber.equal(TOKEN_ID_1);
                await expect(mintableNft.tokenOfOwnerByIndex.callAsync(TOKEN_OWNER_2,
                    new BigNumber.BigNumber(2))).to.eventually.be.rejectedWith(INVALID_OPCODE);

                // TOKEN_OWNER_3
                await expect(mintableNft.tokenOfOwnerByIndex.callAsync(TOKEN_OWNER_3,
                    new BigNumber.BigNumber(0))).to.eventually.bignumber.equal(TOKEN_ID_3);
                await expect(mintableNft.tokenOfOwnerByIndex.callAsync(TOKEN_OWNER_3,
                    new BigNumber.BigNumber(1))).to.eventually.be.rejectedWith(INVALID_OPCODE);
            });
        });

        describe("user transfers token he no longer owns", () => {
            it("should throw", async () => {
                await expect(mintableNft.transfer
                    .sendTransactionAsync(TOKEN_OWNER_2, TOKEN_ID_1,
                        { from: TOKEN_OWNER_1 })).to.eventually.be
                        .rejectedWith(REVERT_ERROR);
            });
        });

        describe("user transfers token he owns to 0", () => {
            it("should throw", async () => {
                await expect(mintableNft.transfer
                    .sendTransactionAsync(NULL_ADDRESS, TOKEN_ID_1,
                        { from: TOKEN_OWNER_1 })).to.eventually.be
                        .rejectedWith(REVERT_ERROR);
            });
        });

        describe("user transfers token he owns to himself", () => {
            let res: Web3.TransactionReceipt;

            before(async () => {
                const txHash = await mintableNft.transfer
                    .sendTransactionAsync(TOKEN_OWNER_2, TOKEN_ID_1,
                        { from: TOKEN_OWNER_2 });
                res = await web3.eth.getTransactionReceipt(txHash);
            });

            it("should emit transfer log", async () => {
                const [approvalLog, transferLog] = ABIDecoder.decodeLogs(res.logs);
                const logExpected =
                    LogTransfer(mintableNft.address, TOKEN_OWNER_2, TOKEN_OWNER_2, TOKEN_ID_1);

                expect(transferLog).to.deep.equal(logExpected);
            });

            it("should belong to same owner", async () => {
                await expect(mintableNft.ownerOf.callAsync(TOKEN_ID_1))
                    .to.eventually.equal(TOKEN_OWNER_2);
            });

            it("should maintain owners' token balances correctly", async () => {
                await expect(mintableNft.balanceOf.callAsync(TOKEN_OWNER_1))
                    .to.eventually.bignumber.equal(0);
                await expect(mintableNft.balanceOf.callAsync(TOKEN_OWNER_2))
                    .to.eventually.bignumber.equal(2);
                await expect(mintableNft.balanceOf.callAsync(TOKEN_OWNER_3))
                    .to.eventually.bignumber.equal(1);
            });

            it("should not modify owners' iterable token lists", async () => {
                // TOKEN_OWNER_1
                await expect(mintableNft.tokenOfOwnerByIndex
                    .callAsync(TOKEN_OWNER_1, new BigNumber.BigNumber(0)))
                    .to.eventually.be.rejectedWith(INVALID_OPCODE);

                // TOKEN_OWNER_2
                await expect(mintableNft.tokenOfOwnerByIndex
                    .callAsync(TOKEN_OWNER_2, new BigNumber.BigNumber(0)))
                    .to.eventually.bignumber.equal(TOKEN_ID_2);
                await expect(mintableNft.tokenOfOwnerByIndex
                    .callAsync(TOKEN_OWNER_2, new BigNumber.BigNumber(1)))
                    .to.eventually.bignumber.equal(TOKEN_ID_1);
                await expect(mintableNft.tokenOfOwnerByIndex
                    .callAsync(TOKEN_OWNER_2, new BigNumber.BigNumber(2)))
                    .to.eventually.be.rejectedWith(INVALID_OPCODE);

                // TOKEN_OWNER_3
                await expect(mintableNft.tokenOfOwnerByIndex
                    .callAsync(TOKEN_OWNER_3, new BigNumber.BigNumber(0)))
                    .to.eventually.bignumber.equal(TOKEN_ID_3);
                await expect(mintableNft.tokenOfOwnerByIndex
                    .callAsync(TOKEN_OWNER_3, new BigNumber.BigNumber(1)))
                    .to.eventually.be.rejectedWith(INVALID_OPCODE);
            });
        });


        describe("user transfers token with outstanding approval", () => {
            let res: Web3.TransactionReceipt;
            let approvalLog: ABIDecoder.DecodedLog;
            let transferLog: ABIDecoder.DecodedLog;

            before(async () => {
                await mintableNft.approve.sendTransactionAsync(
                    TOKEN_OWNER_1, TOKEN_ID_3, { from: TOKEN_OWNER_3 });
                const txHash = await mintableNft.transfer
                    .sendTransactionAsync(TOKEN_OWNER_1, TOKEN_ID_3,
                        { from: TOKEN_OWNER_3 });
                res = await web3.eth.getTransactionReceipt(txHash);

                [approvalLog, transferLog] = ABIDecoder.decodeLogs(res.logs);
            });

            it("should emit approval clear log", () => {
                const logExpected =
                    LogApproval(mintableNft.address, TOKEN_OWNER_3, NULL_ADDRESS, TOKEN_ID_3);

                expect(approvalLog).to.deep.equal(logExpected);
            });

            it("should emit transfer log", () => {
                const logExpected =
                    LogTransfer(mintableNft.address, TOKEN_OWNER_3, TOKEN_OWNER_1, TOKEN_ID_3);

                expect(transferLog).to.deep.equal(logExpected);
            });

            it("should belong to new owner", async () => {
                await expect(mintableNft.ownerOf.callAsync(TOKEN_ID_3))
                    .to.eventually.equal(TOKEN_OWNER_1);
            });

            it("should update owners' token balances correctly", async () => {
                await expect(mintableNft.balanceOf.callAsync(TOKEN_OWNER_1))
                    .to.eventually.bignumber.equal(1);
                await expect(mintableNft.balanceOf.callAsync(TOKEN_OWNER_2))
                    .to.eventually.bignumber.equal(2);
                await expect(mintableNft.balanceOf.callAsync(TOKEN_OWNER_3))
                    .to.eventually.bignumber.equal(0);
            });

            it("should update owners' iterable token lists", async () => {
                // TOKEN_OWNER_1
                await expect(mintableNft.tokenOfOwnerByIndex
                    .callAsync(TOKEN_OWNER_1, new BigNumber.BigNumber(0)))
                    .to.eventually.bignumber.equal(TOKEN_ID_3);
                await expect(mintableNft.tokenOfOwnerByIndex
                    .callAsync(TOKEN_OWNER_1, new BigNumber.BigNumber(1)))
                    .to.eventually.be.rejectedWith(INVALID_OPCODE);

                // TOKEN_OWNER_2
                await expect(mintableNft.tokenOfOwnerByIndex
                    .callAsync(TOKEN_OWNER_2, new BigNumber.BigNumber(0)))
                    .to.eventually.bignumber.equal(TOKEN_ID_2);
                await expect(mintableNft.tokenOfOwnerByIndex
                    .callAsync(TOKEN_OWNER_2, new BigNumber.BigNumber(1)))
                    .to.eventually.bignumber.equal(TOKEN_ID_1);
                await expect(mintableNft.tokenOfOwnerByIndex
                    .callAsync(TOKEN_OWNER_2, new BigNumber.BigNumber(2)))
                    .to.eventually.be.rejectedWith(INVALID_OPCODE);

                // TOKEN_OWNER_3
                await expect(mintableNft.tokenOfOwnerByIndex
                    .callAsync(TOKEN_OWNER_3, new BigNumber.BigNumber(0)))
                    .to.eventually.be.rejectedWith(INVALID_OPCODE);
            });
        });
    });

    describe("#approve()", () => {
        before(deployAndInitNft);

        describe("user approves transfer for token he doesn't own", () => {
            it("should throw", async () => {
                expect(mintableNft.approve.sendTransactionAsync(
                    TOKEN_OWNER_2, TOKEN_ID_1, { from: TOKEN_OWNER_2 }))
                    .to.eventually.be.rejectedWith(REVERT_ERROR);
            });
        });

        describe("user approves transfer for nonexistent token", () => {
            it("should throw", async () => {
                expect(mintableNft.approve.sendTransactionAsync(
                    TOKEN_OWNER_2, NONEXISTENT_TOKEN_ID, { from: TOKEN_OWNER_2 }))
                    .to.eventually.be.rejectedWith(REVERT_ERROR);
            });
        });

        describe("user approves himself for transferring token he owns", () => {
            it("should throw", async () => {
                expect(mintableNft.approve.sendTransactionAsync(
                    TOKEN_OWNER_1, TOKEN_ID_1, { from: TOKEN_OWNER_1 }))
                    .to.eventually.be.rejectedWith(REVERT_ERROR);
            });
        });

        describe("user owns token", () => {
            describe("user clears unset approval", () => {
                let res: Web3.TransactionReceipt;

                before(async () => {
                    const txHash = await mintableNft.approve.sendTransactionAsync(
                        NULL_ADDRESS, TOKEN_ID_1, { from: TOKEN_OWNER_1 });
                    res = await web3.eth.getTransactionReceipt(txHash);
                });

                it("should NOT emit approval event", async () => {
                    expect(res.logs.length).to.equal(0);
                });

                it("should maintain cleared approval", async () => {
                    await expect(mintableNft.getApproved.callAsync(TOKEN_ID_1))
                        .to.eventually.equal(NULL_ADDRESS);
                });
            });

            describe("user sets new approval", () => {
                let res: Web3.TransactionReceipt;

                before(async () => {
                    const txHash = await mintableNft.approve.sendTransactionAsync(TOKEN_OWNER_2, TOKEN_ID_1,
                        { from: TOKEN_OWNER_1 });

                    res = await web3.eth.getTransactionReceipt(txHash);
                });

                it("should return newly approved user as approved", async () => {
                    await expect(mintableNft.getApproved.callAsync(TOKEN_ID_1))
                        .to.eventually.equal(TOKEN_OWNER_2);
                });

                it("should emit approval log", () => {
                    const [approvalLog] = ABIDecoder.decodeLogs(res.logs);
                    const logExpected =
                        LogApproval(mintableNft.address, TOKEN_OWNER_1, TOKEN_OWNER_2, TOKEN_ID_1);

                    expect(approvalLog).to.deep.equal(logExpected);
                })
            });

            describe("user changes token approval", () => {
                let res: Web3.TransactionReceipt;

                before(async () => {
                    const txHash = await mintableNft.approve.sendTransactionAsync(TOKEN_OWNER_3,
                        TOKEN_ID_1, { from: TOKEN_OWNER_1 });
                    res = await web3.eth.getTransactionReceipt(txHash);
                });

                it("should return newly approved user as approved", async () => {
                    await expect(mintableNft.getApproved.callAsync(TOKEN_ID_1))
                        .to.eventually.equal(TOKEN_OWNER_3);
                });

                it("should emit approval log", () => {
                    const [approvalLog] = ABIDecoder.decodeLogs(res.logs);
                    const logExpected =
                        LogApproval(mintableNft.address, TOKEN_OWNER_1, TOKEN_OWNER_3, TOKEN_ID_1);

                    expect(approvalLog).to.deep.equal(logExpected);
                })
            });

            describe("user reaffirms approval", () => {
                let res: Web3.TransactionReceipt;

                before(async () => {
                    const txHash = await mintableNft.approve.sendTransactionAsync(TOKEN_OWNER_3, TOKEN_ID_1,
                        { from: TOKEN_OWNER_1 });
                    res = await web3.eth.getTransactionReceipt(txHash);
                });

                it("should return same approved user as approved", async () => {
                    await expect(mintableNft.getApproved.callAsync(TOKEN_ID_1))
                        .to.eventually.equal(TOKEN_OWNER_3);
                });

                it("should emit approval log", () => {
                    const [approvalLog] = ABIDecoder.decodeLogs(res.logs);
                    const logExpected =
                        LogApproval(mintableNft.address, TOKEN_OWNER_1, TOKEN_OWNER_3, TOKEN_ID_1);

                    expect(approvalLog).to.deep.equal(logExpected);
                })
            });

            describe("user clears set approval", () => {
                let res: Web3.TransactionReceipt;

                before(async () => {
                    const txHash = await mintableNft.approve.sendTransactionAsync(NULL_ADDRESS, TOKEN_ID_1,
                        { from: TOKEN_OWNER_1 });
                    res = await web3.eth.getTransactionReceipt(txHash);
                });

                it("should return newly approved user as approved", async () => {
                    await expect(mintableNft.getApproved.callAsync(TOKEN_ID_1))
                        .to.eventually.equal(NULL_ADDRESS);
                });

                it("should emit approval log", () => {
                    const [approvalLog] = ABIDecoder.decodeLogs(res.logs);
                    const logExpected =
                        LogApproval(mintableNft.address, TOKEN_OWNER_1, NULL_ADDRESS, TOKEN_ID_1);

                    expect(approvalLog).to.deep.equal(logExpected);
                })
            });
        });
    });

    describe("#transferFrom()", () => {
        before(deployAndInitNft);

        describe("user transfers token from owner w/o approval...", () => {
            it("should throw", async () => {
                await expect(mintableNft.transferFrom.sendTransactionAsync(TOKEN_OWNER_2, TOKEN_OWNER_3,
                    TOKEN_ID_1, { from: TOKEN_OWNER_3 }))
                    .to.eventually.be.rejectedWith(REVERT_ERROR);
            });
        });

        describe("user transfers non-existent token", () => {
            it("should throw", async () => {
                await expect(mintableNft.transferFrom.sendTransactionAsync(TOKEN_OWNER_2, TOKEN_OWNER_3,
                    NONEXISTENT_TOKEN_ID, { from: TOKEN_OWNER_3 }))
                    .to.eventually.be.rejectedWith(REVERT_ERROR);
            });
        });

        describe("user transfers token from owner w/ approval...", () => {
            before(async () => {
                await mintableNft.approve.sendTransactionAsync(TOKEN_OWNER_2, TOKEN_ID_1,
                    { from: TOKEN_OWNER_1 });
            });

            describe("...from himself to himself", () => {
                it("should throw", async () => {
                    await expect(mintableNft.transferFrom.sendTransactionAsync(TOKEN_OWNER_2, TOKEN_OWNER_2,
                        TOKEN_ID_2, { from: TOKEN_OWNER_2 }))
                        .to.eventually.be.rejectedWith(REVERT_ERROR);
                });
            });

            describe("...to null address", () => {
                it("should throw", async () => {
                    await expect(mintableNft.transferFrom.sendTransactionAsync(TOKEN_OWNER_1, NULL_ADDRESS,
                        TOKEN_ID_1, { from: TOKEN_OWNER_2 }))
                        .to.eventually.be.rejectedWith(REVERT_ERROR);
                });
            });

            describe("...from other owner to himself", () => {
                let res: Web3.TransactionReceipt;
                let approvalLog: ABIDecoder.DecodedLog;
                let transferLog: ABIDecoder.DecodedLog;

                before(async () => {
                    const txHash = await mintableNft.transferFrom.sendTransactionAsync(TOKEN_OWNER_1, TOKEN_OWNER_3,
                        TOKEN_ID_1, { from: TOKEN_OWNER_2 });
                    res = await web3.eth.getTransactionReceipt(txHash);

                    [approvalLog, transferLog] = ABIDecoder.decodeLogs(res.logs);
                });

                it("should emit approval clear log", () => {
                    const logExpected =
                        LogApproval(mintableNft.address, TOKEN_OWNER_1, NULL_ADDRESS, TOKEN_ID_1);

                    expect(approvalLog).to.deep.equal(logExpected);
                });

                it("should emit transfer log", () => {
                    const logExpected =
                        LogTransfer(mintableNft.address, TOKEN_OWNER_1, TOKEN_OWNER_3, TOKEN_ID_1);

                    expect(transferLog).to.deep.equal(logExpected);
                });

                it("should belong to new owner", async () => {
                    await expect(mintableNft.ownerOf.callAsync(TOKEN_ID_1))
                        .to.eventually.equal(TOKEN_OWNER_3);
                });

                it("should update owners' token balances correctly", async () => {
                    await expect(mintableNft.balanceOf.callAsync(TOKEN_OWNER_1))
                        .to.eventually.bignumber.equal(0);
                    await expect(mintableNft.balanceOf.callAsync(TOKEN_OWNER_2))
                        .to.eventually.bignumber.equal(1);
                    await expect(mintableNft.balanceOf.callAsync(TOKEN_OWNER_3))
                        .to.eventually.bignumber.equal(2);
                });

                it("should update owners' iterable token lists", async () => {
                    // TOKEN_OWNER_1
                    await expect(mintableNft.tokenOfOwnerByIndex.callAsync(TOKEN_OWNER_1, new BigNumber.BigNumber(0)))
                        .to.eventually.be.rejectedWith(INVALID_OPCODE);

                    // TOKEN_OWNER_2
                    await expect(mintableNft.tokenOfOwnerByIndex.callAsync(TOKEN_OWNER_2, new BigNumber.BigNumber(0)))
                        .to.eventually.bignumber.equal(TOKEN_ID_2);
                    await expect(mintableNft.tokenOfOwnerByIndex.callAsync(TOKEN_OWNER_2, new BigNumber.BigNumber(1)))
                        .to.eventually.be.rejectedWith(INVALID_OPCODE);

                    // TOKEN_OWNER_3
                    await expect(mintableNft.tokenOfOwnerByIndex.callAsync(TOKEN_OWNER_3, new BigNumber.BigNumber(0)))
                        .to.eventually.bignumber.equal(TOKEN_ID_3);
                    await expect(mintableNft.tokenOfOwnerByIndex.callAsync(TOKEN_OWNER_3, new BigNumber.BigNumber(1)))
                        .to.eventually.bignumber.equal(TOKEN_ID_1);
                    await expect(mintableNft.tokenOfOwnerByIndex.callAsync(TOKEN_OWNER_3, new BigNumber.BigNumber(2)))
                        .to.eventually.be.rejectedWith(INVALID_OPCODE);
                });
            });
        });
    });

    // TODO: Add tests for getOwnerTokens
});
