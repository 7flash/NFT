pragma solidity 0.4.18;

import "../MintableNonFungibleToken.sol";


/**
 * @title TestMintableNFT
 *
 * Test wrapper for MintableNonFungibleToken with a constructor that
 * lets users specify the name and symbol of the token.
 */
contract TestMintableNFT is MintableNonFungibleToken {
    function TestMintableNFT(string _name, string _symbol)
        public
    {
        name = _name;
        symbol = _symbol;
    }
}
