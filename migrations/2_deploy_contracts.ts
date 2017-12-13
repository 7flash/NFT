const NFT = artifacts.require("NonFungibleToken");
const MintableNFT = artifacts.require("MintableNonFungibleToken");

module.exports = (deployer: any) => {
    deployer.deploy(NFT);
    deployer.deploy(MintableNFT);
};
