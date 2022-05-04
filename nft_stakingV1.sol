// SPDX-License-Identifier: MIT
 pragma solidity ^0.8.0;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC721Receiver.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";







abstract contract ReentrancyGuard {

    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

contract NFTSTAKE is IERC721Receiver, ReentrancyGuard, Pausable, AccessControl 
{

    bytes32 public constant WHITELIST_ROLE = keccak256("WHITELIST_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

   
    ERC721 public nftToken;
    IERC20 public erc20Token;

    uint256 public tokensPerBlock;

    struct stake 
    {
        uint256 tokenId;
        uint256 stakedFromBlock;
        address owner;
    }

    // TokenID => Stake
    mapping(uint256 => stake) public receipt;

    //Wallet => tokenIDs[]
    mapping(address => uint256[]) public balanceOfToken;

    function retrieveTokensIdsOfWallet(address wallet) public view returns(uint256[] memory)
    {
        return balanceOfToken[wallet];
    }
    

    event NftStaked(address indexed staker, uint256 tokenId, uint256 blockNumber);
    event NftUnStaked(address indexed staker, uint256 tokenId, uint256 blockNumber);
    event StakePayout(address indexed staker, uint256 tokenId, uint256 stakeAmount, uint256 fromBlock, uint256 toBlock);
    event StakeRewardUpdated(uint256 rewardPerBlock);

    modifier onlyStaker(uint256 tokenId) 
    {
        require(nftToken.ownerOf(tokenId) == address(this), "onlyStaker: Contract is not owner of this NFT");
        require(receipt[tokenId].stakedFromBlock != 0, "onlyStaker: Token is not staked");
        require(receipt[tokenId].owner == msg.sender, "onlyStaker: Caller is not NFT stake owner");

        _;
    }

    modifier requireTimeElapsed(uint256 tokenId) 
    {
        require(
            receipt[tokenId].stakedFromBlock < block.number,
            "requireTimeElapsed: Can not stake/unStake/harvest in same block"
        );
        _;
    }

    constructor(
        ERC721 _nftToken,
        IERC20 _erc20Token,
        uint256 _tokensPerBlock
    ) 
    {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PAUSER_ROLE, msg.sender);
        nftToken = _nftToken;
        erc20Token = _erc20Token;
        tokensPerBlock = _tokensPerBlock;

        emit StakeRewardUpdated(tokensPerBlock);
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) 
    public virtual override returns (bytes4) 
    {
        return this.onERC721Received.selector;
    }

    function addToWhitelist(address _to) public onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _grantRole(WHITELIST_ROLE, _to);
    }

    function removeFromWhitelist(address _to) public onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _revokeRole(WHITELIST_ROLE, _to);
    }

    function addAddressesToWhitelist(address[] calldata _addresses) public onlyRole(DEFAULT_ADMIN_ROLE)
    {
        for (uint256 i = 0; i < _addresses.length; i++) 
        {
            _grantRole(WHITELIST_ROLE, _addresses[i]);
        }
    }
    function removeAddressesFromWhitelist(address[] calldata _addresses) public onlyRole(DEFAULT_ADMIN_ROLE)
    {
        for (uint256 i = 0; i < _addresses.length; i++) 
        {
            _revokeRole(WHITELIST_ROLE, _addresses[i]);
        }
    }

    function stakeNFT(uint256  tokenId) public whenNotPaused nonReentrant returns (bool) 
    {
        _stakeNFT(tokenId);
        
        return true;
    }
  
    function stakeNFTS(uint256[] calldata tokenId) public whenNotPaused nonReentrant returns (bool) 
    {
        for (uint256 i = 0; i < tokenId.length; i++) 
        {
            _stakeNFT(tokenId[i]);
        }
        return true;
    }

    function getStakeContractBalance() public view returns (uint256) 
    {
        return erc20Token.balanceOf(address(this));
    }

    function getCurrentStakeEarned(uint256 tokenId) public view returns (uint256) 
    {
        return _getTimeStaked(tokenId)*(tokensPerBlock);
    }

    function unStakeNFT(uint256 tokenId) public whenNotPaused nonReentrant returns (bool) 
    {
        return _unStakeNFT(tokenId);
    }

    function unStakeNFTS(uint256[] calldata tokenId) public whenNotPaused nonReentrant returns (bool) 
    {
        for (uint256 i = 0; i < tokenId.length; i++) 
        {
            _unStakeNFT(tokenId[i]);
        }
        return true;
    }

    function _unStakeNFT(uint256 tokenId) internal onlyStaker(tokenId) requireTimeElapsed(tokenId) returns (bool) 
    {
        _payoutStake(tokenId);
        delete receipt[tokenId];
        delete balanceOfToken[msg.sender][tokenId];
        nftToken.safeTransferFrom(address(this), msg.sender, tokenId);
        emit NftUnStaked(msg.sender, tokenId, block.number);
        return true;
    }

    function harvest(uint256 tokenId) public nonReentrant onlyStaker(tokenId) requireTimeElapsed(tokenId) 
    {
        _payoutStake(tokenId);
        receipt[tokenId].stakedFromBlock = block.number;
    }

    function changeTokensPerblock(uint256 _tokensPerBlock) public onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(_tokensPerBlock > 0, "changeTokensPerblock: tokensPerBlock must be greater than 0");
        tokensPerBlock = _tokensPerBlock;
        emit StakeRewardUpdated(tokensPerBlock);
    }

    function reclaimTokens() external onlyRole(DEFAULT_ADMIN_ROLE)
    {
        erc20Token.transferFrom(address(this), msg.sender, erc20Token.balanceOf(address(this)));
    }
	
	function depoTokens(uint256 value) external onlyRole(DEFAULT_ADMIN_ROLE) 
    {
	    erc20Token.transferFrom(msg.sender, address(this), value);
	}

    function updateStakingReward(uint256 _tokensPerBlock) external onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(_tokensPerBlock > 0, "updateStakingReward: tokensPerBlock must be greater than 0");
        tokensPerBlock = _tokensPerBlock;
        emit StakeRewardUpdated(tokensPerBlock);
    }  
   
    function _stakeNFT(uint256 tokenId) internal returns (bool) 
    {
        
        require(receipt[tokenId].stakedFromBlock == 0, "Stake: Token is already staked");
        require(nftToken.ownerOf(tokenId) != address(this), "Stake: Token is already staked in this contract");
        nftToken.safeTransferFrom(msg.sender, address(this), tokenId);
        require(nftToken.ownerOf(tokenId) == address(this), "Stake: Failed to take possession of NFT");

        receipt[tokenId].tokenId = tokenId;
        receipt[tokenId].stakedFromBlock = block.number;
        receipt[tokenId].owner = msg.sender;
        balanceOfToken[msg.sender].push(tokenId);
        emit NftStaked(msg.sender, tokenId, block.number);
        return true;
    }

    function _payoutStake(uint256 tokenId) internal 
    {
        require(receipt[tokenId].stakedFromBlock > 0, "_payoutStake: Can not stake from block 0");
        uint256 timeStaked = _getTimeStaked(tokenId)-(1);
        uint256 payout = timeStaked*(tokensPerBlock);
        if (erc20Token.balanceOf(address(this)) < payout) 
        {
            emit StakePayout(msg.sender, tokenId, 0, receipt[tokenId].stakedFromBlock, block.number);
            return;
        }
        erc20Token.transfer(receipt[tokenId].owner, payout);
        emit StakePayout(msg.sender, tokenId, payout, receipt[tokenId].stakedFromBlock, block.number);
    }

    function _getTimeStaked(uint256 tokenId) internal view returns (uint256) 
    {
        if (receipt[tokenId].stakedFromBlock == 0) 
        {
            return 0;
        }

        return block.number-(receipt[tokenId].stakedFromBlock);
    }

    function _adminSupport(uint256 tokenId) public onlyRole(DEFAULT_ADMIN_ROLE) returns (bool) 
    {
        _payoutStake(tokenId);
        delete receipt[tokenId];
        delete balanceOfToken[msg.sender][tokenId];
        nftToken.safeTransferFrom(address(this), msg.sender, tokenId);
        emit NftUnStaked(msg.sender, tokenId, block.number);
        return true;
    }
    
	function setNFT(ERC721 value) public onlyRole(DEFAULT_ADMIN_ROLE) 
    {
	    nftToken = value;
	}
	function setToken(IERC20 value) public onlyRole(DEFAULT_ADMIN_ROLE) 
    {
	    erc20Token = value;
	}

    function pause() public onlyRole(PAUSER_ROLE) 
    {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE)  
    {
        _unpause();
    }
}