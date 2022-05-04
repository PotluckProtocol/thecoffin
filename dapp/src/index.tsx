import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { AccountProvider } from './account/AccountContext';
import { PoolsBaseInfoProvider } from "./pools/PoolsBaseInfoContext";
import { Web3Provider } from './web3/Web3Context';
import { TerminologyProvider } from './terminology/terminology';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const ErrorFallback: React.FC<FallbackProps> = ({ error }) => {
    return (
        <div role="alert">
            <p>Something went wrong:</p>
            <pre style={{ color: 'red' }}>{error.message}</pre>
        </div>
    )
}

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <React.StrictMode>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Web3Provider>
                <AccountProvider>
                    <TerminologyProvider>
                        <PoolsBaseInfoProvider>
                            <App />
                        </PoolsBaseInfoProvider>
                    </TerminologyProvider>
                </AccountProvider>
            </Web3Provider>
        </ErrorBoundary>
    </React.StrictMode >
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
