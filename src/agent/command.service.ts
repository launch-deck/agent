import type { Command } from "@launch-deck/common";
import { PluginService } from "./plugin.service";
import { log, error } from 'electron-log';
import { async } from "./extensions";
import { firstValueFrom } from "rxjs";

export class CommandService {

    constructor(private pluginService: PluginService) { }

    /**
     * Gets commands from all loaded plugins
     * 
     * @returns the commands
     */
    public async getCommands(): Promise<Command[]> {

        let commands: Command[] = [];
        const promises: Promise<any>[] = [];

        await firstValueFrom(this.pluginService.pluginsLoaded);

        const plugins = this.pluginService.getPlugins();

        for (let plugin of plugins) {
            promises.push(async(plugin.getCommands(), 2000)
                .then(c => {
                    c.forEach(command => command.class = plugin.ns);
                    commands = commands.concat(c);
                })
                .catch(e => {
                    error(`Failed to get plugin commands: ${plugin.ns}`, e);
                })
            );
        }

        await Promise.all(promises);

        return commands;
    }

    /**
     * Runs a list of commands on the host (synchronously)
     * 
     * @param commands the commands to run
     */
    public async handleCommands(commands: Command[]): Promise<void> {
        for (let command of commands) {
            await this.handleCommand(command);
        }
    }

    /**
     * Runs a single command on the host
     * 
     * @param command the command to run
     */
    public async handleCommand(command: Command): Promise<void> {
        const plugin = this.pluginService.getPlugin(command.class);

        if (plugin) {
            try {
                log(`On Command: ${plugin.ns} : ${command.type}`, command.data);
                await plugin.handleCommand(command);
            } catch (e) {
                error(`Failed to handle plugin command: ${plugin.ns} : ${command.type}`, e);
            }
        }
    }
}
