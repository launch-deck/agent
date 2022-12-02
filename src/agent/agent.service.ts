import { firstValueFrom, map, Observable, Subscription, switchAll } from "rxjs";
import type { AgentData } from "@launch-deck/common";
import { AgentHubService } from "./agent-hub.service";
import { CommandService } from "./command.service";
import { DataService } from "./data.service";
import { PluginService } from "./plugin.service";
import { SettingsService } from "./settings.service";
import { StateService } from "./state.service";
import { ActiveWindowService } from "./active-window.service";

export class AgentService {

    private readonly client: AgentHubService;
    private readonly commandService: CommandService;
    private readonly dataService: DataService;
    private readonly pluginService: PluginService;
    private readonly settingsService: SettingsService;
    private readonly stateService: StateService;
    private readonly window: ActiveWindowService;

    private readonly dataObservable: Observable<AgentData>;
    private dataSubscription?: Subscription;
    private stateSubscription?: Subscription;

    public get connectionObservable() {
        return this.client.connectionObservable;
    };

    public get pluginStatus() {
        return this.pluginService.pluginStatus;
    }

    constructor() {
        this.client = new AgentHubService();
        this.dataService = new DataService();
        this.pluginService = new PluginService();
        this.window = new ActiveWindowService();
        this.commandService = new CommandService(this.pluginService);
        this.settingsService = new SettingsService(this.pluginService);
        this.stateService = new StateService(this.pluginService, this.window);

        // Set up the data observable to combine data from plugins
        this.dataObservable = this.dataService.observeData().pipe(
            map(async agentData => {

                // Add plugin settings into the data
                agentData.settings = this.settingsService.getAgentDataSettings(agentData);

                // Add plugin commands to the data
                agentData.commands = await this.commandService.getCommands();
                return agentData;
            }),
            switchAll()
        );

        // Whenever there is new data, save it
        this.client.data.subscribe(agentData => {
            console.log("OnData");
            this.dataService.saveData(agentData);
        });

        // Whenever there are commands, handle them
        this.client.commands.subscribe(async commands => {
            console.log("OnCommands: " + commands.length);
            await this.commandService.handleCommands(commands);
        });

        // Whenever there are commands, handle them
        this.client.tileCommands.subscribe(async tileId => {
            console.log("OnTileCommands: " + tileId);

            var data: AgentData = await firstValueFrom(this.dataService.observeData());
            var commands = data.tiles.find(tile => tileId === tile.id)?.commands;

            if (commands != null) {
                await this.commandService.handleCommands(commands);
            }
            else {
                console.log("No Tile Commands Found: " + tileId);
            }
        });
    }

    public init(): void {
        this.dataService.loadData();
        this.pluginService.loadPlugins();
    }

    public async getStoredConnectionSettings(): Promise<{ serverAddress: string, agentCode: string }> {
        const data = await firstValueFrom(this.dataService.observeData());
        return {
            serverAddress: data.serverAddress,
            agentCode: data.agentCode
        }
    }

    public async connect(serverAddress: string, agentCode: string): Promise<void> {

        // Replace the subscriptions with new ones for the new connection
        this.unsubscribe();

        try {

            // Connect
            await this.client.connect(serverAddress, agentCode);

            // Store the connection data
            const data = await firstValueFrom(this.dataService.observeData());
            data.serverAddress = serverAddress;
            data.agentCode = agentCode;
            this.dataService.saveData(data);

            // Whenever the data changes, send it to the clients
            this.dataSubscription = this.dataObservable.subscribe(async agentData => {
                console.log("Sending data");
                await this.client.sendData(agentData);
            });

            // Whenever the state changes, send it to the clients
            this.stateSubscription = this.stateService.observeState().subscribe(async agentState => {
                console.log("Sending state");
                await this.client.sendState(agentState);
            });

        } catch (ignored) {
            // This is ignored because it is logged upstream and the UI will respond to allow trying again
        }
    }

    public disconnect(): void {
        this.unsubscribe();
        this.client.stopConnection();
    }

    public startPlugin(ns: string): void {
        this.pluginService.startPlugin(ns);
    }

    public stopPlugin(ns: string): void {
        this.pluginService.stopPlugin(ns);
    }

    public stopAllPlugins(): void {
        this.pluginService.stopAllPlugins();
    }

    private unsubscribe(): void {
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe();
        }
        if (this.stateSubscription) {
            this.stateSubscription.unsubscribe();
        }
    }
}
