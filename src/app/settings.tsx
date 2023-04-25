import Box from "@mui/material/Box";
import { Settings } from "../interfaces";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import { fetchData, saveSettings, updateSettings } from "./redux/agent-data-slice";

const hasPluginSettings = (pluginSettings: any): boolean => {
    return Object.keys(pluginSettings).length > 0;
}

export default function Settings() {

    const dispatch = useAppDispatch();
    const settings = useAppSelector(state => state.agentData.settings);

    if (!settings) {
        return <></>
    }

    const handleSave = () => {
        dispatch(saveSettings(settings));
    }

    const handleCancel = () => {
        dispatch(fetchData());
    }

    const handleThemeChange = (event: any) => {
        dispatch(updateSettings({
            ...settings,
            clientSettings: {
                ...settings.clientSettings,
                theme: event.target.checked ? 'light' : 'dark'
            }
        }));
    };

    const handleImageChange = (event: any) => {
        dispatch(updateSettings({
            ...settings,
            clientSettings: {
                ...settings.clientSettings,
                backgroundImageUrl: event.target.value
            }
        }));
    };

    const handleTileBlurChange = (event: any) => {
        dispatch(updateSettings({
            ...settings,
            clientSettings: {
                ...settings.clientSettings,
                tileBlur: parseInt(event.target.value)
            }
        }));
    };

    const handleTileAlphaChange = (event: any) => {
        dispatch(updateSettings({
            ...settings,
            clientSettings: {
                ...settings.clientSettings,
                tileAlpha: parseFloat(event.target.value)
            }
        }));
    };

    const handleUpdatePluginSetting = (pluginKey: string, settingKey: string, event: any) => {
        const update = {
            ...settings,
            pluginSettings: {
                ...settings.pluginSettings,
                [pluginKey]: {
                    ...settings.pluginSettings[pluginKey],
                    [settingKey]: event?.target?.value ?? ""
                }
            }
        }
        dispatch(updateSettings(update));
    };

    let pluginSettings = [];
    for (let ns in settings.pluginSettings) {
        if (hasPluginSettings(settings.pluginSettings[ns])) {

            let settingsComps = [];
            for (let key in settings.pluginSettings[ns]) {
                settingsComps.push(
                    <TextField
                        key={`${ns}-${key}`}
                        label={key}
                        variant="outlined"
                        value={settings.pluginSettings[ns][key]}
                        onChange={(e) => handleUpdatePluginSetting(ns, key, e)} />
                );
            }

            pluginSettings.push(
                <Box key={ns} sx={{ '& > :not(style)': { m: 1 }, }}>
                    <div>{ns}</div>

                    {settingsComps}
                </Box>
            );
        }
    }

    return (
        <div>
            <Typography variant="h4">Settings</Typography>

            <Box
                component="form"
                noValidate
                autoComplete="off">

                <Box sx={{ '& > :not(style)': { m: 1 }, }}>

                    <FormControlLabel
                        sx={{ display: 'block' }}
                        label="Light Theme"
                        control={<Switch
                            checked={settings.clientSettings.theme === 'light'}
                            onChange={handleThemeChange}
                        />} />

                    <TextField
                        label="Background Image"
                        variant="outlined"
                        value={settings.clientSettings.backgroundImageUrl}
                        onChange={handleImageChange} />

                    <TextField
                        label="Tile Alpha"
                        variant="outlined"
                        type="number"
                        inputProps={{ min: 0, max: 1, step: .1 }}
                        value={settings.clientSettings.tileAlpha}
                        onChange={handleTileAlphaChange} />

                    <TextField
                        label="Tile Blur"
                        variant="outlined"
                        type="number"
                        inputProps={{ min: 0, max: 10, step: 1 }}
                        value={settings.clientSettings.tileBlur}
                        onChange={handleTileBlurChange} />
                </Box>

                {pluginSettings}

                <Box sx={{ '& > :not(style)': { m: 1 }, }}>
                    <Button variant="contained" onClick={handleSave}>
                        Save
                    </Button>

                    <Button variant="outlined" onClick={handleCancel}>
                        Cancel
                    </Button>
                </Box>
            </Box>
        </div>
    );
}
