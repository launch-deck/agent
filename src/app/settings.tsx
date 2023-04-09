import Box from "@mui/material/Box";
import { Settings } from "@launch-deck/common";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";

interface Props {
    settings?: Settings
    settingsChanged: (settings: Settings) => void
    onSave: () => void
    onCancel: () => void
}

const hasPluginSettings = (pluginSettings: any): boolean => {
    return Object.keys(pluginSettings).length > 0;
}

export default function Settings({ settings, settingsChanged, onSave, onCancel }: Props) {

    if (!settings) {
        return <></>
    }

    const handleThemeChange = (event: any) => {
        settingsChanged({
            ...settings,
            clientSettings: {
                ...settings.clientSettings,
                theme: event.target.checked ? 'light' : 'dark'
            }
        });
    };

    const handleImageChange = (event: any) => {
        settingsChanged({
            ...settings,
            clientSettings: {
                ...settings.clientSettings,
                backgroundImageUrl: event.target.value
            }
        });
    };

    const handleTileBlurChange = (event: any) => {
        settingsChanged({
            ...settings,
            clientSettings: {
                ...settings.clientSettings,
                tileBlur: parseInt(event.target.value)
            }
        });
    };

    const handleTileAlphaChange = (event: any) => {
        settingsChanged({
            ...settings,
            clientSettings: {
                ...settings.clientSettings,
                tileAlpha: parseFloat(event.target.value)
            }
        });
    };

    const handleUpdatePluginSetting = (pluginKey: string, settingKey: string, event: any): void => {
        settings.pluginSettings[pluginKey][settingKey] = event?.target?.value ?? "";

        settingsChanged({
            ...settings
        });
    }

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
                        label="Inverted Theme"
                        control={<Switch
                            checked={settings?.clientSettings.theme === 'light'}
                            onChange={handleThemeChange}
                        />} />

                    <TextField
                        label="Background Image"
                        variant="outlined"
                        value={settings?.clientSettings.backgroundImageUrl}
                        onChange={handleImageChange} />

                    <TextField
                        label="Tile Alpha"
                        variant="outlined"
                        type="number"
                        inputProps={{ min: 0, max: 1, step: .1 }}
                        value={settings?.clientSettings.tileAlpha || 1}
                        onChange={handleTileAlphaChange} />

                    <TextField
                        label="Tile Blur"
                        variant="outlined"
                        type="number"
                        inputProps={{ min: 0, max: 10, step: 1 }}
                        value={settings?.clientSettings.tileBlur || 0}
                        onChange={handleTileBlurChange} />
                </Box>

                {pluginSettings}

                <Box sx={{ '& > :not(style)': { m: 1 }, }}>
                    <Button variant="contained" onClick={onSave}>
                        Save
                    </Button>

                    <Button variant="outlined" onClick={onCancel}>
                        Cancel
                    </Button>
                </Box>
            </Box>
        </div>
    );
}
