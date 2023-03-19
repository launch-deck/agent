import { BehaviorSubject, distinctUntilChanged, fromEvent, map, merge, Observable, Subject } from "rxjs";
import { PluginService } from "./plugin.service";
import { ActiveWindowService } from "./active-window.service";
import type { AgentState } from "@launch-deck/common";

export class StateService {

    private readonly currentState: AgentState = {
        coreState: {},
        pluginState: {}
    };
    private readonly stateSubject: Subject<AgentState> = new BehaviorSubject<AgentState>(this.currentState);

    constructor(private pluginService: PluginService, private window: ActiveWindowService) {

        const stateObservables = this.pluginService.getPlugins()
            .filter(plugin => plugin.ns && plugin.events)
            .map(plugin => {

                if (!plugin.ns || !plugin.events) {
                    // Code should never reach this because plugins without state are filtered out above.
                    // Typescript doesn't realize this though, so here we are.
                    throw "No state";
                }

                return fromEvent(plugin.events, 'state').pipe(
                    map(state => {
                        let pluginState = {} as { [key: string]: { [key: string]: object } };
                        if (plugin.ns) {
                            pluginState[plugin.ns] = state as { [key: string]: object; };
                        }
                        return { pluginState, coreState: {} } as AgentState;
                    })
                );
            });

        const windowObservable = this.window.activeWindow.pipe(
            distinctUntilChanged(),
            map(application => {
                let coreState = {} as { [key: string]: object };
                coreState = { activeWindow: application as any };
                return { coreState, pluginState: {} } as AgentState;
            })
        )

        merge(windowObservable, ...stateObservables).subscribe(state => {

            for (let key in state.coreState) {
                this.currentState.coreState[key] = state.coreState[key];
            }

            for (let ns in state.pluginState) {

                if (!this.currentState.pluginState.hasOwnProperty(ns)) {
                    this.currentState.pluginState[ns] = {};
                }

                for (let key in state.pluginState[ns]) {
                    this.currentState.pluginState[ns][key] = state.pluginState[ns][key];
                }
            }

            this.stateSubject.next(this.currentState);
        });

    }

    public observeState(): Observable<AgentState> {
        return this.stateSubject;
    }

}
