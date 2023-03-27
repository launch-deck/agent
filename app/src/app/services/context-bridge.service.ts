import { Injectable } from '@angular/core';
import { AgentData } from '@launch-deck/common';
import { Observable, ReplaySubject } from 'rxjs';
import { ContextBridgeApi } from "../../../../src/context-bridge-api.interface";

export interface LoadedPlugin {
    ns: string,
    started: boolean,
    core: boolean
};

@Injectable({
    providedIn: 'root'
})
export class ContextBridgeService {

    private readonly api: ContextBridgeApi;
    private connectionSubject = new ReplaySubject<number>(1);
    private pluginStatusSubject = new ReplaySubject<LoadedPlugin[]>(1);

    public get connection(): Observable<number> {
        return this.connectionSubject;
    };

    public get pluginStatus(): Observable<LoadedPlugin[]> {
        return this.pluginStatusSubject;
    };

    constructor() {
        this.api = (window as any).api as ContextBridgeApi;

        this.api.onConnection((_: any, state: number) => {
            this.connectionSubject.next(state);
        });

        this.api.onPluginStatus((_: any, plugins: LoadedPlugin[]) => {
            this.pluginStatusSubject.next(plugins);
        });
    }

    async connect(serverAddress: string, agentCode: string): Promise<void> {
        await this.api.connect(serverAddress, agentCode);
    }

    async disconnect(): Promise<void> {
        await this.api.disconnect();
    }

    async startPlugin(ns: string): Promise<void> {
        await this.api.startPlugin(ns);
    }

    async stopPlugin(ns: string): Promise<void> {
        await this.api.stopPlugin(ns);
    }

    async getConnectionState(): Promise<number> {
        return await this.api.getConnectionState();
    }

    async getConnectionSettings(): Promise<{ serverAddress: string, agentCode: string }> {
        return await this.api.getConnectionSettings();
    }

    async getPluginStatus(): Promise<LoadedPlugin[]> {
        return await this.api.getPluginStatus();
    }

    async getAgentData(): Promise<AgentData> {
        return await this.api.getAgentData();
    }

    async updateData(agentData: AgentData): Promise<void> {
        await this.api.updateData(agentData);
    }

}
