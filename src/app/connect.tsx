import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { useEffect, useState } from "react";
import contextBridge from "./context-bridge";
import Plugins from "./plugins";
import QRCode from "react-qr-code";

export default function Connect() {

    const [state, setState] = useState({
        serverAddress: 'https://launchdeck.davidpaulhamilton.net/',
        agentCode: '7060'
    });

    const [connection, setConnection] = useState(0);

    useEffect(() => {
        contextBridge.getConnectionState().then(status => setConnection(status));
        contextBridge.getConnectionSettings().then(settings => setState(settings));
        contextBridge.onConnection((status) => setConnection(status))
    }, []);

    const handleServerAddressChange = (event: any) => {
        setState({
            ...state,
            serverAddress: event.target.value
        });
    };

    const handleAgentCodeChange = (event: any) => {
        setState({
            ...state,
            agentCode: event.target.value
        });
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        switch (connection) {
            case 0:
                console.log(`Connect ${state.serverAddress} : ${state.agentCode}`);
                await contextBridge.connect(state.serverAddress, state.agentCode);
                break;
            case 2:
                console.log(`Disconnect`);
                await contextBridge.disconnect();
                break;
        }
    }

    let connectText;
    switch (connection) {
        case 0:
            connectText = 'Connect';
            break;
        case 1:
            connectText = 'Connecting';
            break;
        default:
            connectText = 'Disconnect';
            break;
    }

    let qrUlrString = "";
    try {
        const qrUrl = new URL(state.serverAddress);
        qrUrl.searchParams.append("agent", state.agentCode);
        qrUlrString = qrUrl.toString();
    } catch (ignored) { }

    return (
        <Box
            component="form"
            sx={{
                '& > :not(style)': { m: 1 },
            }}
            noValidate
            autoComplete="off">

            <TextField
                id="serverAddress"
                label="Server"
                variant="outlined"
                disabled={connection !== 0}
                value={state.serverAddress}
                onChange={handleServerAddressChange} />
            <TextField
                id="agentCode"
                label="Agent Code"
                variant="outlined"
                disabled={connection !== 0}
                value={state.agentCode}
                onChange={handleAgentCodeChange} />

            <Button variant={connection === 0 ? 'contained' : 'outlined'} onClick={handleSubmit} disabled={connection === 1}>
                {connectText}
            </Button>

            <br />

            <QRCode
                size={256}
                value={qrUlrString}
                viewBox={`0 0 256 256`}
            />

            <Plugins />
        </Box>
    );
}
