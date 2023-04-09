import Box from "@mui/material/Box";
import Switch from "@mui/material/Switch";
import { useEffect, useState } from "react";
import contextBridge, { LoadedPlugin } from "./context-bridge";
import FormControlLabel from "@mui/material/FormControlLabel";

export default function Plugins() {

    const [plugins, setPlugins] = useState<LoadedPlugin[]>([]);

    const getPlugins = async (): Promise<void> => {
        setPlugins(await contextBridge.getLoadedPlugins());
    }

    useEffect(() => {
        getPlugins();
    }, []);

    const handleChange = (plugin: LoadedPlugin): void => {
        contextBridge.togglePlugin(plugin);
        getPlugins();
    }

    const pluginComps = plugins.map(plugin => (
        <FormControlLabel
            sx={{ display: 'block' }}
            key={plugin.ns}
            label={plugin.ns}
            control={<Switch
                checked={plugin.started}
                disabled={plugin.core}
                onChange={() => handleChange(plugin)}
            />} />

    ));

    return (
        <Box>
            {pluginComps}
        </Box>
    );
}
