import { CaveCompounderToolkit as Tk, CaveCompounderToolkitProps } from "./CaveCompounderToolkit";
import { CaveCompounderProvider } from "./context/caveCompounderContext";

export const CaveCompounderToolkit: React.FC<CaveCompounderToolkitProps> = (props) => {
    return (
        <CaveCompounderProvider>
            <Tk {...props} />
        </CaveCompounderProvider>
    );
}