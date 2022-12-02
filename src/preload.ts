// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { ipcRenderer, contextBridge, IpcRendererEvent } from "electron";
import { PluginWorker } from "./agent/plugin-worker.class";

export type ContextBridgeApi = {
    connect: (serverAddress: string, agentCode: string) => void,
    disconnect: () => void,
    startPlugin: (ns: string) => void,
    stopPlugin: (ns: string) => void,
    getConnectionState: () => Promise<number>,
    getConnectionSettings: () => Promise<{ serverAddress: string, agentCode: string }>,
    getPluginStatus: () => Promise<PluginWorker[]>,
    onConnection: (listener: (event: IpcRendererEvent, connected: number) => void) => void,
    onPluginStatus: (listener: (event: IpcRendererEvent, plugins: PluginWorker[]) => void) => void
}

const exposedApi: ContextBridgeApi = {
    connect: (serverAddress: string, agentCode: string) => ipcRenderer.invoke('connect', serverAddress, agentCode),
    disconnect: () => ipcRenderer.invoke('disconnect'),
    startPlugin: (ns: string) => ipcRenderer.invoke('startPlugin', ns),
    stopPlugin: (ns: string) => ipcRenderer.invoke('stopPlugin', ns),
    getConnectionState: async () => await ipcRenderer.invoke('getConnectionState'),
    getConnectionSettings: async () => await ipcRenderer.invoke('getConnectionSettings'),
    getPluginStatus: async () => await ipcRenderer.invoke('getPluginStatus'),
    onConnection: (listener: (event: IpcRendererEvent, connected: number) => void) => ipcRenderer.on('connection', listener),
    onPluginStatus: (listener: (event: IpcRendererEvent, plugins: PluginWorker[]) => void) => ipcRenderer.on('pluginStatus', listener)
}

contextBridge.exposeInMainWorld("api", exposedApi);
