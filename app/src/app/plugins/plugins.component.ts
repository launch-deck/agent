import { Component, OnInit } from '@angular/core';
import { from, merge, Observable, startWith } from 'rxjs';
import { ContextBridgeService, LoadedPlugin } from '../services/context-bridge.service';

@Component({
    selector: 'app-plugins',
    templateUrl: './plugins.component.html',
    styleUrls: ['./plugins.component.css']
})
export class PluginsComponent implements OnInit {

    plugins: Observable<LoadedPlugin[]> = merge(
        from(this.contextBridge.getPluginStatus()),
        this.contextBridge.pluginStatus
    );

    constructor(private contextBridge: ContextBridgeService) { }

    ngOnInit(): void {
    }

    async updatePlugin(plugin: { ns: string, started: boolean }): Promise<void> {
        if (plugin.started) {
            await this.contextBridge.stopPlugin(plugin.ns);
        } else {
            await this.contextBridge.startPlugin(plugin.ns);
        }
    }

}
