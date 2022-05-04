// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC721Receiver.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract PotluckNFTStaking is
    IERC721Receiver,
    ReentrancyGuard,
    Pausable,
    AccessControl
{
    using SafeMath for uint256;

    bytes32 public constant WHITELIST_ROLE = keccak256("WHITELIST_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    ERC721 public nftToken;
    IERC20 public erc20Token;

    uint256 public tokensPerBlock;

    uint256 public totalStaked;

    // Accrued token per share
    uint256 public accTokenPerShare;

    uint256 public rewardsEndBlock;
    uint256 public lastRewardBlock;

    struct stake {
        uint256 tokenId;
        uint256 stakedFromBlock;
        uint256 rewardPenalty;
        address owner;
    }

    // TokenID => Stake
    mapping(uint256 => stake) public receipt;
    //Wallet => tokenIDs[]
    mapping(address => uint256[]) public balanceOfToken;
    // Tokenid => index in balanceOfToken mapping array
    mapping(uint256 => uint256) private indexOfTokenInBalanceOfToken;

    event NftStaked(
        address indexed staker,
        uint256 tokenId,
        uint256 blockNumber
    );
    event NftUnStaked(
        address indexed staker,
        uint256 tokenId,
        uint256 blockNumber
    );
    event StakePayout(
        address indexed staker,
        uint256 tokenId,
        uint256 stakeAmount,
        uint256 fromBlock,
        uint256 toBlock
    );
    event StakeRewardUpdated(uint256 rewardPerBlock);
    event RewardsEndBlockUpdated(uint256 lastRewardBlock);

    modifier onlyStaker(uint256 tokenId) {
        require(
            nftToken.ownerOf(tokenId) == address(this),
            "onlyStaker: Contract is f of this NFT"
        );
        require(
            receipt[tokenId].stakedFromBlock != 0,
            "onlyStaker: Token is not staked"
        );
        require(
            receipt[tokenId].owner == msg.sender,
            "onlyStaker: Caller is not NFT stake owner"
        );
        _;
    }

    modifier onlyStakerOfAll(uint256[] calldata tokenIds) {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(
                nftToken.ownerOf(tokenId) == address(this),
                "onlyStaker: Contract is not owner of this NFT"
            );
            require(
                receipt[tokenId].stakedFromBlock != 0,
                "onlyStaker: Token is not staked"
            );
            require(
                receipt[tokenId].owner == msg.sender,
                "onlyStaker: Caller is not NFT stake owner"
            );
        }
        _;
    }

    modifier requireTimeElapsed(uint256 tokenId) {
        require(
            receipt[tokenId].stakedFromBlock < block.number,
            "requireTimeElapsed: Can not stake/unStake/harvest in same block"
        );
        _;
    }

    modifier requireTimeElapsedOnAll(uint256[] calldata tokenIds) {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(
                receipt[tokenIds[i]].stakedFromBlock < block.number,
                "requireTimeElapsed: Can not stake/unStake/harvest in same block"
            );
        }
        _;
    }

    constructor(
        ERC721 _nftToken,
        IERC20 _erc20Token,
        uint256 _tokensPerBlock,
        uint256 _rewardsStartBlock,
        uint256 _rewardsEndBlock
    ) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PAUSER_ROLE, msg.sender);

        nftToken = _nftToken;
        erc20Token = _erc20Token;
        tokensPerBlock = _tokensPerBlock;
        lastRewardBlock = _rewardsStartBlock;
        rewardsEndBlock = _rewardsEndBlock;

        emit StakeRewardUpdated(tokensPerBlock);
        emit RewardsEndBlockUpdated(rewardsEndBlock);
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function getOwnedTokenIds(address wallet)
        external
        view
        returns (uint256[] memory)
    {
        return balanceOfToken[wallet];
    }

    function addToWhitelist(address _to) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(WHITELIST_ROLE, _to);
    }

    function removeFromWhitelist(address _to)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _revokeRole(WHITELIST_ROLE, _to);
    }

    function addAddressesToWhitelist(address[] calldata _addresses)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        for (uint256 i = 0; i < _addresses.length; i++) {
            _grantRole(WHITELIST_ROLE, _addresses[i]);
        }
    }

    function removeAddressesFromWhitelist(address[] calldata _addresses)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        for (uint256 i = 0; i < _addresses.length; i++) {
            _revokeRole(WHITELIST_ROLE, _addresses[i]);
        }
    }

    function stakeNFT(uint256 tokenId)
        public
        whenNotPaused
        nonReentrant
        returns (bool)
    {
        _stakeNFT(tokenId);

        return true;
    }

    function stakeNFTS(uint256[] calldata tokenIds)
        public
        whenNotPaused
        nonReentrant
        returns (bool)
    {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _stakeNFT(tokenIds[i]);
        }

        return true;
    }

    function getStakeContractBalance() public view returns (uint256) {
        return erc20Token.balanceOf(address(this));
    }

    function getRewardsEarned(uint256 tokenId) public view returns (uint256) {
        if (receipt[tokenId].stakedFromBlock == 0) {
            return 0;
        }

        return _getPendingReward(tokenId);
    }

    function getRewardsEarnedForWallet(address wallet)
        public
        view
        returns (uint256)
    {
        uint256[] memory tokenIds = balanceOfToken[wallet];
        uint256 totalReward;

        for (uint256 i = 0; i < tokenIds.length; i++) {
            totalReward += _getPendingReward(tokenIds[i]);
        }

        return totalReward;
    }

    function unStakeNFT(uint256 tokenId)
        public
        whenNotPaused
        nonReentrant
        returns (bool)
    {
        _unStakeNFT(tokenId);
        return true;
    }

    function unStakeNFTS(uint256[] calldata tokenIds)
        public
        whenNotPaused
        nonReentrant
        returns (bool)
    {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _unStakeNFT(tokenIds[i]);
        }

        return true;
    }

    function _unStakeNFT(uint256 tokenId)
        internal
        onlyStaker(tokenId)
        requireTimeElapsed(tokenId)
        returns (bool)
    {
        _updatePoolVariables();

        _payoutStake(tokenId);

        _removeFromStakedMappings(tokenId, msg.sender);

        nftToken.safeTransferFrom(address(this), msg.sender, tokenId);
        emit NftUnStaked(msg.sender, tokenId, block.number);
        return true;
    }

    function harvest(uint256 tokenId)
        public
        nonReentrant
        whenNotPaused
        onlyStaker(tokenId)
        requireTimeElapsed(tokenId)
    {
        _payoutStake(tokenId);
        receipt[tokenId].stakedFromBlock = block.number;
    }

    function harvestMultiple(uint256[] calldata tokenIds)
        public
        nonReentrant
        whenNotPaused
        onlyStakerOfAll(tokenIds)
        requireTimeElapsedOnAll(tokenIds)
    {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _payoutStake(tokenIds[i]);
            receipt[tokenIds[i]].stakedFromBlock = block.number;
        }
    }

    function changeTokensPerBlock(uint256 _tokensPerBlock)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(
            _tokensPerBlock > 0,
            "changeTokensPerblock: tokensPerBlock must be greater than 0"
        );
        tokensPerBlock = _tokensPerBlock;
        emit StakeRewardUpdated(tokensPerBlock);
    }

    function changeRewardsEndBlock(uint256 _rewardsEndBlock)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(
            _rewardsEndBlock > block.number,
            "changeRewardsEndBlock: new rewardsEndBlock must be bigger then current block"
        );
        rewardsEndBlock = _rewardsEndBlock;
        emit RewardsEndBlockUpdated(rewardsEndBlock);
    }

    function reclaimTokens() external onlyRole(DEFAULT_ADMIN_ROLE) {
        erc20Token.transfer(msg.sender, erc20Token.balanceOf(address(this)));
    }

    function depoTokens(uint256 value) external onlyRole(DEFAULT_ADMIN_ROLE) {
        erc20Token.transferFrom(msg.sender, address(this), value);
    }

    function updateStakingReward(uint256 _tokensPerBlock)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(
            _tokensPerBlock > 0,
            "updateStakingReward: tokensPerBlock must be greater than 0"
        );
        tokensPerBlock = _tokensPerBlock;
        emit StakeRewardUpdated(tokensPerBlock);
    }

    function _stakeNFT(uint256 tokenId) internal returns (bool) {
        require(
            receipt[tokenId].stakedFromBlock == 0,
            "Stake: Token is already staked"
        );
        require(
            nftToken.ownerOf(tokenId) != address(this),
            "Stake: Token is already staked in this contract"
        );
        nftToken.safeTransferFrom(msg.sender, address(this), tokenId);
        require(
            nftToken.ownerOf(tokenId) == address(this),
            "Stake: Failed to take possession of NFT"
        );

        _updatePoolVariables();

        _addToStakedMappings(tokenId);

        emit NftStaked(msg.sender, tokenId, block.number);
        return true;
    }

    function _payoutStake(uint256 tokenId) internal returns (bool) {
        require(
            receipt[tokenId].stakedFromBlock > 0,
            "_payoutStake: Can not stake from block 0"
        );

        uint256 payout = _getPendingReward(tokenId);

        if (erc20Token.balanceOf(address(this)) < payout) {
            emit StakePayout(
                msg.sender,
                tokenId,
                0,
                receipt[tokenId].stakedFromBlock,
                block.number
            );
            return false;
        }

        receipt[tokenId].rewardPenalty = _getCurrentRewardPerShare();
        erc20Token.transfer(receipt[tokenId].owner, payout);
        emit StakePayout(
            msg.sender,
            tokenId,
            payout,
            receipt[tokenId].stakedFromBlock,
            block.number
        );
        return true;
    }

    function _getPendingReward(uint256 tokenId)
        internal
        view
        returns (uint256)
    {
        uint256 currentReward = _getCurrentRewardPerShare();
        return currentReward.sub(receipt[tokenId].rewardPenalty);
    }

    function _getTimeStaked(uint256 tokenId) internal view returns (uint256) {
        if (receipt[tokenId].stakedFromBlock == 0) {
            return 0;
        }

        return block.number - (receipt[tokenId].stakedFromBlock);
    }

    function _adminSupport(uint256 tokenId)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
        nonReentrant
        returns (bool)
    {
        _updatePoolVariables();

        _payoutStake(tokenId);

        address tokenOwner = receipt[tokenId].owner;
        _removeFromStakedMappings(tokenId, tokenOwner);

        // Send token back to its owners wallet
        nftToken.safeTransferFrom(address(this), tokenOwner, tokenId);
        emit NftUnStaked(tokenOwner, tokenId, block.number);

        return true;
    }

    function _addToStakedMappings(uint256 tokenId) internal {
        uint256 newIndex = balanceOfToken[msg.sender].length;
        balanceOfToken[msg.sender].push(tokenId);
        indexOfTokenInBalanceOfToken[tokenId] = newIndex;

        receipt[tokenId].tokenId = tokenId;
        receipt[tokenId].stakedFromBlock = block.number;
        receipt[tokenId].owner = msg.sender;
        receipt[tokenId].rewardPenalty = _getCurrentRewardPerShare();

        // Increase totalStaked counter
        totalStaked += 1;
    }

    function _removeFromStakedMappings(uint256 tokenId, address tokenOwner)
        internal
    {
        _updatePoolVariables();

        uint256 toBeRemovedIndex = indexOfTokenInBalanceOfToken[tokenId];
        uint256 lastIndex = balanceOfToken[tokenOwner].length - 1;

        // Swap toBeRemoved with the item on last index of an array and update indexes
        if (toBeRemovedIndex != lastIndex) {
            uint256 lastIndexTokenId = balanceOfToken[tokenOwner][lastIndex];

            balanceOfToken[tokenOwner][toBeRemovedIndex] = lastIndexTokenId;
            balanceOfToken[tokenOwner][lastIndex] = tokenId;

            indexOfTokenInBalanceOfToken[lastIndexTokenId] = toBeRemovedIndex;
            indexOfTokenInBalanceOfToken[tokenId] = lastIndex;
        }

        // Remove tokenId index mapping and pop out the last cell from the array
        delete indexOfTokenInBalanceOfToken[tokenId];
        balanceOfToken[tokenOwner].pop();

        // Remove also receipt
        delete receipt[tokenId];

        // Decrease total staked count
        totalStaked -= 1;
    }

    function _getCurrentRewardPerShare() internal view returns (uint256) {
        if (block.number > lastRewardBlock && totalStaked != 0) {
            uint256 multiplier = _getMultiplier(lastRewardBlock, block.number);
            uint256 cakeReward = multiplier.mul(tokensPerBlock);
            uint256 adjustedTokenPerShare = accTokenPerShare.add(
                cakeReward.div(totalStaked)
            );

            return adjustedTokenPerShare;
        } else {
            return accTokenPerShare;
        }
    }

    function _updatePoolVariables() internal {
        if (block.number <= lastRewardBlock) {
            return;
        }

        uint256 stakedTokenSupply = totalStaked;

        if (stakedTokenSupply == 0) {
            lastRewardBlock = block.number;
            return;
        }

        uint256 multiplier = _getMultiplier(lastRewardBlock, block.number);
        uint256 cakeReward = multiplier.mul(tokensPerBlock);
        accTokenPerShare = accTokenPerShare.add(
            cakeReward.div(stakedTokenSupply)
        );

        lastRewardBlock = block.number;
    }

    /*
     * @notice Return reward multiplier over the given _from to _to block.
     * @param _from: block to start
     * @param _to: block to finish
     */
    function _getMultiplier(uint256 from, uint256 to)
        internal
        view
        returns (uint256)
    {
        if (to <= rewardsEndBlock) {
            return to.sub(from);
        } else if (from >= rewardsEndBlock) {
            return 0;
        } else {
            return rewardsEndBlock.sub(from);
        }
    }

    function setNFT(ERC721 value) public onlyRole(DEFAULT_ADMIN_ROLE) {
        nftToken = value;
    }

    function setToken(IERC20 value) public onlyRole(DEFAULT_ADMIN_ROLE) {
        erc20Token = value;
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
