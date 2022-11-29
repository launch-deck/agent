const serverInput = document.getElementById("serverInput") as HTMLInputElement;
const codeInput = document.getElementById("codeInput") as HTMLInputElement;
const connectButton = document.getElementById("connectBTN") as HTMLButtonElement;

let connectionState: number = 0;

function updateConnectionState(state: number): void {
    console.log("connected state: " + state);
    connectionState = state;

    connectButton.disabled = false;
    serverInput.disabled = true;
    codeInput.disabled = true;

    switch (connectionState) {
        case 0:
            connectButton.innerText = "Connect";
            serverInput.disabled = false;
            codeInput.disabled = false;
            break;
        case 1:
            connectButton.innerText = "Connecting";
            break;
        case 2:
            connectButton.innerText = "Disconnect";
            break;
    }
}

async function connect() {

    if (connectionState > 0) {
        window.api.disconnect();
        return;
    }

    var serverAddress = serverInput?.value;
    var agentCode = codeInput?.value;
    if (!serverAddress || !agentCode) {
        return;
    }

    try {
        window.api.connect(serverAddress, agentCode);
        console.log(`Connected to ${serverAddress} Successfully`);
    } catch (e) {
        console.log("Failed to connect to ${serverURL}", e);
    }
}

window.api.onConnection((_, state: number) => updateConnectionState(state));
window.api.getConnectionState().then((state: number) => updateConnectionState(state));
connectButton.addEventListener("click", connect);

window.api.getConnectionSettings().then((settings: { serverAddress: string, agentCode: string }) => {
    if (serverInput) {
        serverInput.value = settings.serverAddress;
    }
    if (codeInput) {
        codeInput.value = settings.agentCode;
    }
});
