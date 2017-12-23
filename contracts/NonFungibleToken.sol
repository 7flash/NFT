pragma solidity 0.4.18;

import "./DetailedERC721.sol";


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
    string public name;
    string public symbol;

    uint public numTokensTotal;

    mapping(uint => address) internal tokenIdToOwner;
    mapping(uint => address) internal tokenIdToApprovedAddress;
    mapping(uint => string) internal tokenIdToMetadata;
    mapping(address => uint[]) internal ownerToTokensOwned;
    mapping(uint => uint) internal tokenIdToOwnerArrayIndex;

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
        require(ownerOf(_tokenId) != address(0));
        _;
    }

    function name()
        public
        view
        returns (string _name)
    {
        return name;
    }

    function symbol()
        public
        view
        returns (string _symbol)
    {
        return symbol;
    }

    function totalSupply()
        public
        view
        returns (uint256 _totalSupply)
    {
        return numTokensTotal;
    }

    function balanceOf(address _owner)
        public
        view
        returns (uint _balance)
    {
        return ownerToTokensOwned[_owner].length;
    }

    function ownerOf(uint _tokenId)
        public
        view
        returns (address _owner)
    {
        return _ownerOf(_tokenId);
    }

    function tokenMetadata(uint _tokenId)
        public
        view
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

        if (_getApproved(_tokenId) != address(0) ||
                _to != address(0)) {
            _approve(_to, _tokenId);
            Approval(msg.sender, _to, _tokenId);
        }
    }

    function transferFrom(address _from, address _to, uint _tokenId)
        public
        onlyExtantToken(_tokenId)
    {
        require(getApproved(_tokenId) == msg.sender);
        require(ownerOf(_tokenId) == _from);
        require(_to != address(0));

        _clearApprovalAndTransfer(_from, _to, _tokenId);

        Approval(_from, 0, _tokenId);
        Transfer(_from, _to, _tokenId);
    }

    function transfer(address _to, uint _tokenId)
        public
        onlyExtantToken(_tokenId)
    {
        require(ownerOf(_tokenId) == msg.sender);
        require(_to != address(0));

        _clearApprovalAndTransfer(msg.sender, _to, _tokenId);

        Approval(msg.sender, 0, _tokenId);
        Transfer(msg.sender, _to, _tokenId);
    }

    function tokenOfOwnerByIndex(address _owner, uint _index)
        public
        view
        returns (uint _tokenId)
    {
        return _getOwnerTokenByIndex(_owner, _index);
    }

    function getOwnerTokens(address _owner)
        public
        view
        returns (uint[] _tokenIds)
    {
        return _getOwnerTokens(_owner);
    }

    function implementsERC721()
        public
        view
        returns (bool _implementsERC721)
    {
        return true;
    }

    function getApproved(uint _tokenId)
        public
        view
        returns (address _approved)
    {
        return _getApproved(_tokenId);
    }

    function _clearApprovalAndTransfer(address _from, address _to, uint _tokenId)
        internal
    {
        _clearTokenApproval(_tokenId);
        _removeTokenFromOwnersList(_from, _tokenId);
        _setTokenOwner(_tokenId, _to);
        _addTokenToOwnersList(_to, _tokenId);
    }

    function _ownerOf(uint _tokenId)
        internal
        view
        returns (address _owner)
    {
        return tokenIdToOwner[_tokenId];
    }

    function _approve(address _to, uint _tokenId)
        internal
    {
        tokenIdToApprovedAddress[_tokenId] = _to;
    }

    function _getApproved(uint _tokenId)
        internal
        view
        returns (address _approved)
    {
        return tokenIdToApprovedAddress[_tokenId];
    }

    function _getOwnerTokens(address _owner)
        internal
        view
        returns (uint[] _tokens)
    {
        return ownerToTokensOwned[_owner];
    }

    function _getOwnerTokenByIndex(address _owner, uint _index)
        internal
        view
        returns (uint _tokens)
    {
        return ownerToTokensOwned[_owner][_index];
    }

    function _clearTokenApproval(uint _tokenId)
        internal
    {
        tokenIdToApprovedAddress[_tokenId] = address(0);
    }

    function _setTokenOwner(uint _tokenId, address _owner)
        internal
    {
        tokenIdToOwner[_tokenId] = _owner;
    }

    function _addTokenToOwnersList(address _owner, uint _tokenId)
        internal
    {
        ownerToTokensOwned[_owner].push(_tokenId);
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

    function _insertTokenMetadata(uint _tokenId, string _metadata)
        internal
    {
        tokenIdToMetadata[_tokenId] = _metadata;
    }
}
