import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { Observable, Subject, ReplaySubject, firstValueFrom } from "rxjs";
import { log, error } from 'electron-log';
import ws from 'ws';
import { ClientData } from './client-data.interface';

export enum ConnectionState {
    disconnected,
    connecting,
    connected
}

export class AgentHubService {

    private static readonly HUB_NAME: string = "agent";

    private connection: HubConnection | null = null;
    private connectionSubject: Subject<HubConnection> = new ReplaySubject(1);
    private tileCommandSubject: Subject<string> = new Subject<string>();

    public get tileCommands(): Observable<string> {
        return this.tileCommandSubject;
    }

    public readonly connectionObservable: Subject<ConnectionState> = new Subject<ConnectionState>();

    public async connect(serverAddress: string, agentCode: string): Promise<void> {

        this.connectionObservable.next(ConnectionState.connecting);

        const url = new URL(AgentHubService.HUB_NAME, serverAddress).href;
        log(`Connecting to: ${url}`);

        this.connection = new HubConnectionBuilder()
            .withUrl(url)
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: () => 5000
            })
            .build();

        this.connection.onclose(() => {
            log(`Connection Closed`);
            this.connectionSubject = new ReplaySubject(1);
            this.connectionObservable.next(ConnectionState.disconnected);
        });

        // Clear the connection subject until the connection is restarted to delay invocation until connection is established
        this.connection.onreconnecting(() => {
            log(`Reconnecting`);
            this.connectionSubject = new ReplaySubject(1);
            this.connectionObservable.next(ConnectionState.connecting);
        });

        // On reconnect, use the new connection for invocation. Request data in case of changes while disconnected
        this.connection.onreconnected(async () => {
            log(`Reconnected`);
            if (this.connection) {
                this.connectionSubject.next(this.connection);
            }
            await this.invoke("Connect", agentCode);
            this.connectionObservable.next(ConnectionState.connected);
        });

        // Watch for server events
        this.connection.on('TileCommands', (tileId: string) => this.tileCommandSubject.next(tileId));

        try {
            await this.connection.start();
            log(`Connection Started`);
            this.connectionSubject.next(this.connection);
            await this.invoke("Connect", agentCode);
            log(`Connected with code: ${agentCode}`);
            this.connectionObservable.next(ConnectionState.connected);
        } catch (e) {
            log("Failed to connect to server", e);
            this.stopConnection();
            this.connectionObservable.next(ConnectionState.disconnected);
            throw e;
        }
    }

    public stopConnection(): void {
        this.connection?.stop();
    }

    /**
     * Sends updated data to clients
     * 
     * @param data the data
     */
    public async sendData(data: ClientData): Promise<void> {
        try {
            await this.invoke("SendData", data);
            log(`Data Sent`, data);
        } catch (e) {
            error(`Failed to send data`, data, e);
        }
    }

    private async invoke(name: string, ...args: any[]): Promise<any> {

        // Wait for connection before sending
        await firstValueFrom(this.connectionSubject);

        return await this.connection?.invoke(name, ...args);
    }

}
