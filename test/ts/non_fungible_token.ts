import * as BigNumber from "bignumber.js";
import * as chai from "chai";
import {
    Log,
    MintableNFTContractInstance,
    NFTContractInstance,
    TransactionReturnPayload,
} from "../../types/contracts";
import {chaiSetup} from "./utils/chai_setup.js";
import {INVALID_OPCODE, REVERT_ERROR} from "./utils/constants";
import {LogApproval, LogTransfer} from "./utils/logs";

chaiSetup.configure();
const expect = chai.expect;

const nftContract = artifacts.require("NonFungibleToken");
const mintableNftContract = artifacts.require("MintableNonFungibleToken");

contract("Non-Fungible Token", (ACCOUNTS) => {
    let nft: NFTContractInstance;
    let mintableNft: MintableNFTContractInstance;

    const CONTRACT_OWNER = ACCOUNTS[0];
    const TOKEN_OWNER_1 = ACCOUNTS[1];
    const TOKEN_OWNER_2 = ACCOUNTS[2];
    const TOKEN_OWNER_3 = ACCOUNTS[3];

    const TOKEN_ID_1 = 0;
    const TOKEN_ID_2 = (new BigNumber.BigNumber(2)).pow(64); // 2 ** 64
    const TOKEN_ID_3 = (new BigNumber.BigNumber(2)).pow(128); // 2 ** 128
    const NONEXISTENT_TOKEN_ID = 13;

    const METADATA_STRING_1 = "ipfs://QmZU8bKEG8fhcQwKoLHfjtJoKBzvUT5LFR3f8dEz86WdVe";
    const METADATA_STRING_2 = "https://www.example.com";
    const METADATA_STRING_3 = "unstructured arbitrary metadata string";

    before(async () => {
        nft = await nftContract.deployed();
        mintableNft = await mintableNftContract.deployed();
    });

    describe("#flags", () => {
        it("should expose implementsERC721 method", async () => {
            await expect(nft.implementsERC721()).to.eventually.equal(true);
        });
    });

    describe("#totalSupply()", async () => {
        it("should return 0 for initial supply", async () => {
            await expect(mintableNft.totalSupply()).to.eventually.bignumber.equal(0);
        });

        it("should return correct current supply after each mint", async () => {
            await mintableNft.mint(TOKEN_OWNER_1, TOKEN_ID_1, METADATA_STRING_1);
            await expect(mintableNft.totalSupply()).to.eventually.bignumber.equal(1);

            await mintableNft.mint(TOKEN_OWNER_2, TOKEN_ID_2, METADATA_STRING_2);
            await expect(mintableNft.totalSupply()).to.eventually.bignumber.equal(2);

            await mintableNft.mint(TOKEN_OWNER_3, TOKEN_ID_3, METADATA_STRING_3);
            await expect(mintableNft.totalSupply()).to.eventually.bignumber.equal(3);
        });
    });

    describe('#balanceOf()', async () => {
        it("should return 1 for each owner's balance", async () => {
            await expect(mintableNft.balanceOf(TOKEN_OWNER_1))
                .to.eventually.bignumber.equal(1);
            await expect(mintableNft.balanceOf(TOKEN_OWNER_2))
                .to.eventually.bignumber.equal(1);
            await expect(mintableNft.balanceOf(TOKEN_OWNER_3))
                .to.eventually.bignumber.equal(1);
        });
    });

    describe('#tokenOfOwnerByIndex()', async () => {
        it("should return current token at index 0 for each user", async () => {
            await expect(mintableNft.tokenOfOwnerByIndex(TOKEN_OWNER_1, 0))
                .to.eventually.bignumber.equal(TOKEN_ID_1);
            await expect(mintableNft.tokenOfOwnerByIndex(TOKEN_OWNER_2, 0))
                .to.eventually.bignumber.equal(TOKEN_ID_2);
            await expect(mintableNft.tokenOfOwnerByIndex(TOKEN_OWNER_3, 0))
                .to.eventually.bignumber.equal(TOKEN_ID_3);
        });

        it("should throw if called at index > balanceOf(owner)", async () => {
            await expect(mintableNft.tokenOfOwnerByIndex(TOKEN_OWNER_1, 1))
                .to.eventually.be.rejectedWith(INVALID_OPCODE);
            await expect(mintableNft.tokenOfOwnerByIndex(TOKEN_OWNER_2, 1))
                .to.eventually.be.rejectedWith(INVALID_OPCODE);
            await expect(mintableNft.tokenOfOwnerByIndex(TOKEN_OWNER_3, 1))
                .to.eventually.be.rejectedWith(INVALID_OPCODE);
        });
    });

    describe("#transfer()", async () => {
        describe("user transfers token he doesn't own", async () => {
            it("should throw", async () => {
                await expect(mintableNft.transfer(TOKEN_OWNER_1, TOKEN_ID_2,
                    { from: TOKEN_OWNER_1 })).to.eventually.be
                    .rejectedWith(REVERT_ERROR);
            });
        });

        describe("user transfers token that doesn't exist", async () => {
            it("should throw", async () => {
                await expect(mintableNft.transfer(TOKEN_OWNER_1, NONEXISTENT_TOKEN_ID,
                    { from: TOKEN_OWNER_1 })).to.eventually.be
                    .rejectedWith(REVERT_ERROR);
            });
        });

        describe("user transfers token he owns", async () => {
            let res: TransactionReturnPayload;

            before(async () => {
                res = await mintableNft.transfer(TOKEN_OWNER_2, TOKEN_ID_1,
                    { from: TOKEN_OWNER_1 });
            });

            it("should emit transfer log", async () => {
                const logReturned = res.logs[0] as Log;
                const logExpected =
                    LogTransfer(TOKEN_OWNER_1, TOKEN_OWNER_2, TOKEN_ID_1) as Log;

                expect(logReturned).to.solidityLogs.equal(logExpected);
            });

            it("should belong to new owner", async () => {
                await expect(mintableNft.ownerOf(TOKEN_ID_1))
                    .to.eventually.equal(TOKEN_OWNER_2);
            });

            it("should update owners' token balances correctly", async () => {
                await expect(mintableNft.balanceOf(TOKEN_OWNER_1))
                    .to.eventually.bignumber.equal(0);
                await expect(mintableNft.balanceOf(TOKEN_OWNER_2))
                    .to.eventually.bignumber.equal(2);
                await expect(mintableNft.balanceOf(TOKEN_OWNER_3))
                    .to.eventually.bignumber.equal(1);
            });

            it("should update owners' iterable token lists", async () => {
                // TOKEN_OWNER_1
                await expect(mintableNft.tokenOfOwnerByIndex(TOKEN_OWNER_1, 0))
                    .to.eventually.be.rejectedWith(INVALID_OPCODE);

                // TOKEN_OWNER_2
                await expect(mintableNft.tokenOfOwnerByIndex(TOKEN_OWNER_2, 0))
                    .to.eventually.bignumber.equal(TOKEN_ID_2);
                await expect(mintableNft.tokenOfOwnerByIndex(TOKEN_OWNER_2, 1))
                    .to.eventually.bignumber.equal(TOKEN_ID_1);
                await expect(mintableNft.tokenOfOwnerByIndex(TOKEN_OWNER_2, 2))
                    .to.eventually.be.rejectedWith(INVALID_OPCODE);

                // TOKEN_OWNER_3
                await expect(mintableNft.tokenOfOwnerByIndex(TOKEN_OWNER_3, 0))
                    .to.eventually.bignumber.equal(TOKEN_ID_3);
                await expect(mintableNft.tokenOfOwnerByIndex(TOKEN_OWNER_3, 1))
                    .to.eventually.be.rejectedWith(INVALID_OPCODE);
            });
        });

        describe("user transfers token he no longer owns", async () => {
            it("should throw", async () => {
                await expect(mintableNft.transfer(TOKEN_OWNER_2, TOKEN_ID_1,
                    { from: TOKEN_OWNER_1 })).to.eventually.be
                    .rejectedWith(REVERT_ERROR);
            });
        });

        describe("user transfers token he owns to 0", async () => {
            it("should throw", async () => {
                await expect(mintableNft.transfer("0x0", TOKEN_ID_1,
                    { from: TOKEN_OWNER_1 })).to.eventually.be
                    .rejectedWith(REVERT_ERROR);
            });
        });

        describe("user transfers token he owns to himself", async () => {
            let res: TransactionReturnPayload;

            before(async () => {
                res = await mintableNft.transfer(TOKEN_OWNER_2, TOKEN_ID_1,
                    { from: TOKEN_OWNER_2 });
            });

            it("should emit transfer log", async () => {
                const logReturned = res.logs[0] as Log;
                const logExpected =
                    LogTransfer(TOKEN_OWNER_2, TOKEN_OWNER_2, TOKEN_ID_1) as Log;

                expect(logReturned).to.solidityLogs.deep.equal(logExpected);
            });

            it("should belong to same owner", async () => {
                await expect(mintableNft.ownerOf(TOKEN_ID_1))
                    .to.eventually.equal(TOKEN_OWNER_2);
            });

            it("should maintain owners' token balances correctly", async () => {
                await expect(mintableNft.balanceOf(TOKEN_OWNER_1))
                    .to.eventually.bignumber.equal(0);
                await expect(mintableNft.balanceOf(TOKEN_OWNER_2))
                    .to.eventually.bignumber.equal(2);
                await expect(mintableNft.balanceOf(TOKEN_OWNER_3))
                    .to.eventually.bignumber.equal(1);
            });

            it("should not modify owners' iterable token lists", async () => {
                // TOKEN_OWNER_1
                await expect(mintableNft.tokenOfOwnerByIndex(TOKEN_OWNER_1, 0))
                    .to.eventually.be.rejectedWith(INVALID_OPCODE);

                // TOKEN_OWNER_2
                await expect(mintableNft.tokenOfOwnerByIndex(TOKEN_OWNER_2, 0))
                    .to.eventually.bignumber.equal(TOKEN_ID_2);
                await expect(mintableNft.tokenOfOwnerByIndex(TOKEN_OWNER_2, 1))
                    .to.eventually.bignumber.equal(TOKEN_ID_1);
                await expect(mintableNft.tokenOfOwnerByIndex(TOKEN_OWNER_2, 2))
                    .to.eventually.be.rejectedWith(INVALID_OPCODE);

                // TOKEN_OWNER_3
                await expect(mintableNft.tokenOfOwnerByIndex(TOKEN_OWNER_3, 0))
                    .to.eventually.bignumber.equal(TOKEN_ID_3);
                await expect(mintableNft.tokenOfOwnerByIndex(TOKEN_OWNER_3, 1))
                    .to.eventually.be.rejectedWith(INVALID_OPCODE);
            });
        });


        describe("user transfers token with outstanding approval", async () => {
            let res: TransactionReturnPayload;

            before(async () => {
                await mintableNft.approve(TOKEN_OWNER_1, TOKEN_ID_3,
                    { from: TOKEN_OWNER_3 });
                res = await mintableNft.transfer(TOKEN_OWNER_1, TOKEN_ID_3,
                    { from: TOKEN_OWNER_3 });
                console.log(res.receipt.gasUsed);
            });

            it("should emit approval clear log", () => {
                const logReturned = res.logs[0] as Log;
                const logExpected =
                    LogApproval(TOKEN_OWNER_1, "0x0", TOKEN_ID_3) as Log;

                expect(logReturned).to.solidityLogs.deep.equal(logExpected);
            });

            it("should emit transfer log", () => {
                const logReturned = res.logs[1] as Log;
                const logExpected =
                    LogTransfer(TOKEN_OWNER_3, TOKEN_OWNER_1, TOKEN_ID_3) as Log;

                expect(logReturned).to.solidityLogs.deep.equal(logExpected);
            });

            it("should belong to new owner", async () => {
                await expect(mintableNft.ownerOf(TOKEN_ID_3))
                    .to.eventually.equal(TOKEN_OWNER_1);
            });

            it("should update owners' token balances correctly", async () => {
                await expect(mintableNft.balanceOf(TOKEN_OWNER_1))
                    .to.eventually.bignumber.equal(1);
                await expect(mintableNft.balanceOf(TOKEN_OWNER_2))
                    .to.eventually.bignumber.equal(2);
                await expect(mintableNft.balanceOf(TOKEN_OWNER_3))
                    .to.eventually.bignumber.equal(0);
            });

            it("should update owners' iterable token lists", async () => {
                // TOKEN_OWNER_1
                await expect(mintableNft.tokenOfOwnerByIndex(TOKEN_OWNER_1, 0))
                    .to.eventually.bignumber.equal(TOKEN_ID_3);
                await expect(mintableNft.tokenOfOwnerByIndex(TOKEN_OWNER_1, 1))
                    .to.eventually.be.rejectedWith(INVALID_OPCODE);

                // TOKEN_OWNER_2
                await expect(mintableNft.tokenOfOwnerByIndex(TOKEN_OWNER_2, 0))
                    .to.eventually.bignumber.equal(TOKEN_ID_2);
                await expect(mintableNft.tokenOfOwnerByIndex(TOKEN_OWNER_2, 1))
                    .to.eventually.bignumber.equal(TOKEN_ID_1);
                await expect(mintableNft.tokenOfOwnerByIndex(TOKEN_OWNER_2, 2))
                    .to.eventually.be.rejectedWith(INVALID_OPCODE);

                // TOKEN_OWNER_3
                await expect(mintableNft.tokenOfOwnerByIndex(TOKEN_OWNER_3, 0))
                    .to.eventually.be.rejectedWith(INVALID_OPCODE);
            });
        });
    });

    describe("#approve()", async () => {
        describe("user approves transfer for token he doesn't own", async () => {

        });
        describe("user approves transfer for token that doesn't exist");
        describe("user approves himself for transferring a token he owns");
        describe("user owns token", async () => {
            describe("user clears unset approval");
            describe("user sets new approval");
            describe("user reaffirms approval");
            describe("user clears set approval");
        });
    });

    describe("#transferFrom()", async () => {
        describe("user transfers token from owner w/o permission...", async () => {
            it("should throw", async () => {
                await expect(mintableNft.transferFrom(TOKEN_OWNER_2, TOKEN_OWNER_3,
                    TOKEN_ID_1, { from: TOKEN_OWNER_3 }))
                    .to.eventually.be.rejectedWith(REVERT_ERROR);
            });
        });

        describe("user transfers non-existent token", async () => {
            it("should throw", async () => {
                await expect(mintableNft.transferFrom(TOKEN_OWNER_2, TOKEN_OWNER_3,
                    NONEXISTENT_TOKEN_ID, { from: TOKEN_OWNER_3 }))
                    .to.eventually.be.rejectedWith(REVERT_ERROR);
            });
        });

        describe("user transfers token from owner w/ permission...", async () => {

        });
    })
});
