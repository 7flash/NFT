const NFT = artifacts.require("NFT");

module.exports = (deployer: any) => {
    deployer.deploy(NFT);
};
