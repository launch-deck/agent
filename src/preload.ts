// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { ipcRenderer, contextBridge, IpcRendererEvent } from "electron";

export type ContextBridgeApi = {
    connect: (serverAddress: string, agentCode: string) => void,
    disconnect: () => void,
    getConnectionState: () => Promise<number>,
    getConnectionSettings: () => Promise<{ serverAddress: string, agentCode: string }>,
    onConnection: (listener: (event: IpcRendererEvent, connected: number) => void) => void
}

const exposedApi: ContextBridgeApi = {
    connect: (serverAddress: string, agentCode: string) => ipcRenderer.send('connect', serverAddress, agentCode),
    disconnect: () => ipcRenderer.send('disconnect'),
    getConnectionState: async () => await ipcRenderer.invoke('getConnectionState'),
    getConnectionSettings: async () => await ipcRenderer.invoke('getConnectionSettings'),
    onConnection: (listener: (event: IpcRendererEvent, connected: number) => void) => ipcRenderer.on('connection', listener)
}

contextBridge.exposeInMainWorld("api", exposedApi);
