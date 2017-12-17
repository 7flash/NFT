pragma solidity 0.4.18;

import "./DetailedERC721.sol";
import "../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";


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
contract NonFungibleToken is DetailedERC721 {
    using SafeMath for uint;

    string public name;
    string public symbol;

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

    function name()
        public
        returns (string _name)
    {
        return name;
    }

    function symbol()
        public
        returns (string _symbol)
    {
        return symbol;
    }

    function totalSupply()
        public
        returns (uint256 _totalSupply)
    {
        return numTokensTotal;
    }

    function balanceOf(address _owner)
        public
        returns (uint _balance)
    {
        return ownerToTokensOwned[_owner].length;
    }

    function ownerOf(uint _tokenId)
        public
        returns (address _owner)
    {
        return tokenIdToOwner[_tokenId];
    }

    function tokenMetadata(uint _tokenId)
        public
        returns (string _infoUrl)
    {
        return tokenIdToMetadata[_tokenId];
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
        returns (uint _tokenId)
    {
        return ownerToTokensOwned[_owner][_index];
    }

    function getOwnerTokens(address _owner)
        public
        returns (uint[] _tokenIds)
    {
        return ownerToTokensOwned[_owner];
    }

    function implementsERC721()
        public
        returns (bool _implementsERC721)
    {
        return true;
    }

    function getApproved(uint _tokenId)
        public
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
