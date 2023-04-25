import { Middleware, PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { v4 } from 'uuid';
import { AgentData, ContextBridgeApi, Settings, Tile } from "../../interfaces";
import { Command } from "@launch-deck/common";

const contextBridge = (window as any).api as ContextBridgeApi;

export interface LoadedPlugin {
    ns: string,
    started: boolean,
    core: boolean
};

export interface State {
    agentData: AgentData
    connectionState: ConnectionState
    loadedPlugins: LoadedPlugin[]
    availableCommands: Command[]
    selectedTile?: Tile
}

export enum ConnectionState {
    disconnected,
    connecting,
    connected
}

const initialState: State = {
    agentData: {
        tiles: [],
        tileOrder: [],
        serverAddress: 'https://launchdeck.davidpaulhamilton.net/',
        agentCode: v4(),
        settings: {
            coreSettings: {},
            pluginSettings: {},
            clientSettings: {
                backgroundImageUrl: '',
                tileAlpha: 1,
                tileBlur: 0,
                theme: 'dark'
            }
        }
    },
    connectionState: ConnectionState.disconnected,
    loadedPlugins: [],
    availableCommands: [],
    selectedTile: undefined
}

const clone = <T>(obj: T): T => {
    return (JSON.parse(JSON.stringify(obj))) as T;
}

const sortTiles = (data: AgentData): void => {
    data.tiles = data.tiles.sort((a, b) => {
        var ia = data.tileOrder.indexOf(a.id);
        var ib = data.tileOrder.indexOf(b.id);
        return ia - ib;
    });
}
const selectStateTile = (state: State, tile?: Tile) => {
    state.selectedTile = tile ? clone(tile) : undefined;
}
const reSelectTile = (state: State) => {
    if (state.selectedTile) {
        selectStateTile(state, state.agentData.tiles.find(tile => tile.id === (state.selectedTile as any).id));
    }
}
const selectTileById = (state: State, id?: string) => {
    selectStateTile(state, state.agentData.tiles.find(tile => tile.id === id));
}

const agentDataSlice = createSlice({
    name: 'agentData',
    initialState,
    reducers: {
        selectTile: (state, action: PayloadAction<Tile | undefined>) => selectStateTile(state, action.payload),
        resetSelectedTile: (state) => reSelectTile(state),
        updateSelectedTile: (state, action: PayloadAction<Tile>) => {
            state.selectedTile = action.payload;
        },
        updateSettings: (state, action: PayloadAction<Settings>) => {
            state.agentData.settings = action.payload;
        },
        setServerAddress: (state, action: PayloadAction<string>) => {
            state.agentData.serverAddress = action.payload;
        },
        setAgentCode: (state, action: PayloadAction<string>) => {
            state.agentData.agentCode = action.payload;
        },
        setConnectionState: (state, action: PayloadAction<ConnectionState>) => {
            state.connectionState = action.payload;
        },
        setLoadedPlugins: (state, action: PayloadAction<LoadedPlugin[]>) => {
            state.loadedPlugins = action.payload;
        }
    },
    extraReducers(builder) {
        builder
            .addCase(getConnectionState.fulfilled, (state, action) => {
                state.connectionState = action.payload;
            })
            .addCase(getLoadedPlugins.fulfilled, (state, action) => {
                state.loadedPlugins = action.payload;
            })
            .addCase(fetchData.fulfilled, (state, action) => {

                // Update the entire agent data state
                state.agentData = action.payload;
                sortTiles(state.agentData);

                // Reselect the selected tile so that any updates to the selected tile are reflected
                reSelectTile(state);
            })
            .addCase(saveSettings.fulfilled, (state, action) => {
                state.agentData.settings = action.payload;
            })
            .addCase(upsertTile.fulfilled, (state, action) => {
                state.selectedTile = action.payload;
            })
            .addCase(removeTile.fulfilled, (state, action) => {
                state.agentData.tiles = state.agentData.tiles.filter(tile => tile.id !== action.payload);
                selectTileById(state, state.selectedTile?.parentId);
            })
            .addCase(updateSortOrder.fulfilled, (state, action) => {
                state.agentData.tileOrder = action.payload;
                sortTiles(state.agentData);
            })
            .addCase(getAvailableCommands.fulfilled, (state, action) => {
                state.availableCommands = action.payload;
            })
    }
});

export const getConnectionState = createAsyncThunk('getConnectionState', async () => await contextBridge.getConnectionState());
export const connect = createAsyncThunk('connect', async ({ serverAddress, agentCode }: { serverAddress: string, agentCode: string }) => await contextBridge.connect(serverAddress, agentCode));
export const disconnect = createAsyncThunk('disconnect', async () => await contextBridge.disconnect());
export const getLoadedPlugins = createAsyncThunk('getPluginStatus', async () => await contextBridge.getPluginStatus());
export const togglePlugin = createAsyncThunk('togglePlugin', async (plugin: LoadedPlugin) => await contextBridge.togglePlugin(plugin.ns));
export const fetchData = createAsyncThunk('agentData/fetchData', async () => await contextBridge.getAgentData());
export const saveSettings = createAsyncThunk('updateSettings', async (settings: Settings) => await contextBridge.updateSettings(settings));
export const upsertTile = createAsyncThunk('agentData/upsertTile', async (tile: Tile, { dispatch }) => {
    const upserted = await contextBridge.upsertTile(tile);
    dispatch(fetchData());
    return upserted;
});
export const removeTile = createAsyncThunk('agentData/removeTile', async (id: string) => await contextBridge.removeTile(id));
export const updateSortOrder = createAsyncThunk('agentData/updateSortOrder', async (order: string[]) => await contextBridge.updateSortOrder(order));
export const getAvailableCommands = createAsyncThunk('agentData/availableCommands', async () => await contextBridge.getAvailableCommands());

export const connectionMiddleware: Middleware = store => {
    contextBridge.onConnection((e, state) => store.dispatch(setConnectionState(state)));
    return next => action => next(action);
}
export const pluginsMiddleware: Middleware = store => {
    contextBridge.onPluginStatus((e, plugins) => store.dispatch(setLoadedPlugins(plugins)));
    return next => action => next(action);
}

export const { selectTile, resetSelectedTile, updateSelectedTile, updateSettings, setServerAddress, setAgentCode, setConnectionState, setLoadedPlugins } = agentDataSlice.actions;
export const agentDataReducer = agentDataSlice.reducer;
