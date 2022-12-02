import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

    serverAddress: string = "";
    agentCode: string = "";
    connectionState: number = 0;
    plugins: { ns: string, started: boolean }[] = [];

    private api: any;

    constructor(private cdr: ChangeDetectorRef) { }

    ngOnInit(): void {

        this.api = (window as any).api;

        this.api.onConnection((_: any, state: number) => {
            if (state === 2 && this.connectionState !== 2) {
                console.log(`Connected to ${this.serverAddress} Successfully`);
            }
            if (state === 0 && this.connectionState !== 0) {
                console.log(`Disconnected from ${this.serverAddress}`);
            }
            this.connectionState = state;
            this.cdr.detectChanges();
        });
        this.api.onPluginStatus((_: any, plugins: { ns: string, started: boolean }[]) => {
            this.plugins = plugins;
            this.cdr.detectChanges();
        });
        this.api.getPluginStatus().then((plugins: { ns: string, started: boolean }[]) => {
            this.plugins = plugins;
            this.cdr.detectChanges();
        });
        this.api.getConnectionState().then((state: number) => {
            this.connectionState = state;
            this.cdr.detectChanges();
        });
        this.api.getConnectionSettings().then((settings: { serverAddress: string, agentCode: string }) => {
            this.serverAddress = settings.serverAddress;
            this.agentCode = settings.agentCode;
            this.cdr.detectChanges();
        });

    }

    async connect(): Promise<void> {
        if (this.connectionState > 0) {
            this.api.disconnect();
            return;
        }

        if (!this.serverAddress || !this.agentCode) {
            return;
        }

        try {
            this.api.connect(this.serverAddress, this.agentCode);
        } catch (e) {
            console.log("Failed to connect to ${serverURL}", e);
        }
    }

    updatePlugin(plugin: { ns: string, started: boolean }): void {
        if (plugin.started) {
            this.api.stopPlugin(plugin.ns);
        } else {
            this.api.startPlugin(plugin.ns);
        }
    }

}
