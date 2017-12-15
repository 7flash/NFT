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
    mapping(address => uint) public ownerToNumTokensOwned;
    mapping(uint => address) public tokenIdToApprovedAddress;
    mapping(uint => string) public tokenIdToMetadata;

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
        return ownerToNumTokensOwned[_owner];
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


    }

    function transfer(address _to, uint256 _tokenId)
        public
        onlyExtantToken(_tokenId)
    {
        require(tokenIdToOwner[_tokenId] == msg.sender);
        require(_to != address(0));

        tokenIdToOwner[_tokenId] = _to;

        // Update owner token balances
        ownerToNumTokensOwned[msg.sender] =
            ownerToNumTokensOwned[msg.sender].sub(1);
        ownerToNumTokensOwned[_to] =
            ownerToNumTokensOwned[_to].add(1);

        Transfer(msg.sender, _to, _tokenId);

        // If necessary, we clear any outstanding approvals on the
        // non-fungible token upon transfer.
        if (tokenIdToApprovedAddress[_tokenId] != address(0)) {
            tokenIdToApprovedAddress[_tokenId] = address(0);
            Approval(msg.sender, address(0), _tokenId);
        }
    }

    function implementsERC721()
        public
        constant
        returns(bool _implementsERC721)
    {
        return true;
    }
}
