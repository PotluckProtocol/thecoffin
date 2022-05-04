import EventEmitter from "events";
import { Contract } from "../types/Contract";

export class NFTContractWrapper extends EventEmitter {

    constructor(
        private contract: Contract
    ) {
        super();
    }

    public async getApprovedStatus(wallet: string, operator: string): Promise<boolean> {
        if (!operator) {
            return false;
        }

        const approved = await this.contract.methods.isApprovedForAll(wallet, operator).call();
        return Boolean(approved);
    }

    public async approve(wallet: string, operator: string): Promise<void> {
        await this.contract.methods
            .setApprovalForAll(operator, true)
            .send({
                gasLimit: String(75000),
                from: wallet,
                to: this.contract.options.address
            });
    }

    public async getBalance(wallet: string): Promise<number> {
        const balance = await this.contract.methods.balanceOf(wallet).call();
        return Number(balance);
    }

    public async getTokenIds(wallet: string): Promise<number[]> {
        const balance = await this.getBalance(wallet);

        const tokenIds: number[] = [];
        for (let i = 0; i < balance; i++) {
            const tokenId = await this.contract.methods.tokenOfOwnerByIndex(wallet, i).call();
            tokenIds.push(Number(tokenId));
        }

        return tokenIds;
    }

    public async getMaxSupply(): Promise<number> {
        const maxSupply = await this.contract.methods.maxSupply().call();
        return Number(maxSupply);
    }

}