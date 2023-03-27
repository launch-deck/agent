import { ReplaySubject, Subject, firstValueFrom, Observable, map } from 'rxjs';
import { Injectable } from '@angular/core';
import type { AgentData, Settings, Tile } from "@launch-deck/common";
import { ContextBridgeService } from './context-bridge.service';

@Injectable({
    providedIn: 'root'
})
export class DataService {

    public get data(): Observable<AgentData> {
        return this.dataReplay.pipe(map(data => this.clone(data)));
    };

    private dataReplay: Subject<AgentData> = new ReplaySubject<AgentData>(1);

    constructor(private contextBridge: ContextBridgeService) {
        this.contextBridge.getAgentData().then(data => this.dataReplay.next(data));
    }

    public async refreshData(): Promise<AgentData> {
        const data = await this.contextBridge.getAgentData();
        this.dataReplay.next(data);
        return data;
    }

    /**
     * Updates the settings in the data and sends the data to the agent to save
     * 
     * @param settings the settings to save
     */
    public async updateSettings(settings: Settings): Promise<void> {
        var data = await firstValueFrom(this.dataReplay);

        data.settings = settings;

        await this.contextBridge.updateData(data);
        await this.refreshData();
    }

    /**
     * Updates the tile order in the data and sends the data to the agent to save
     * 
     * @param order the new tile order
     */
    public async updateTileOrder(order: string[]): Promise<void> {
        var data = await firstValueFrom(this.dataReplay);

        data.tileOrder = order;

        await this.contextBridge.updateData(data);
        await this.refreshData();
    }

    /**
     * Adds a new tile to the data and sends the data to the agent to save
     * 
     * @param tile the tile to create
     */
    public async createTile(tile: Tile): Promise<void> {
        var data = await firstValueFrom(this.dataReplay);

        var length = data.tiles.push(tile) + 1;
        tile.id = length.toString();

        await this.contextBridge.updateData(data);
        await this.refreshData();
    }

    /**
     * Updates an existing tile in the data and sends the data to the agent to save
     * 
     * @param tile the tile to update
     */
    public async updateTile(tile: Tile): Promise<void> {
        var data = await firstValueFrom(this.dataReplay);

        var index = data.tiles.findIndex(t => t.id === tile.id);
        if (index >= 0) {
            data.tiles.splice(index, 1, tile);
        }

        await this.contextBridge.updateData(data);
        await this.refreshData();
    }

    /**
     * Removes a tile by id in the data and sends the data to the agent to save
     * 
     * @param tileId the id of the tile to remove
     */
    public async deleteTile(tileId: string): Promise<void> {
        var data = await firstValueFrom(this.dataReplay);

        var index = data.tiles.findIndex(t => t.id === tileId);
        if (index >= 0) {
            data.tiles.splice(index, 1);
        }

        await this.contextBridge.updateData(data);
        await this.refreshData();
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
