import { app } from "electron";
import { existsSync, readdirSync, readFileSync } from "original-fs";
import { join } from 'path';
import type { Plugin } from "@launch-deck/common";
import { PluginWorker } from "./plugin-worker.class";
import { Subject } from "rxjs";
import { log, error } from 'electron-log';

export class PluginService {

    private plugins: PluginWorker[] = [];

    pluginStatus: Subject<PluginWorker[]> = new Subject();

    /**
     * Gets the paths to look for plugins
     */
    private get pluginPaths() {
        const paths = [
            join(app.getPath('userData'), "./plugins"),
        ];

        if (process.env.NODE_ENV === 'development') {
            paths.unshift(join(app.getAppPath(), "../plugins"));
        }

        return paths;
    }

    /**
     * Loads plugins
     */
    public async loadPlugins(): Promise<void> {

        for (let path of this.pluginPaths) {
            if (existsSync(path)) {
                log(`Loading plugins from: ${path}`);

                const plugins = readdirSync(path);

                for (let plugin of plugins) {
                    await this.loadPlugin(plugin, path);
                }
            } else {
                log(`Plugin dir not found: ${path}`);
            }
        }

        this.pluginStatus.next(this.plugins);
    }

    public async startPlugin(ns: string) {
        await this.getPlugin(ns)?.start();
        this.pluginStatus.next(this.plugins);
    }

    public stopPlugin(ns: string) {
        this.getPlugin(ns)?.stop();
        this.pluginStatus.next(this.plugins);
    }

    public stopAllPlugins(): void {
        this.plugins.forEach(plugin => plugin.stop());
        this.pluginStatus.next(this.plugins);
    }

    /**
     * Gets a plugin by its namespace
     * 
     * @param ns the plugin namespace
     * @returns the plugin or undefined
     */
    public getPlugin(ns?: string): PluginWorker | undefined {
        return this.plugins.find(plugin => plugin.ns === ns);
    }

    /**
     * Gets all loaded plugins
     * 
     * @returns loaded plugins
     */
    public getPlugins(): Plugin[] {
        return this.plugins.slice(0);
    }

    /**
     * Loads a plugin from a directory
     * 
     * @param plugin the plugin dir
     * @param path the path to the plugin
     */
    private async loadPlugin(plugin: string, path: string): Promise<void> {
        const pluginPath = join(path, plugin);
        const pluginPathPackageJson = join(pluginPath, 'package.json');

        if (!existsSync(pluginPathPackageJson)) {
            return;
        }

        let pluginInfo = JSON.parse(readFileSync(pluginPathPackageJson, "utf8"));
        pluginInfo = Object.assign(pluginInfo, {
            pluginPath,
            main: join(pluginPath, pluginInfo.main),
        });

        await this.requirePlugin(pluginInfo);
    }

    /**
     * Loads a plugin into the application via require
     * 
     * @param pluginInfo the plugin info
     */
    private async requirePlugin(pluginInfo: any): Promise<void> {
        try {

            if (this.plugins.find(plugin => plugin.ns === pluginInfo.name)) {
                log(`Plugin already loaded: ${pluginInfo.name || pluginInfo.main}`)
                return;
            }

            const plugin: PluginWorker = new PluginWorker(pluginInfo);

            log(`Plugin loaded: ${pluginInfo.name || pluginInfo.main}`)

            await plugin.start();

            this.plugins.push(plugin);

        } catch (e) {
            error(`Error loading plugin ${pluginInfo.main}`, e);
        }
    }
}
