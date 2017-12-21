pragma solidity 0.4.18;

import "./NonFungibleToken.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";


/**
 * @title TestNonFungibleToken
 *
 * Test wrapper for NonFungibleToken that gives the contract's owner the ability
 * to mint NFTs.
 */
contract MintableNonFungibleToken is NonFungibleToken {
    using SafeMath for uint;

    modifier onlyNonexistentToken(uint _tokenId) {
        require(tokenIdToOwner[_tokenId] == address(0));
        _;
    }

    function mint(address _owner, uint256 _tokenId, string _metadata)
        public
        onlyNonexistentToken(_tokenId)
    {
        _setTokenOwner(_tokenId, _owner);
        _addTokenToOwnersList(_owner, _tokenId);
        _insertTokenMetadata(_tokenId, _metadata);

        numTokensTotal = numTokensTotal.add(1);
    }
}
