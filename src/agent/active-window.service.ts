import ActiveWindow from "@paymoapp/active-window";
import { Observable, Subject } from "rxjs";

export class ActiveWindowService {

    private readonly _activeWindow: Subject<string> = new Subject<string>();

    public get activeWindow(): Observable<string> {
        return this._activeWindow;
    }

    constructor() {

        ActiveWindow.initialize();
        ActiveWindow.subscribe(async windowInfo => {
            this._activeWindow.next(windowInfo?.application || "");
        });
    }

}
