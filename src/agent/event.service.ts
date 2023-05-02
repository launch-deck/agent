import { distinctUntilChanged, fromEvent, map, merge, tap, Observable, Subject } from "rxjs";
import { PluginService } from "./plugin.service";
import { ActiveWindowService } from "./active-window.service";
import { Event } from "../interfaces";

export class EventService {

    private readonly eventSubject: Subject<Event> = new Subject();

    public get events(): Observable<Event> {
        return this.eventSubject;
    }

    constructor(private pluginService: PluginService,
        private window: ActiveWindowService) {

        const pluginEvents = this.pluginService.getPlugins()
            .filter(plugin => plugin.ns && plugin.events)
            .map(plugin => {

                if (!plugin.ns || !plugin.events) {
                    // Code should never reach this because plugins without events are filtered out above.
                    // Typescript doesn't realize this though, so here we are.
                    throw "No events";
                }

                return fromEvent(plugin.events, 'event').pipe(
                    map(({ key, value }: { key: string, value: string }) => {
                        return {
                            ns: plugin.ns + '.' + key,
                            value
                        } as Event;
                    })
                );
            });

        const windowObservable = this.window.activeWindow.pipe(
            distinctUntilChanged(),
            tap(window => console.log("Window Changed", window)),
            map(value => {
                return {
                    ns: 'activeWindow',
                    value
                } as Event;
            })
        )

        merge(windowObservable, ...pluginEvents).subscribe(this.eventSubject);
    }

}
