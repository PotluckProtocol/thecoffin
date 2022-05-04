import EventEmitter from "events";
import { Contract } from "../../types/Contract";

export type Opts = {
    stakeGas?: number;
    unStakeGas?: number;
    harvestGas?: number;
}

export class PoolContractWrapper extends EventEmitter {

    constructor(
        private contract: Contract,
        private opts: Opts = {}
    ) {
        super();
    }

    public async isActive(): Promise<boolean> {
        const res = await this.contract.methods.paused().call();
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
        const earned = await this.contract.methods.getRewardsEarnedForWallet(wallet).call();
        return earned;
    }

    public async getTokensPerBlock(): Promise<string> {
        const balance = await this.contract.methods.tokensPerBlock().call();
        return balance;
    }

    public async isPaused(): Promise<boolean> {
        return this.contract.methods.paused().call();
    }

    public async harvest(toWallet: string, tokenIds: number[]): Promise<void> {
        await this.contract.methods
            .harvestMultiple(tokenIds)
            .send({
                from: toWallet,
                to: this.contract.options.address
            });
    }

    public async stakeNfts(fromWallet: string, tokenIds: number[]): Promise<void> {
        await this.contract.methods
            .stakeNFTS(tokenIds)
            .send({
                from: fromWallet,
                to: this.contract.options.address
            });
    }

    public async getTotalStakedCount(): Promise<number> {
        const count = await this.contract.methods.totalStaked().call();
        return Number(count);
    }

    public async unStakeNfts(fromWallet: string, tokenIds: number[]): Promise<void> {
        await this.contract.methods
            .unStakeNFTS(tokenIds)
            .send({
                from: fromWallet,
                to: this.contract.options.address
            });
    }


    private async getTokenIdsInternal(wallet: string): Promise<string[]> {
        return this.contract.methods.getOwnedTokenIds(wallet).call();
    }

}
