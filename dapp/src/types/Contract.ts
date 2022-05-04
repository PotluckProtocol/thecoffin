import Web3 from "web3";

type Web3Instance = InstanceType<typeof Web3>;

type ContractClass = Web3Instance['eth']['Contract'];

export type Contract = InstanceType<ContractClass>;