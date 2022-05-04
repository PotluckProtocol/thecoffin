import { useContext } from "react"
import { Terminology, TerminologyContext } from "./terminology"

export const useTerminology = (): [Terminology, (terminology: Terminology) => void] => {
    const context = useContext(TerminologyContext);
    return [
        context.terminology,
        context.setTerminology
    ]
}