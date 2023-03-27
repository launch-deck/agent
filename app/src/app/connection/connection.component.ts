import { Component, OnInit } from '@angular/core';
import { ContextBridgeService } from '../services/context-bridge.service';

@Component({
    selector: 'app-connection',
    templateUrl: './connection.component.html',
    styleUrls: ['./connection.component.css']
})
export class ConnectionComponent implements OnInit {

    serverAddress: string = "";
    agentCode: string = "";
    connectionState: number = 0;

    constructor(private contextBridge: ContextBridgeService) { }

    ngOnInit(): void {
        this.contextBridge.connection.subscribe(state => {
            if (state === 2 && this.connectionState !== 2) {
                console.log(`Connected to ${this.serverAddress} Successfully`);
            }
            if (state === 0 && this.connectionState !== 0) {
                console.log(`Disconnected from ${this.serverAddress}`);
            }
            this.connectionState = state;
        });

        this.contextBridge.getConnectionState().then((state: number) => {
            this.connectionState = state;
        });
        this.contextBridge.getConnectionSettings().then((settings: { serverAddress: string, agentCode: string }) => {
            this.serverAddress = settings.serverAddress;
            this.agentCode = settings.agentCode;
        });
    }

    async connect(): Promise<void> {
        if (this.connectionState > 0) {
            await this.contextBridge.disconnect();
            return;
        }

        if (!this.serverAddress || !this.agentCode) {
            return;
        }

        try {
            await this.contextBridge.connect(this.serverAddress, this.agentCode);
        } catch (e) {
            console.log("Failed to connect to ${serverURL}", e);
        }
    }

}
