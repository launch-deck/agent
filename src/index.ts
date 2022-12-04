import * as path from "path";
import { app, BrowserWindow, ipcMain, session } from 'electron';
import { ConnectionState } from './agent/agent-hub.service';
import { AgentService } from './agent/agent.service';
import { v4 } from "uuid";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

// Handle auto-updates
if (process.env.NODE_ENV !== 'development') {
    require('update-electron-app')()
}

let mainWindow: BrowserWindow | null;
let connectionState: ConnectionState = ConnectionState.disconnected;
let pluginsStatus: { ns: string, started: boolean }[] = [];

const agentService = new AgentService();

const connectionSubscription = agentService.connectionObservable.subscribe((state) => {
    connectionState = state;
    mainWindow?.webContents.send('connection', connectionState);
});
const pluginSubscription = agentService.pluginStatus.subscribe(plugins => {
    pluginsStatus = plugins.map(plugin => ({ ns: plugin.ns, started: plugin.started }));
    mainWindow?.webContents.send('pluginStatus', pluginsStatus);
});
agentService.init();

const createWindow = (): void => {

    // Add CSP headers
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': ['default-src \'self\' \'unsafe-inline\'']
            }
        })
    });

    // Create the browser window.
    mainWindow = new BrowserWindow({
        height: 500,
        width: 400,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js")
        },
    });

    // and load the index.html of the app.
    mainWindow.loadURL(path.join(__dirname, "app/index.html"));

    // Open the DevTools.
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }

    // When the main window opens, send the connectionState
    mainWindow.webContents.send('connection', connectionState);

    // Watch for client commands
    ipcMain.handle('connect', async (_, serverAddress: string, agentCode: string) => await agentService.connect(serverAddress, agentCode));
    ipcMain.handle('disconnect', () => agentService.disconnect());
    ipcMain.handle('getConnectionSettings', async () => {
        const stored = await agentService.getStoredConnectionSettings();

        const serverAddress = stored.serverAddress ? stored.serverAddress : app.isPackaged ? "https://launchdeck.davidpaulhamilton.net/" : "http://localhost:5105";
        const agentCode = stored.agentCode ? stored.agentCode : app.isPackaged ? v4() : "1";

        return {
            serverAddress,
            agentCode
        };
    });
    ipcMain.handle('getConnectionState', () => connectionState);
    ipcMain.handle('getPluginStatus', () => pluginsStatus);
    ipcMain.handle('startPlugin', (_, ns: string) => agentService.startPlugin(ns));
    ipcMain.handle('stopPlugin', (_, ns: string) => agentService.stopPlugin(ns));
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        connectionSubscription.unsubscribe();
        pluginSubscription.unsubscribe();
        agentService.stopAllPlugins();
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
