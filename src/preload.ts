// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { AgentData } from "@launch-deck/common";
import { ipcRenderer, contextBridge, IpcRendererEvent } from "electron";
import { ContextBridgeApi } from "./context-bridge-api.interface";
import { PluginWorker } from "./agent/plugin-worker.class";

const exposedApi: ContextBridgeApi = {

    // Invocations
    connect: (serverAddress: string, agentCode: string) => ipcRenderer.invoke('connect', serverAddress, agentCode),
    disconnect: () => ipcRenderer.invoke('disconnect'),
    startPlugin: (ns: string) => ipcRenderer.invoke('startPlugin', ns),
    stopPlugin: (ns: string) => ipcRenderer.invoke('stopPlugin', ns),
    getConnectionState: () => ipcRenderer.invoke('getConnectionState'),
    getConnectionSettings: () => ipcRenderer.invoke('getConnectionSettings'),
    getPluginStatus: () => ipcRenderer.invoke('getPluginStatus'),
    getAgentData: () => ipcRenderer.invoke('getAgentData'),
    updateData: (agentData: AgentData) => ipcRenderer.invoke('updateData', agentData),

    // Events
    onConnection: (listener: (event: IpcRendererEvent, connected: number) => void) => ipcRenderer.on('connection', listener),
    onPluginStatus: (listener: (event: IpcRendererEvent, plugins: PluginWorker[]) => void) => ipcRenderer.on('pluginStatus', listener)
}

contextBridge.exposeInMainWorld("api", exposedApi);
