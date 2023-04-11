import { Observable, ReplaySubject, Subject } from "rxjs";
import ElectronStore from 'electron-store';
import { log } from 'electron-log';
import { AgentData } from "../interfaces";

export class DataService {

    private static readonly STORAGE_KEY = "data";

    private readonly store: ElectronStore;
    private readonly dataSubject: Subject<AgentData> = new ReplaySubject<AgentData>(1);

    constructor() {
        this.store = new ElectronStore();
    }

    public observeData(): Observable<AgentData> {
        return this.dataSubject;
    }

    /**
     * Loads stored data from storage
     * 
     * @returns The stored data
     */
    public loadData(): AgentData {

        log("Loading data from storage");

        let agentData = this.store.get(DataService.STORAGE_KEY) as AgentData;

        if (!agentData) {
            agentData = {} as AgentData;
            this.store.set(DataService.STORAGE_KEY, agentData);
        }

        this.dataSubject.next(agentData);
        return agentData;
    }

    /**
     * Save to storage and trigger the data subject. Ignore transient data.
     * 
     * @param agentData the data to save
     */
    public saveData(agentData: AgentData): void {
        log("Saving data to storage");

        let saveData = {} as AgentData;
        saveData.serverAddress = agentData.serverAddress;
        saveData.agentCode = agentData.agentCode;
        saveData.tiles = agentData.tiles;
        saveData.settings = agentData.settings;
        saveData.tileOrder = agentData.tileOrder;

        this.store.set(DataService.STORAGE_KEY, saveData);

        this.dataSubject.next(agentData);
    }
}
