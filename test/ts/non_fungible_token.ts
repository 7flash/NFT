import * as BigNumber from "bignumber.js";
import * as chai from "chai";
import {NFTContractInstance} from "../../types/contracts";
import {chaiSetup} from "./utils/chai_setup.js";

chaiSetup.configure();
const expect = chai.expect;

const nftContract = artifacts.require("NFT");

contract("Non-Fungible Token", (accounts) => {
    let nft: NFTContractInstance;

    before(async () => {
        nft = await nftContract.deployed();
    });

    it("should pass some sort of test");
});
