pragma solidity 0.4.18;

import "../NonFungibleToken.sol";
import "node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";


/**
 * @title TestNonFungibleToken
 *
 * Test wrapper for NonFungibleToken that gives the contract's owner the ability
 * to mint NFTs.
 */
contract MintableNonFungibleToken is NonFungibleToken, Ownable {
    using SafeMath for uint;

    modifier onlyNonexistentToken(uint _tokenId) {
        require(tokenIdToOwner[_tokenId] == address(0));
        _;
    }

    function MintableNonFungibleToken(string _name, string _symbol)
        public
    {
        name = _name;
        symbol = _symbol;
    }

    function mint(address _owner, uint256 _tokenId, string _metadata)
        public
        onlyOwner
        onlyNonexistentToken(_tokenId)
    {
        _addTokenToOwnersList(_owner, _tokenId);

        numTokensTotal = numTokensTotal.add(1);
        tokenIdToMetadata[_tokenId] = _metadata;
    }
}
