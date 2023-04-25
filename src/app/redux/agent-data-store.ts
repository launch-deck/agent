import { configureStore } from "@reduxjs/toolkit";
import { agentDataReducer, connectionMiddleware, pluginsMiddleware } from "./agent-data-slice";

const agentDataStore = configureStore({
    reducer: agentDataReducer,
    middleware: (getDefaultMiddleware) => {
        return getDefaultMiddleware().concat([connectionMiddleware, pluginsMiddleware])
    },
});

export default agentDataStore;

export type RootState = ReturnType<typeof agentDataStore.getState>
export type AppDispatch = typeof agentDataStore.dispatch
