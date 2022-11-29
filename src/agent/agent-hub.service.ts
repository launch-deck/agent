import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { Observable, Subject, ReplaySubject, firstValueFrom } from "rxjs";
import type { AgentData, AgentState, Command } from "@launch-deck/common";

export enum ConnectionState {
    disconnected,
    connecting,
    connected
}

export class AgentHubService {

    private static readonly HUB_NAME: string = "agent";

    private connection: HubConnection | null = null;
    private connectionSubject: Subject<HubConnection> = new ReplaySubject(1);

    private dataSubject: Subject<AgentData> = new Subject<AgentData>();
    private commandsSubject: Subject<Command[]> = new Subject<Command[]>();
    private tileCommandSubject: Subject<string> = new Subject<string>();

    public get data(): Observable<AgentData> {
        return this.dataSubject;
    }

    public get commands(): Observable<Command[]> {
        return this.commandsSubject;
    }

    public get tileCommands(): Observable<string> {
        return this.tileCommandSubject;
    }

    public readonly connectionObservable: Subject<ConnectionState> = new Subject<ConnectionState>();

    public async connect(serverAddress: string, agentCode: string): Promise<void> {

        this.connectionObservable.next(ConnectionState.connecting);

        const url = new URL(AgentHubService.HUB_NAME, serverAddress).href;
        console.log(`Connecting to: ${url}`);

        this.connection = new HubConnectionBuilder()
            .withUrl(url)
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: () => 5000
            })
            .build();

        this.connection.onclose(() => {
            this.connectionSubject = new ReplaySubject(1);
            this.connectionObservable.next(ConnectionState.disconnected);
        });

        // Clear the connection subject until the connection is restarted to delay invocation until connection is established
        this.connection.onreconnecting(() => {
            this.connectionSubject = new ReplaySubject(1);
            this.connectionObservable.next(ConnectionState.connecting);
        });

        // On reconnect, use the new connection for invocation. Request data in case of changes while disconnected
        this.connection.onreconnected(async () => {
            if (this.connection) {
                this.connectionSubject.next(this.connection);
            }
            await this.invoke("Connect", agentCode);
            this.connectionObservable.next(ConnectionState.connected);
        });

        // Watch for server events
        this.connection.on('Data', (data: AgentData) => this.dataSubject.next(data));
        this.connection.on('Commands', (commands: Command[]) => this.commandsSubject.next(commands));
        this.connection.on('TileCommands', (tileId: string) => this.tileCommandSubject.next(tileId));

        try {
            await this.connection.start();
            this.connectionSubject.next(this.connection);
            await this.invoke("Connect", agentCode);
            console.log(`Connected with code: ${agentCode}`);
            this.connectionObservable.next(ConnectionState.connected);
        } catch (e) {
            console.log("Failed to connect to server", e);
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
    public async sendData(data: AgentData): Promise<void> {
        try {
            await this.invoke("SendData", data);
            console.log(`Data Sent`, data);
        } catch (e) {
            console.log(`Failed to send data`, data, e);
        }
    }

    /**
     * Sends the state to clients
     * 
     * @param state the state
     */
    public async sendState(state: AgentState): Promise<void> {
        try {
            await this.invoke("SendState", state);
            console.log(`State Sent`, state);
        } catch (e) {
            console.log(`Failed to send state`, state, e);
        }
    }

    /**
     * Sends triggers to the clients
     * TODO: This should be driven by plugins
     * 
     * @param trigger the trigger
     */
    public async sendTrigger(trigger: string): Promise<void> {
        try {
            await this.invoke("SendTrigger", trigger);
            console.log(`Trigger Sent`, trigger);
        } catch (e) {
            console.log(`Failed to send trigger`, trigger, e);
        }
    }

    private async invoke(name: string, ...args: any[]): Promise<any> {

        // Wait for connection before sending
        await firstValueFrom(this.connectionSubject);

        return await this.connection?.invoke(name, ...args);
    }

}
