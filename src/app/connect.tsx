import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { useEffect } from "react";
import Plugins from "./plugins";
import QRCode from "react-qr-code";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import { connect, disconnect, getConnectionState, setAgentCode, setServerAddress } from "./redux/agent-data-slice";

export default function Connect() {

    const dispatch = useAppDispatch();
    const agentData = useAppSelector(state => state.agentData);
    const connectionState = useAppSelector(state => state.connectionState);

    useEffect(() => {
        dispatch(getConnectionState());
    }, [dispatch]);

    const handleServerAddressChange = (event: any) => {
        dispatch(setServerAddress(event.target.value));
    };

    const handleAgentCodeChange = (event: any) => {
        dispatch(setAgentCode(event.target.value));
    };

    const handleSubmit = (e: any) => {
        e.preventDefault();

        switch (connectionState) {
            case 0:
                console.log(`Connect ${agentData.serverAddress} : ${agentData.agentCode}`);
                dispatch(connect({ serverAddress: agentData.serverAddress, agentCode: agentData.agentCode }));
                break;
            default:
                console.log(`Disconnect`);
                dispatch(disconnect());
                break;
        }
    }

    let connectText;
    switch (connectionState) {
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
        const qrUrl = new URL(agentData.serverAddress);
        qrUrl.searchParams.append("agent", agentData.agentCode);
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
                disabled={connectionState !== 0}
                value={agentData.serverAddress}
                onChange={handleServerAddressChange} />
            <TextField
                id="agentCode"
                label="Agent Code"
                variant="outlined"
                disabled={connectionState !== 0}
                value={agentData.agentCode}
                onChange={handleAgentCodeChange} />

            <Button variant={connectionState === 0 ? 'contained' : 'outlined'} onClick={handleSubmit} disabled={connectionState === 1}>
                {connectText}
            </Button>

            <br />

            <QRCode
                size={128}
                value={qrUlrString}
                viewBox={`0 0 128 128`}
            />

            <Plugins />
        </Box>
    );
}
