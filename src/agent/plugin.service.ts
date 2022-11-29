import { app } from "electron";
import { existsSync, readdirSync, readFileSync } from "original-fs";
import { join } from 'path';
import type { Plugin } from "@launch-deck/common";

export class PluginService {

    private plugins: Plugin[] = [];

    /**
     * Gets the paths to look for plugins
     */
    private get pluginPaths() {
        const paths = [
            join(app.getPath('userData'), "./plugins"),
        ];

        if (process.env.NODE_ENV === 'development') {
            paths.push(join(app.getAppPath(), "../plugins"));
        }

        return paths;
    }

    /**
     * Loads plugins
     */
    public loadPlugins(): void {
        this.pluginPaths.forEach(path => {

            if (existsSync(path)) {
                console.log(`Loading plugins from: ${path}`);

                const plugins = readdirSync(path);

                plugins.forEach(plugin => {
                    this.loadPlugin(plugin, path);
                });
            } else {
                console.log(`Plugin dir not found: ${path}`);
            }
        });
    }

    /**
     * Gets a plugin by its namespace
     * 
     * @param ns the plugin namespace
     * @returns the plugin or undefined
     */
    public getPlugin(ns?: string): Plugin | undefined {
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
            console.warn(`Plugin package json ${pluginPathPackageJson} does not exist`);
            return;
        }

        let pluginInfo = JSON.parse(readFileSync(pluginPathPackageJson, "utf8"));
        pluginInfo = Object.assign(pluginInfo, {
            pluginPath,
            main: join(pluginPath, pluginInfo.main),
        })

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
                console.log(`Plugin already loaded: ${pluginInfo.name || pluginInfo.main}`)
                return;
            }

            const plugin: Plugin = (await import(pluginInfo.main)).default;

            if (plugin) {
                plugin.ns = pluginInfo.name;
                if (typeof plugin.handleCommand === "function" && typeof plugin.getCommands === "function") {
                    console.log(`Plugin loaded: ${pluginInfo.name || pluginInfo.main}`)
                    this.plugins.push(plugin);
                }
            }

        } catch (e) {
            console.error(`Error loading plugin ${pluginInfo.main}`, e);
        }
    }
}
