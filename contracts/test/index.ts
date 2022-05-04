import { use, expect } from "chai";
import { deployMockContract, MockContract, solidity } from "ethereum-waffle";
import { ethers } from "hardhat";
import ERC20 from "@openzeppelin/contracts/build/contracts/ERC20.json";
import ERC721 from "@openzeppelin/contracts/build/contracts/ERC721.json";
import { beforeEach } from "mocha";
import { BigNumber, Signer, Wallet } from "ethers";
import { PotluckNFTStaking } from "../typechain";
import { mineNBlocks } from "./utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { parseEther } from "ethers/lib/utils";

use(solidity);

describe("PotluckNFTStaking", async function () {

  let erc721Mock: MockContract;
  let erc20Mock: MockContract;
  let contract: PotluckNFTStaking;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    erc721Mock = await deployMockContract(owner, ERC721.abi)
    erc20Mock = await deployMockContract(owner, ERC20.abi);

    const latestBlock = await ethers.provider.getBlock("latest");
    const NFTStakingV1 = await ethers.getContractFactory("PotluckNFTStaking", owner);
    contract = await NFTStakingV1.deploy(
      erc721Mock.address,
      erc20Mock.address,
      "1000000000000000000",
      latestBlock.number,
      latestBlock.number + 10000
    );

    await mineNBlocks(1);

    await contract.deployed();

  });

  it("Should return totalStaked count as zero", async function () {
    const totalStaked = await contract.totalStaked();
    expect(totalStaked).eq(0);
  });

  it('should allow (multi) staking and unstaking the token', async function () {
    const ID = 12;

    await erc721Mock.mock["safeTransferFrom(address,address,uint256)"].returns();
    await erc721Mock.mock["ownerOf(uint256)"].returns(owner.address);

    await contract.stakeNFTS([ID], { gasLimit: 300000 });

    // Total staked count increased
    const totalStaked = await contract.totalStaked();
    expect(totalStaked).eq(1);

    const startReward = await contract.getRewardsEarned(ID);
    expect(startReward).eq(0);

    // After 75 blocks
    await mineNBlocks(75);

    const accReward = await contract.getRewardsEarned(ID);
    expect(accReward).not.eq(0);

    await erc20Mock.mock["transfer(address,uint256)"].returns(true);
    await erc20Mock.mock["balanceOf(address)"].returns(parseEther('5000000'))
    await erc721Mock.mock["ownerOf(uint256)"].returns(contract.address);
    await contract.unStakeNFTS([ID], { gasLimit: 300000 });

    // total staked count decreased
    const totalStakedAfter = await contract.totalStaked();
    expect(totalStakedAfter).eq(0);
  });

  it('should allow staking and unstaking multiple tokens', async function () {
    const IDS = [12, 13, 14, 15, 16];

    const OTHER_WALLET_IDS = [99];

    await erc721Mock.mock["safeTransferFrom(address,address,uint256)"].returns();
    await erc721Mock.mock["ownerOf(uint256)"].returns(addr1.address);
    await contract.connect(addr1).stakeNFTS(OTHER_WALLET_IDS, { gasLimit: 300000 });

    await erc721Mock.mock["ownerOf(uint256)"].returns(owner.address);
    await contract.stakeNFTS(IDS, { gasLimit: 300000 * IDS.length });

    // After 75 blocks
    await mineNBlocks(75);

    // Total staked count increased
    const totalStaked = await contract.totalStaked();
    expect(totalStaked).eq(IDS.length + OTHER_WALLET_IDS.length);

    const walletStaked = await contract.getOwnedTokenIds(owner.address);
    expect(walletStaked.length).eq(IDS.length);

    await erc20Mock.mock["transfer(address,uint256)"].returns(true);
    await erc20Mock.mock["balanceOf(address)"].returns(parseEther('5000000'))
    await erc721Mock.mock["ownerOf(uint256)"].returns(contract.address);
    const unstakeTokens = [...IDS].splice(0, 3);
    await contract.unStakeNFTS(unstakeTokens, { gasLimit: 300000 * unstakeTokens.length });

    // total staked count decreased
    const totalStakedAfter = await contract.totalStaked();
    expect(totalStakedAfter).eq(IDS.length - unstakeTokens.length + OTHER_WALLET_IDS.length);

    const walletStakedAfterUnstake = await contract.getOwnedTokenIds(owner.address);
    expect(walletStakedAfterUnstake.length).eq(IDS.length - unstakeTokens.length);
  });

  it('should allow staking and unstaking the token', async function () {
    const ID = 12;

    await erc721Mock.mock["safeTransferFrom(address,address,uint256)"].returns();
    await erc721Mock.mock["ownerOf(uint256)"].returns(owner.address);

    await contract.stakeNFT(ID, { gasLimit: 300000 });

    // Total staked count increased
    const totalStaked = await contract.totalStaked();
    expect(totalStaked).eq(1);

    const startReward = await contract.getRewardsEarned(ID);
    expect(startReward).eq(0);

    // After 75 blocks
    await mineNBlocks(10);

    const accReward = await contract.getRewardsEarned(ID);
    expect(accReward).not.eq(0);

    await erc20Mock.mock["transfer(address,uint256)"].returns(true);
    await erc20Mock.mock["balanceOf(address)"].returns(parseEther('5000000'))
    await erc721Mock.mock["ownerOf(uint256)"].returns(contract.address);

    await contract.unStakeNFT(ID, { gasLimit: 300000 });
  });

  it('should not allow (multi) unstaking token if its not mine', async function () {
    const ID = 12;

    await erc721Mock.mock["safeTransferFrom(address,address,uint256)"].returns();
    await erc721Mock.mock["ownerOf(uint256)"].returns(owner.address);

    await contract.stakeNFTS([ID], { gasLimit: 300000 });

    // After 75 blocks
    await mineNBlocks(75);

    await erc20Mock.mock["transfer(address,uint256)"].returns(true);
    await erc20Mock.mock["balanceOf(address)"].returns(parseEther('5000000'))
    await erc721Mock.mock["ownerOf(uint256)"].returns(contract.address);

    await expect(contract.connect(addr1).unStakeNFTS([ID], { gasLimit: 300000 })).to.be.reverted;
  });

  it('should not allow unstaking token if its not mine', async function () {
    const ID = 12;

    await erc721Mock.mock["safeTransferFrom(address,address,uint256)"].returns();
    await erc721Mock.mock["ownerOf(uint256)"].returns(owner.address);

    await contract.stakeNFT(ID, { gasLimit: 300000 });

    // After 75 blocks
    await mineNBlocks(75);

    await erc20Mock.mock["transfer(address,uint256)"].returns(true);
    await erc20Mock.mock["balanceOf(address)"].returns(parseEther('5000000'))
    await erc721Mock.mock["ownerOf(uint256)"].returns(contract.address);

    await expect(contract.connect(addr1).unStakeNFT(ID, { gasLimit: 300000 })).to.be.reverted;
  });

  it('should accumulate rewards correctly', async function () {

    const IDS = [12, 13, 14, 15, 16];
    const OTHER_WALLET_IDS = [99];

    await mineNBlocks(10);

    await erc721Mock.mock["safeTransferFrom(address,address,uint256)"].returns();

    await erc721Mock.mock["ownerOf(uint256)"].returns(owner.address);
    await contract.stakeNFTS(IDS, { gasLimit: 300000 * IDS.length });

    await mineNBlocks(10);

    await erc721Mock.mock["ownerOf(uint256)"].returns(addr1.address);
    await contract.connect(addr1).stakeNFTS(OTHER_WALLET_IDS, { gasLimit: 300000 });

    await mineNBlocks(10);

    const id1Debt = (await contract.receipt(IDS[0])).rewardPenalty;
    const ow1Debt = (await contract.receipt(OTHER_WALLET_IDS[0])).rewardPenalty;
    console.log('id1', id1Debt, 'ow', ow1Debt);
    expect(ow1Debt).to.be.gt(id1Debt);

    // Total staked count increased
    const totalStaked = await contract.totalStaked();
    expect(totalStaked).eq(IDS.length + OTHER_WALLET_IDS.length);

    const walletStaked = await contract.getOwnedTokenIds(owner.address);
    expect(walletStaked.length).eq(IDS.length);

    await erc20Mock.mock["transfer(address,uint256)"].returns(true);
    await erc20Mock.mock["balanceOf(address)"].returns(parseEther('5000000'))
    await erc721Mock.mock["ownerOf(uint256)"].returns(contract.address);
    const unstakeTokens = [...IDS].splice(0, 3);
    await contract.unStakeNFTS(unstakeTokens, { gasLimit: 300000 * unstakeTokens.length });

    // total staked count decreased
    const totalStakedAfter = await contract.totalStaked();
    expect(totalStakedAfter).eq(IDS.length - unstakeTokens.length + OTHER_WALLET_IDS.length);

    const walletStakedAfterUnstake = await contract.getOwnedTokenIds(owner.address);
    expect(walletStakedAfterUnstake.length).eq(IDS.length - unstakeTokens.length);
  });

  it('more rewards testing', async function () {

    await mineNBlocks(10);

    await erc721Mock.mock["safeTransferFrom(address,address,uint256)"].returns();

    await erc721Mock.mock["ownerOf(uint256)"].returns(owner.address);
    await contract.stakeNFT(10, { gasLimit: 300000 });
    await mineNBlocks(10);

    await contract.stakeNFT(11, { gasLimit: 300000 });
    await mineNBlocks(10);

    await contract.stakeNFT(12, { gasLimit: 300000 });
    await mineNBlocks(10);

    await contract.stakeNFT(13, { gasLimit: 300000 });
    await mineNBlocks(10);

    await contract.stakeNFT(14, { gasLimit: 300000 });
    await mineNBlocks(10);

    await contract.stakeNFT(15, { gasLimit: 300000 });

    await mineNBlocks(1000);

    const rew1 = await contract.getRewardsEarned(11);
    const rew2 = await contract.getRewardsEarned(12);

    expect(rew1).to.be.gt(rew2);
  });

  it('test get rewards for wallet', async function () {

    await mineNBlocks(10);

    await erc721Mock.mock["safeTransferFrom(address,address,uint256)"].returns();

    await erc721Mock.mock["ownerOf(uint256)"].returns(owner.address);
    await contract.stakeNFT(10, { gasLimit: 300000 });
    await contract.stakeNFT(11, { gasLimit: 300000 });
    await contract.stakeNFT(12, { gasLimit: 300000 });
    await contract.stakeNFT(13, { gasLimit: 300000 });
    await contract.stakeNFT(14, { gasLimit: 300000 });
    await contract.stakeNFT(15, { gasLimit: 300000 });
    await mineNBlocks(50);
    const rew1 = await contract.getRewardsEarnedForWallet(owner.address);
    await mineNBlocks(50);
    const rew2 = await contract.getRewardsEarnedForWallet(owner.address);
    console.log('rew1', rew1, 'rew2', rew2);
    expect(rew1).to.be.lt(rew2);
  });


  it('test rewards non-staked', async function () {
    const rew = await contract.getRewardsEarned(155);
    expect(rew).eq(BigNumber.from(0));
  });

  it('test rewards staked', async function () {
    const ID = 15;
    await erc721Mock.mock["safeTransferFrom(address,address,uint256)"].returns();
    await erc721Mock.mock["ownerOf(uint256)"].returns(owner.address);
    await contract.stakeNFT(ID, { gasLimit: 300000 });
    await mineNBlocks(15);
    const rew = await contract.getRewardsEarned(ID);
    expect(rew).to.be.gt(BigNumber.from(0));
  });

});
