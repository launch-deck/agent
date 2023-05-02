import { combineLatest, firstValueFrom, map, filter, Observable, shareReplay, Subscription } from "rxjs";
import type { ClientSettings, ClientTile, Command, Plugin } from "@launch-deck/common";
import { AgentHubService } from "./agent-hub.service";
import { CommandService } from "./command.service";
import { DataService } from "./data.service";
import { PluginService } from "./plugin.service";
import { SettingsService } from "./settings.service";
import { EventService } from "./event.service";
import { ActiveWindowService } from "./active-window.service";
import { log } from 'electron-log';
import { AgentData, Settings, Tile } from "../interfaces";

export class AgentService {

    private readonly client: AgentHubService;
    private readonly commandService: CommandService;
    private readonly dataService: DataService;
    private readonly pluginService: PluginService;
    private readonly settingsService: SettingsService;
    private readonly eventService: EventService;
    private readonly window: ActiveWindowService;

    readonly dataObservable: Observable<AgentData>;
    private dataSubscription?: Subscription;

    public get connectionObservable() {
        return this.client.connectionObservable;
    };

    public get pluginStatus() {
        return this.pluginService.pluginStatus;
    }

    public get eventObservable() {
        return this.eventService.events;
    }

    constructor() {
        this.client = new AgentHubService();
        this.dataService = new DataService();
        this.pluginService = new PluginService();
        this.window = new ActiveWindowService();
        this.commandService = new CommandService(this.pluginService);
        this.settingsService = new SettingsService(this.pluginService);
        this.eventService = new EventService(this.pluginService, this.window);

        // Set up the data observable to combine data from plugins
        this.dataObservable = this.dataService.observeData().pipe(
            map(agentData => {
                // Add plugin settings into the data
                agentData.settings = this.settingsService.getAgentDataSettings(agentData);
                return agentData;
            }),
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
                this.eventService.events.pipe(
                    filter(event => event.ns === 'activeWindow'),
                    map(event => event.value)
                )
            ]).subscribe(async ([{ sortedTiles, clientSettings }, activeWindow]) => {

                log("Sending data");

                const tiles: ClientTile[] = sortedTiles.map(tile => ({
                    id: tile.id,
                    name: tile.name,
                    icon: tile.icon,
                    color: tile.color,
                    parentId: tile.parentId,
                    active: activeWindow?.toLowerCase() === tile.processName?.toLowerCase()
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

    public async togglePlugin(ns: string): Promise<void> {
        this.pluginService.togglePlugin(ns);
    }

    public stopAllPlugins(): void {
        this.pluginService.stopAllPlugins();
    }

    public getCorePlugins(): Plugin[] {
        return this.pluginService.getCorePlugins();
    }

    public async getAvailableCommands(): Promise<Command[]> {
        return await this.commandService.getCommands();
    }

    public updateData(agentData: AgentData): void {
        this.dataService.saveData(agentData);
    }

    public async updateSettings(settings: Settings): Promise<Settings> {
        const data = await firstValueFrom(this.dataService.observeData());
        data.settings = settings;
        this.dataService.saveData(data);
        return settings;
    };

    public async upsertTile(tile: Tile): Promise<Tile> {
        const data = await firstValueFrom(this.dataService.observeData());

        tile = {
            ...tile
        }

        if (tile.id === '0') {
            var length = data.tiles.push(tile) + 1;
            tile.id = length.toString();
            data.tileOrder.push(tile.id);
        } else {
            data.tiles = data.tiles.map(t => {
                if (t.id === tile.id) {
                    return tile;
                }
                return t;
            });
        }

        this.dataService.saveData(data);
        return tile;
    };

    public async removeTile(id: string): Promise<string> {
        const data = await firstValueFrom(this.dataService.observeData());

        var index = data.tiles.findIndex(t => t.id === id);
        if (index >= 0) {
            data.tiles.splice(index, 1);
        }

        this.dataService.saveData(data);
        return id;
    };

    public async updateSortOrder(order: string[]): Promise<string[]> {
        const data = await firstValueFrom(this.dataService.observeData());

        data.tileOrder = order;

        this.dataService.saveData(data);
        return order;
    };

    private unsubscribe(): void {
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe();
        }
    }
}
