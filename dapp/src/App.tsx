import React, { ComponentPropsWithoutRef, useEffect, useState } from 'react';
import Switch from 'react-switch';
import { ToastContainer } from 'react-toastify';
import styled from 'styled-components';
import { ListPools } from './components/ListPools';
import { Navbar } from './components/Navbar';
import 'react-toastify/dist/ReactToastify.css';
import classNames from 'classnames';
import useUser from './account/useUser';
import { Loading } from './components/Loading';

const Container = styled.div`
    max-width: 1200px;
`;

const Header = styled.h1`
    text-align: center;
    font-size: 7rem;
    line-height: 7rem;
    font-family: Chomsky;
    color: white;
    margin-top: 9rem;
`;

type DescriptionProps = ComponentPropsWithoutRef<'p'> & {
    harvestMode: boolean;
}

const Description = styled.p<DescriptionProps>`
    text-transform: uppercase;
    text-align: center;
    font-family: Backbones;
    font-size: 3.5rem;
    color: ${props => props.harvestMode ? '#ff7b44' : 'white'};
    text-shadow: ${props => props.harvestMode ? '#000 1px 1px 7px' : 'none'};
    transition: color 350ms ease-in-out, text-shadow 350ms ease-in-out;
`;

type SwitchLabelProps = {
    active: boolean;
}

const SwitchLabel = styled.label<SwitchLabelProps>`
    color: ${props => props.active ? '#ff7b44' : 'white'};
    text-shadow: ${props => props.active ? '#000 1px 1px 7px' : 'none'};
    transition: color 350ms ease-in-out, text-shadow 350ms ease-in-out;
    font-size: 1.8rem;
    font-family: Backbones;
    margin-left: .75rem;
`;

const Disclaimer = styled.div`
    font-size: .6rem;
    color: white;
    text-align: center;  
`;

const CaveCompounder = styled.div`
    color: white;
    font-size: 1.2rem;
`;

const CaveCompounderImage = styled.img`
    transition: filter 500ms ease-in-out;

    &:hover {
        filter: invert(79%) sepia(22%) saturate(2204%) hue-rotate(224deg) brightness(99%) contrast(69%)
    }
`;

const Quu = styled.span`
    font-size: 0;
`;


const App: React.FC = () => {

    const user = useUser();
    const [mode, setMode] = useState<'basic' | 'harvest'>('basic')

    const handleSwitchChange = (checked: boolean) => {
        if (checked) {
            setMode('harvest');
        } else {
            setMode('basic');
        }
    }

    const switchContainerClasses = classNames('mb-8 px-4', {
        'invisible': !user.account
    });

    if (!user.isInitialized) {
        return null;
    }

    return (
        <div className="App relative">
            <Navbar />
            <Container className="mx-auto">
                <Header>The Coffin</Header>

                <div className='mb-12'>
                    <Description harvestMode={mode === 'harvest'}>
                        {mode === 'harvest' ? 'Raid graves to harvest' : 'Bury your NFTs for staking'}
                    </Description>
                </div>

                <div className={switchContainerClasses}>
                    <SwitchLabel title='... harvest mode' className='flex justify-center items-center' active={mode === 'harvest'}>
                        <Switch
                            disabled={!user.account}
                            checked={mode === 'harvest'}
                            onChange={handleSwitchChange}
                            checkedIcon={false}
                            uncheckedIcon={false}
                            onColor={'#ff7b44'}
                        />
                        <span className='ml-4'>GRAVE RAIDING MODE</span>
                    </SwitchLabel>
                </div>

                <ListPools mode={mode} />

                <CaveCompounder className="block mb-6 mt-12 px-6 md:flex justify-center items-center">
                    <div className='md:mr-4 mb-4 md:mb-0 text-center'>Autocompound your rewards in </div>
                    <a href="https://thecavecompounder.com"><CaveCompounderImage className='mx-auto md:mx-0' src="/images/CaveCompounder.png" /></a>
                </CaveCompounder>
            </Container >
            <ToastContainer />

            <Quu>Quu is king</Quu>

            <Disclaimer>

            </Disclaimer>
        </div >
    );
}

export default App;
