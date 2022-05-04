import { useContext } from "react";
import { Account } from "./Account";
import { AccountContext } from "./AccountContext";

const useAccount = (): Account | null => {
    const { account } = useContext(AccountContext);
    return account;
}

export default useAccount;