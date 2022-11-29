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
            .filter(plugin => plugin.ns && typeof plugin.events)
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
                        return pluginState;
                    })
                );
            });

        const windowObservable = this.window.activeWindow.pipe(
            distinctUntilChanged(),
            map(application => {
                let pluginState = {} as { [key: string]: { [key: string]: object } };
                pluginState["LaunchDeck.Agent"] = { activeWindow: application as any };
                return pluginState;
            })
        )

        merge(windowObservable, ...stateObservables).subscribe(pluginState => {

            for (let ns in pluginState) {

                if (!this.currentState.pluginState.hasOwnProperty(ns)) {
                    this.currentState.pluginState[ns] = {};
                }

                for (let key in pluginState[ns]) {
                    this.currentState.pluginState[ns][key] = pluginState[ns][key];
                }
            }

            this.stateSubject.next(this.currentState);
        });

    }

    public observeState(): Observable<AgentState> {
        return this.stateSubject;
    }

}
