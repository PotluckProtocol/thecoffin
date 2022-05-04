import { ethers } from "hardhat";

export async function mineNBlocks(n: number) {
    for (let index = 0; index < n; index++) {
        const now = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp + 1000;
        await ethers.provider.send('evm_setNextBlockTimestamp', [now]);
        await ethers.provider.send('evm_mine', []);
    }
}