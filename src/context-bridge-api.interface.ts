import { AgentData } from "@launch-deck/common"
import { IpcRendererEvent } from "electron"

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
