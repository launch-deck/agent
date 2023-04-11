import { app, BrowserWindow, ipcMain, session, shell } from 'electron';
import { firstValueFrom } from 'rxjs';
import { v4 } from 'uuid';
import { ConnectionState } from './agent/agent-hub.service';
import { AgentService } from './agent/agent.service';
import { AgentData } from './interfaces';

// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

let cspDefaultSrc = [
    '\'self\'',
    '\'unsafe-inline\'',
    'https://launchdeck.davidpaulhamilton.net/',
    'https://*.googleapis.com'
];
const cspImgSrc = [
    '*',
    'data:'
];
const cspFontSrc = [
    'file://*',
    'https://fonts.gstatic.com'
];
const cspConnectSrc = [
    'data:'
];
if (process.env.NODE_ENV === 'development') {
    cspDefaultSrc.push('\'unsafe-eval\'');
    cspFontSrc.push('http://localhost:3000');
    cspConnectSrc.push('*');
}
const contentSecurityPolicy = `default-src ${cspDefaultSrc.join(' ')}; img-src ${cspImgSrc.join(' ')}; font-src ${cspFontSrc.join(' ')}; connect-src ${cspConnectSrc.join(' ')}`;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

// Handle auto-updates
if (process.env.NODE_ENV !== 'development') {
    require('update-electron-app')({
        logger: require('electron-log')
    });
}

let mainWindow: BrowserWindow | null;
let connectionState: ConnectionState = ConnectionState.disconnected;
let pluginsStatus: { ns: string, started: boolean, core: boolean }[] = [];

const agentService = new AgentService();

const connectionSubscription = agentService.connectionObservable.subscribe((state) => {
    connectionState = state;
    mainWindow?.webContents.send('connection', connectionState);
});
const pluginSubscription = agentService.pluginStatus.subscribe(plugins => {
    pluginsStatus = plugins.map(plugin => ({ ns: plugin.ns, started: plugin.started, core: false }));
    pluginsStatus = agentService.getCorePlugins().map(plugin => ({ ns: plugin.ns || "", started: true, core: true })).concat(pluginsStatus);
    mainWindow?.webContents.send('pluginStatus', pluginsStatus);
});
agentService.init();

const createWindow = (): void => {

    // Add CSP headers
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [contentSecurityPolicy]
            }
        })
    });

    // Create the browser window.
    mainWindow = new BrowserWindow({
        height: 950,
        width: 950,
        autoHideMenuBar: true,
        webPreferences: {
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
        },
    });

    // Allow external links to navigate
    mainWindow.webContents.on('will-navigate', (e, url) => {
        // make sure local urls stay in electron perimeter
        if ('file://' === url.substring(0, 'file://'.length) || url.startsWith('http://localhost:3000')) {
            return;
        }

        // and open every other protocols on the browser      
        e.preventDefault();
        shell.openExternal(url);
    });

    // and load the index.html of the app.
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    // Open the DevTools.
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }

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
    ipcMain.handle('getAgentData', async () => await firstValueFrom(agentService.dataObservable));
    ipcMain.handle('updateData', (_, agentData: AgentData) => agentService.updateData(agentData));
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

app.on('before-quit', () => {
    connectionSubscription.unsubscribe();
    pluginSubscription.unsubscribe();
    agentService.stopAllPlugins();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
