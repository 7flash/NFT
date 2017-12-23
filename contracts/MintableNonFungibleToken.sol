pragma solidity 0.4.18;

import "./NonFungibleToken.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";


/**
 * @title MintableNonFungibleToken
 *
 * Superset of the ERC721 standard that allows for the minting
 * of non-fungible tokens.
 */
contract MintableNonFungibleToken is NonFungibleToken {
    using SafeMath for uint;

    event Mint(address indexed _to, uint256 indexed _tokenId);

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

        Mint(_owner, _tokenId);
    }
}
