import { workerData, parentPort } from 'worker_threads';
import type { Plugin } from "@launch-deck/common";
import { WorkerMessage } from './worker-message.interface';

// Keep the thread alive
const keepAlive = setInterval(() => { }, 60000);

// TODO: Handle events from plugins more generically
const eventActions = ["state"];

class PluginWorker {

    private plugin?: Plugin;

    constructor(pluginInfo: any) {

        // Load the plugin
        this.requirePlugin(pluginInfo)
            .then(plugin => {
                this.plugin = plugin;

                // Listen for events
                eventActions.forEach(type => {
                    this.plugin?.events?.on(type, (data) => this.sendMessage({ action: 'event', type, data }));
                });

                // Listen for commands from the agent
                parentPort?.on("message", (message) => this.onMessage(message));
            })
            .catch((err) => {
                console.error(err);
                this.exit();
            });
    }

    /**
     * Handle messages from the agent
     * 
     * @param message the message from the agent
     */
    private async onMessage(message: WorkerMessage): Promise<void> {
        switch (message.action) {
            case 'exit':
                this.exit();
                break;
            default:
                let plugin = this.plugin as any;
                if (plugin?.hasOwnProperty(message.action) && typeof plugin[message.action] === 'function') {
                    let response = await plugin[message.action](message.data);
                    this.sendMessage({ action: message.action, data: response });
                } else {
                    this.sendMessage({ action: message.action });
                }
                break;
        }
    }

    /**
     * Send a message to the agent
     * 
     * @param message the message to send to the agent
     */
    private sendMessage(message: WorkerMessage): void {
        parentPort?.postMessage(message);
    }

    /**
     * Exits the worker thread
     */
    private exit(): void {
        this.plugin?.events?.removeAllListeners();
        parentPort?.close();
        clearInterval(keepAlive);
    }

    /**
     * Loads a plugin into the application via require
     * 
     * @param pluginInfo the plugin info
     */
    private async requirePlugin(pluginInfo: any): Promise<Plugin> {
        try {

            const plugin: Plugin = (await import(pluginInfo.main)).default;

            if (plugin && typeof plugin.handleCommand === "function" && typeof plugin.getCommands === "function") {
                plugin.ns = pluginInfo.name;
                return plugin;
            } else {
                throw new Error("Missing plugin methods");
            }

        } catch (e: any) {
            e.message = `Error loading plugin ${pluginInfo.main}: ${e.message}`;
            throw e;
        }
    }

}

new PluginWorker(workerData);
