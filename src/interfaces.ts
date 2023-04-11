import { IpcRendererEvent } from "electron"
import { ClientSettings, Command } from "@launch-deck/common";

export interface ContextBridgeApi {
    connect: (serverAddress: string, agentCode: string) => Promise<void>,
    disconnect: () => Promise<void>,
    startPlugin: (ns: string) => Promise<void>,
    stopPlugin: (ns: string) => Promise<void>,
    getConnectionState: () => Promise<number>,
    getConnectionSettings: () => Promise<{ serverAddress: string, agentCode: string }>,
    getPluginStatus: () => Promise<any[]>,
    getAgentData: () => Promise<AgentData>,
    updateData: (agentData: AgentData) => Promise<void>,
    onConnection: (listener: (event: IpcRendererEvent, connected: number) => void) => void,
    onPluginStatus: (listener: (event: IpcRendererEvent, plugins: any[]) => void) => void
}

export interface AgentData {
    serverAddress: string;
    agentCode: string;
    tiles: Tile[];
    settings: Settings;
    tileOrder: string[];
    commands: Command[];
}

export interface AgentState {
    coreState: { [key: string]: any }
    pluginState: { [key: string]: { [key: string]: any } }
}

export interface Settings {
    coreSettings: { [key: string]: string }
    pluginSettings: { [key: string]: { [key: string]: string } }
    clientSettings: ClientSettings
}

export interface Tile {
    id: string,
    name: string;
    processName?: string;
    icon?: string;
    color?: string;
    commands: Command[];
    parentId?: string;
    hasChildren?: boolean;
}
