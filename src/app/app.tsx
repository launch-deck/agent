import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import agentDataStore from './redux/agent-data-store';
import Tabs from './tabs';

import './app.css';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

function App() {
    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Provider store={agentDataStore}>
                <Tabs />
            </Provider>
        </ThemeProvider>
    );
}

const domNode = document.getElementById('app');
if (domNode) {
    const root = createRoot(domNode);
    root.render(<App />);
}
