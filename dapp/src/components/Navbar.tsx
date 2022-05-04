import styled from "styled-components";
import { ConnectWalletButton } from "./ConnectWalletButton";

const Nav = styled.nav`
    background: #5dffff;
    background: linear-gradient(270deg, #5dffff 0%, #000000 100%);
    padding: .5rem 1rem;
`;

const InnerContainer = styled.div`
    height: 3.75rem;
    max-width: 1200px;
`;

const Link = styled.a`
    display: block;
    height: 90%;
    max-width: 100%;
`;

const Logo = styled.img`
    height: 100%;
`;

export const Navbar: React.FC = () => {
    return (
        <Nav>
            <InnerContainer className="sm:flex mx-auto justify-between items-center">
                <Link href="https://app.potluckprotocol.com" target="_blank">
                    <Logo src='/images/PotluckProtocolLogo.png' />
                </Link>
                <div className="mt-8 sm:mt-0">
                    <ConnectWalletButton />
                </div>
            </InnerContainer>
        </Nav>
    )
}