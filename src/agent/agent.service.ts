import { combineLatest, concatMap, firstValueFrom, map, Observable, of, shareReplay, Subscription, switchAll } from "rxjs";
import type { ClientSettings, ClientTile, Plugin } from "@launch-deck/common";
import { AgentHubService } from "./agent-hub.service";
import { CommandService } from "./command.service";
import { DataService } from "./data.service";
import { PluginService } from "./plugin.service";
import { SettingsService } from "./settings.service";
import { StateService } from "./state.service";
import { ActiveWindowService } from "./active-window.service";
import { log } from 'electron-log';
import { AgentData } from "../interfaces";

export class AgentService {

    private readonly client: AgentHubService;
    private readonly commandService: CommandService;
    private readonly dataService: DataService;
    private readonly pluginService: PluginService;
    private readonly settingsService: SettingsService;
    private readonly stateService: StateService;
    private readonly window: ActiveWindowService;

    readonly dataObservable: Observable<AgentData>;
    private dataSubscription?: Subscription;

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
            map(agentData => {
                // Add plugin settings into the data
                agentData.settings = this.settingsService.getAgentDataSettings(agentData);
                return agentData;
            }),
            concatMap((agentData: AgentData, index: number) => index === 0
                ? of(agentData).pipe(
                    map(async (agentData) => {
                        // Add plugin commands to the data only the first time the data is loaded
                        agentData.commands = await this.commandService.getCommands();
                        return agentData;
                    }),
                    switchAll()
                )
                : of(agentData)
            ),
            shareReplay(1)
        );

        // Whenever there are commands, handle them
        this.client.tileCommands.subscribe(async tileId => {
            log("OnTileCommands: " + tileId);

            var data: AgentData = await firstValueFrom(this.dataService.observeData());
            var commands = data.tiles.find(tile => tileId === tile.id)?.commands;

            if (commands != null) {
                await this.commandService.handleCommands(commands);
            }
            else {
                log("No Tile Commands Found: " + tileId);
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
            this.dataSubscription = combineLatest([
                this.dataObservable.pipe(map(agentData => {
                    return {
                        sortedTiles: agentData.tiles.sort((a, b) => {
                            var ia = agentData.tileOrder.indexOf(a.id);
                            var ib = agentData.tileOrder.indexOf(b.id);
                            return ia - ib;
                        }), clientSettings: agentData.settings.clientSettings
                    };
                })),
                this.stateService.state
            ]).subscribe(async ([{ sortedTiles, clientSettings }, agentState]) => {

                log("Sending data");

                // Determine based on events if a tile should be active
                const currentProcessName = agentState.coreState?.activeWindow;

                const tiles: ClientTile[] = sortedTiles.map(tile => ({
                    id: tile.id,
                    name: tile.name,
                    icon: tile.icon,
                    color: tile.color,
                    parentId: tile.parentId,
                    active: currentProcessName?.toLowerCase() === tile.processName?.toLowerCase()
                }));

                await this.client.sendData({
                    tiles,
                    clientSettings: clientSettings as ClientSettings
                });
            });

        } catch (e) {
            log('Agent Service failed to connect', e);
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

    public getCorePlugins(): Plugin[] {
        return this.pluginService.getCorePlugins();
    }

    public updateData(agentData: AgentData): void {
        this.dataService.saveData(agentData);
    }

    private unsubscribe(): void {
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe();
        }
    }
}
