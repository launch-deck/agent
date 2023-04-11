import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
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
            <Tabs />
        </ThemeProvider>
    );
}

const domNode = document.getElementById('app');
if (domNode) {
    const root = createRoot(domNode);
    root.render(<App />);
}
