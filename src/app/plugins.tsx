import Box from "@mui/material/Box";
import Switch from "@mui/material/Switch";
import { useEffect } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import { LoadedPlugin, getLoadedPlugins, togglePlugin } from "./redux/agent-data-slice";

export default function Plugins() {

    const dispatch = useAppDispatch();
    const loadedPlugins = useAppSelector(state => state.loadedPlugins);

    useEffect(() => {
        dispatch(getLoadedPlugins())
    }, [dispatch]);

    const handleChange = (plugin: LoadedPlugin): void => {
        dispatch(togglePlugin(plugin));
    }

    const pluginComps = loadedPlugins.map(plugin => (
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
