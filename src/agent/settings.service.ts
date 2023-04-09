import type { AgentData, Settings } from "@launch-deck/common";
import { PluginService } from "./plugin.service";

export class SettingsService {

    constructor(private pluginService: PluginService) { }

    /**
     * Loads settings from the agent data and plugins and initializes plugin settings
     * 
     * @param agentData the agent data to load plugin settings into
     * @returns the loaded settings
     */
    public getAgentDataSettings(agentData: AgentData): Settings {

        if (agentData.settings == null) {
            agentData.settings = {} as Settings;
        }
        if (agentData.settings.pluginSettings == null) {
            agentData.settings.pluginSettings = {};
        }
        if (agentData.settings.clientSettings == null) {
            agentData.settings.clientSettings = {};
        }

        for (let plugin of this.pluginService.getPlugins()) {

            // For each plugin that provides and loads settings, create the keys in the data, and load them in the plugins
            if (plugin.ns && typeof plugin.getSettingsKeys === "function" && typeof plugin.loadSettings === "function") {

                if (!agentData.settings.pluginSettings.hasOwnProperty(plugin.ns)) {
                    agentData.settings.pluginSettings[plugin.ns] = {};
                }

                let pluginSettings = agentData.settings.pluginSettings[plugin.ns];

                for (let key of plugin.getSettingsKeys()) {
                    if (!pluginSettings.hasOwnProperty(key)) {
                        pluginSettings[key] = "";
                    }
                }

                plugin.loadSettings(pluginSettings);
            }
        }

        return agentData.settings;
    }

}
