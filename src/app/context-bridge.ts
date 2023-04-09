import { AgentData, Command, Settings, Tile } from "@launch-deck/common";
import { ContextBridgeApi } from "../context-bridge-api.interface";

const contextBridge = (window as any).api as ContextBridgeApi;

export interface LoadedPlugin {
    ns: string,
    started: boolean,
    core: boolean
};

class ContextBridge {

    constructor() {
    }

    public async connect(serverAddress: string, agentCode: string): Promise<void> {
        await contextBridge.connect(serverAddress, agentCode);
    }

    public async disconnect(): Promise<void> {
        await contextBridge.disconnect();
    }

    public async getConnectionState(): Promise<number> {
        return await contextBridge.getConnectionState();
    };

    public async getConnectionSettings(): Promise<{ serverAddress: string, agentCode: string }> {
        return await contextBridge.getConnectionSettings();
    }

    public onConnection(callback: (status: number) => void): void {
        contextBridge.onConnection((e, status) => callback(status));
    }

    public async getLoadedPlugins(): Promise<LoadedPlugin[]> {
        return await contextBridge.getPluginStatus();
    }

    public async togglePlugin(plugin: LoadedPlugin): Promise<void> {
        plugin.started ? await contextBridge.stopPlugin(plugin.ns) : await contextBridge.startPlugin(plugin.ns);
    }

    public async getData(): Promise<AgentData> {
        return await contextBridge.getAgentData();
    }

    /**
     * Gets all tiles
     * 
     * @returns All tiles in sort order
     */
    public async getTiles(): Promise<Tile[]> {
        const data = await this.getData();

        return data.tiles.sort((a, b) => {
            var ia = data.tileOrder.indexOf(a.id);
            var ib = data.tileOrder.indexOf(b.id);
            return ia - ib;
        });
    }

    /**
     * Gets the settings
     * 
     * @returns The settings
     */
    public async getSettings(): Promise<Settings> {
        var data = await this.getData();
        return data.settings;
    }

    /**
     * Updates the settings in the data and sends the data to the agent to save
     * 
     * @param settings the settings to save
     */
    public async updateSettings(settings: Settings): Promise<void> {
        var data = await this.getData();

        data.settings = settings;

        await contextBridge.updateData(data);
    }

    /**
     * Updates the tile order in the data and sends the data to the agent to save
     * 
     * @param order the new tile order
     */
    public async updateTileOrder(order: string[]): Promise<void> {
        var data = await this.getData();

        data.tileOrder = order;

        await contextBridge.updateData(data);
    }

    /**
     * Updates or creates a new tile to the data and sends the data to the agent to save
     * 
     * @param tile the tile to upsert
     */
    public async upsertTile(tile: Tile): Promise<void> {
        tile.id === '0' ? await this.createTile(tile) : await this.updateTile(tile);
    }

    /**
     * Adds a new tile to the data and sends the data to the agent to save
     * 
     * @param tile the tile to create
     */
    public async createTile(tile: Tile): Promise<void> {
        var data = await this.getData();

        var length = data.tiles.push(tile) + 1;
        tile.id = length.toString();
        data.tileOrder.push(tile.id);

        await contextBridge.updateData(data);
    }

    /**
     * Updates an existing tile in the data and sends the data to the agent to save
     * 
     * @param tile the tile to update
     */
    public async updateTile(tile: Tile): Promise<void> {
        var data = await this.getData();

        var index = data.tiles.findIndex(t => t.id === tile.id);
        if (index >= 0) {
            data.tiles.splice(index, 1, tile);
        }

        await contextBridge.updateData(data);
    }

    /**
     * Removes a tile by id in the data and sends the data to the agent to save
     * 
     * @param tileId the id of the tile to remove
     */
    public async deleteTile(tileId: string): Promise<void> {
        var data = await this.getData();

        var index = data.tiles.findIndex(t => t.id === tileId);
        if (index >= 0) {
            data.tiles.splice(index, 1);
        }

        await contextBridge.updateData(data);
    }

    /**
     * Gets all available commands in order
     */
    public async getAvailableCommands(): Promise<Command[]> {
        var data = await this.getData();

        return data.commands.sort((a, b) => {
            var order = a.class && b.class ? a.class.localeCompare(b.class) : 0;

            if (order === 0 && a.name && b.name) {
                order = a.name.localeCompare(b.name);
            }
            return order;
        });
    }

    /**
     * Clones an object using serialization
     * 
     * @param obj the object to clone
     * @returns the cloned object
     */
    public clone<T>(obj: T): T {
        return (JSON.parse(JSON.stringify(obj))) as T;
    }

}

export default new ContextBridge();
