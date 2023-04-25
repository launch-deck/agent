// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { ipcRenderer, contextBridge, IpcRendererEvent } from "electron";
import { ContextBridgeApi, Settings, Tile } from "./interfaces";
import { PluginWorker } from "./agent/plugin-worker.class";

const exposedApi: ContextBridgeApi = {

    // Invocations
    connect: (serverAddress: string, agentCode: string) => ipcRenderer.invoke('connect', serverAddress, agentCode),
    disconnect: () => ipcRenderer.invoke('disconnect'),
    togglePlugin: (ns: string) => ipcRenderer.invoke('togglePlugin', ns),
    getConnectionState: () => ipcRenderer.invoke('getConnectionState'),
    getAvailableCommands: () => ipcRenderer.invoke('getAvailableCommands'),
    getPluginStatus: () => ipcRenderer.invoke('getPluginStatus'),
    getAgentData: () => ipcRenderer.invoke('getAgentData'),
    updateSettings: (settings: Settings) => ipcRenderer.invoke('updateSettings', settings),
    upsertTile: (tile: Tile) => ipcRenderer.invoke('upsertTile', tile),
    removeTile: (id: string) => ipcRenderer.invoke('removeTile', id),
    updateSortOrder: (order: string[]) => ipcRenderer.invoke('updateSortOrder', order),

    // Events
    onConnection: (listener: (event: IpcRendererEvent, connected: number) => void) => ipcRenderer.on('connection', listener),
    onPluginStatus: (listener: (event: IpcRendererEvent, plugins: PluginWorker[]) => void) => ipcRenderer.on('pluginStatus', listener)
}

contextBridge.exposeInMainWorld("api", exposedApi);
