import { ethers } from "ethers";
import EventEmitter from "events";

export class NFTContractWrapper extends EventEmitter {

    constructor(
        private contract: ethers.Contract
    ) {
        super();
    }

    public async getApprovedStatus(wallet: string, operator: string): Promise<boolean> {
        if (!operator) {
            return false;
        }

        const approved = await this.contract.isApprovedForAll(wallet, operator);
        return Boolean(approved);
    }

    public async approve(wallet: string, operator: string): Promise<void> {
        const tx = await this.contract.setApprovalForAll(operator, true);
        await tx.wait();
    }

    public async getBalance(wallet: string): Promise<number> {
        const balance = await this.contract.balanceOf(wallet);
        return Number(balance);
    }

    public async getTokenIds(wallet: string): Promise<number[]> {
        const balance = await this.getBalance(wallet);

        const tokenIds: number[] = [];
        for (let i = 0; i < balance; i++) {
            const tokenId = await this.contract.tokenOfOwnerByIndex(wallet, i);
            tokenIds.push(Number(tokenId));
        }

        return tokenIds;
    }

}