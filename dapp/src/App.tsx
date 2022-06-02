import React, { ComponentPropsWithoutRef, useContext, useEffect, useState } from 'react';
import Switch from 'react-switch';
import { ToastContainer } from 'react-toastify';
import styled, { CSSProperties } from 'styled-components';
import { ListPools } from './components/ListPools';
import { Navbar } from './components/Navbar';
import 'react-toastify/dist/ReactToastify.css';
import classNames from 'classnames';
import useUser from './account/useUser';
import { Loading } from './components/Loading'
import { CaveCompounderToolkit } from './components/CaveCompounderToolkit';
import { CaveCompounderContext } from './components/CaveCompounderToolkit/context/caveCompounderContext';
import { HarvestAllProvider } from './pools/HarvestAllContext';
import { ButtonGroup, ButtonGroupProps, GroupButton } from './components/ButtonGroup';

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

const CaveCompounderContainer = styled.div`
    margin-bottom: 8rem;
`;

const Quu = styled.span`
    font-size: 0;
`;

type View = 'open' | 'ended';

const buttonGroupStyle: CSSProperties = {
    backgroundColor: 'rgba(0,0,0,0.45)'
}

const App: React.FC = () => {

    const caveCompounderContext = useContext(CaveCompounderContext);
    const user = useUser();
    const [mode, setMode] = useState<'basic' | 'harvest'>('basic')
    const [view, setView] = useState<View>('open');

    useEffect(() => {
        if (user.account) {
            try {
                caveCompounderContext.init();
            } catch (e) {
                console.log('CaveCompounder init failed', e);
            }
        } else {
            caveCompounderContext.reset();
        }
    }, [user.account]);

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
        return (
            <div className="mt-12 flex justify-center ">
                <Loading size={15} width={150} />
            </div>
        );
    }

    const handleViewChange = (buttonGroup: GroupButton) => {
        const nextView = buttonGroup.value as View;
        setView(nextView);

        // Change also to basic mode for not entering
        // ended view with harvest mode
        if (nextView === 'ended') {
            setMode('basic');
        }
    }

    const buttonGroup: GroupButton[] = [{
        text: 'Open',
        value: 'open',
        active: view === 'open'
    }, {
        text: 'Ended',
        value: 'ended',
        active: view === 'ended'
    }];

    console.log('STYLES', JSON.stringify(buttonGroupStyle));

    return (
        <div className="App relative">
            <Navbar />
            <Container className="mx-auto">
                <Header>The Coffin</Header>

                <div className='mb-6'>
                    <Description harvestMode={mode === 'harvest'}>
                        {mode === 'harvest' ? 'Raid graves to harvest' : 'Bury your NFTs for staking'}
                    </Description>
                </div>

                <div className='flex justify-center mb-6'>
                    <ButtonGroup buttonStyle={buttonGroupStyle} buttons={buttonGroup} onSelect={handleViewChange} />
                </div>
                {view === 'open' && (
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
                )}

                <HarvestAllProvider>
                    <ListPools mode={mode} />
                </HarvestAllProvider>

                {user.account && caveCompounderContext.isInitialized && (
                    <CaveCompounderContainer>
                        <CaveCompounderToolkit />
                    </CaveCompounderContainer>
                )}
            </Container >
            <ToastContainer />

            <Quu>Quu is king</Quu>

            <Disclaimer>

            </Disclaimer>
        </div >
    );
}

export default App;
