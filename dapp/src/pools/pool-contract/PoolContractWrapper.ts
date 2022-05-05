import { ethers } from "ethers";
import EventEmitter from "events";

export type Opts = {
    stakeGas?: number;
    unStakeGas?: number;
    harvestGas?: number;
}

export class PoolContractWrapper extends EventEmitter {

    constructor(
        private contract: ethers.Contract,
        private opts: Opts = {}
    ) {
        super();
    }

    public async isActive(): Promise<boolean> {
        const res = await this.contract.paused();
        return Boolean(res);
    }

    public async getBalance(wallet: string): Promise<number> {
        const ids = await this.getTokenIdsInternal(wallet);
        return ids.length;
    }

    public async getTokenIds(wallet: string): Promise<number[]> {
        const ids = await this.getTokenIdsInternal(wallet);
        return ids.map(Number);
    }

    public async getEarned(wallet: string): Promise<string> {
        const earned = await this.contract.getRewardsEarnedForWallet(wallet);
        return earned;
    }

    public async getTokensPerBlock(): Promise<string> {
        const balance = await this.contract.tokensPerBlock();
        return balance;
    }

    public async isPaused(): Promise<boolean> {
        return this.contract.paused();
    }

    public async harvest(toWallet: string, tokenIds: number[]): Promise<void> {
        await this.waitForTx(this.contract.harvestMultiple(tokenIds));
    }

    public async stakeNfts(fromWallet: string, tokenIds: number[]): Promise<void> {
        await this.waitForTx(this.contract.stakeNFTS(tokenIds));
    }

    public async getTotalStakedCount(): Promise<number> {
        const count = await this.contract.totalStaked();
        return Number(count);
    }

    public async unStakeNfts(fromWallet: string, tokenIds: number[]): Promise<void> {
        await this.waitForTx(this.contract.unStakeNFTS(tokenIds));
    }

    private async getTokenIdsInternal(wallet: string): Promise<string[]> {
        return this.contract.getOwnedTokenIds(wallet);
    }

    private async waitForTx(promise: Promise<any>) {
        const tx = await promise;
        await tx.wait();
    }

}
