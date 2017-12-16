pragma solidity 0.4.18;

import "./ERC721.sol";
import "node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";


/**
 * @title NonFungibleToken
 *
 * Generic implementation for both required and optional functionality in
 * the ERC721 standard for non-fungible tokens.
 *
 * Heavily inspired by Decentraland's generic implementation:
 * https://github.com/decentraland/land/blob/master/contracts/BasicNFT.sol
 *
 * Standard Author: dete
 * Implementation Author: Nadav Hollander <nadav at dharma.io>
 */
contract NonFungibleToken is ERC721 {
    using SafeMath for uint;

    uint public numTokensTotal;

    mapping(uint => address) public tokenIdToOwner;
    mapping(uint => address) public tokenIdToApprovedAddress;
    mapping(uint => string) public tokenIdToMetadata;
    mapping(address => uint[]) public ownerToTokensOwned;
    mapping(uint => uint) public tokenIdToOwnerArrayIndex;

    event Transfer(
        address indexed _from,
        address indexed _to,
        uint256 _tokenId
    );

    event Approval(
        address indexed _owner,
        address indexed _approved,
        uint256 _tokenId
    );

    modifier onlyExtantToken(uint _tokenId) {
        require(tokenIdToOwner[_tokenId] != address(0));
        _;
    }

    function totalSupply()
        public
        constant
        returns (uint256 _totalSupply)
    {
        return numTokensTotal;
    }

    function balanceOf(address _owner)
        public
        constant
        returns (uint _balance)
    {
        return ownerToTokensOwned[_owner].length;
    }

    function ownerOf(uint _tokenId)
        public
        constant
        returns (address _owner)
    {
        return tokenIdToOwner[_tokenId];
    }

    function approve(address _to, uint _tokenId)
        public
        onlyExtantToken(_tokenId)
    {
        require(msg.sender == ownerOf(_tokenId));
        require(msg.sender != _to);

        if (tokenIdToApprovedAddress[_tokenId] != address(0) ||
                _to != address(0)) {
            tokenIdToApprovedAddress[_tokenId] = _to;
            Approval(msg.sender, _to, _tokenId);
        }
    }

    function transferFrom(address _from, address _to, uint _tokenId)
        public
        onlyExtantToken(_tokenId)
    {
        require(tokenIdToApprovedAddress[_tokenId] == msg.sender);
        require(tokenIdToOwner[_tokenId] == _from);

        _transfer(_from, _to, _tokenId);
    }

    function transfer(address _to, uint _tokenId)
        public
        onlyExtantToken(_tokenId)
    {
        require(tokenIdToOwner[_tokenId] == msg.sender);

        _transfer(msg.sender, _to, _tokenId);
    }

    function tokenOfOwnerByIndex(address _owner, uint _index)
        public
        constant
        returns (uint _tokenId)
    {
        return ownerToTokensOwned[_owner][_index];
    }

    function implementsERC721()
        public
        constant
        returns (bool _implementsERC721)
    {
        return true;
    }

    function getApproved(uint _tokenId)
        public
        constant
        returns (address _approved)
    {
        return tokenIdToApprovedAddress[_tokenId];
    }

    function _transfer(address _from, address _to, uint _tokenId)
        internal
    {
        require(_to != address(0));
        
        _clearTokenApproval(_tokenId);
        _removeTokenFromOwnersList(_from, _tokenId);
        _addTokenToOwnersList(_to, _tokenId);
        Transfer(msg.sender, _to, _tokenId);
    }

    function _clearTokenApproval(uint _tokenId)
        internal
    {
        tokenIdToApprovedAddress[_tokenId] = address(0);
        Approval(tokenIdToOwner[_tokenId], 0, _tokenId);
    }

    function _addTokenToOwnersList(address _owner, uint _tokenId)
        internal
    {
        ownerToTokensOwned[_owner].push(_tokenId);
        tokenIdToOwner[_tokenId] = _owner;
        tokenIdToOwnerArrayIndex[_tokenId] =
            ownerToTokensOwned[_owner].length - 1;
    }

    function _removeTokenFromOwnersList(address _owner, uint _tokenId)
        internal
    {
        uint length = ownerToTokensOwned[_owner].length;
        uint index = tokenIdToOwnerArrayIndex[_tokenId];
        uint swapToken = ownerToTokensOwned[_owner][length - 1];

        ownerToTokensOwned[_owner][index] = swapToken;
        tokenIdToOwnerArrayIndex[swapToken] = index;

        delete ownerToTokensOwned[_owner][length - 1];
        ownerToTokensOwned[_owner].length--;
    }
}
