import { CommandInput } from "@launch-deck/common";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";

interface Props {
    commandInput: CommandInput
    defaultValue: string,
    onUpdate: (value: string) => void
}

export default function CommandInput({ commandInput, defaultValue, onUpdate }: Props) {

    /**
     * Get values from the data to allow for multiple selection using CSV
     */
    const getValues = (): string | string[] => {
        return commandInput.multiple ? (defaultValue.split(",") || []) : defaultValue;
    }

    /**
     * Sets the values to allow for multiple selection using CSV
     * 
     * @param value the selected value(s)
     */
    const handleSetValue = (value: string | string[]): void => {
        onUpdate((value instanceof Array) ? value.filter(v => v !== '').join(',') : value);
    }

    const handleSetSelectValues = (event: any) => {
        handleSetValue(event.target.value);
    }

    const handleSetAutocompleteValues = (event: any, newValue: { label: string, data: string }) => {
        handleSetValue(newValue.data);
    }

    const handleSetInputValue = (event: any) => {
        handleSetValue(event.target.value);
    }

    const selectOptions = commandInput.selectionOptions?.map(option => {

        if (commandInput.multiple) {
            return (
                <MenuItem key={option.name} value={option.data}>
                    <Checkbox checked={getValues()?.indexOf(option.data) > -1} />
                    <ListItemText primary={option.name} />
                </MenuItem>
            );
        }

        return (<MenuItem key={option.name} value={option.data}>{option.name}</MenuItem>);
    }) || [];

    const autocompleteOptions = commandInput.selectionOptions?.map(option => {
        return {
            label: option.name,
            data: option.data
        };
    }) || [];

    const getSelectRenderValue = (selected: string | string[]): string => {
        let options: any = {};

        commandInput.selectionOptions?.forEach(option => {
            options[option.data] = option.name;
        });

        if (selected instanceof Array) {
            return selected
                .map(s => options[s])
                .join(', ');
        }

        return options[selected];
    }

    switch (commandInput.type) {
        case 'select':

            return (<FormControl sx={{ minWidth: 100 }}>
                <InputLabel id="command-input-label">{commandInput.name}</InputLabel>
                <Select
                    labelId="command-input-label"
                    id="command-input"
                    value={getValues()}
                    multiple={!!commandInput.multiple}
                    label={commandInput.name}
                    renderValue={getSelectRenderValue}
                    onChange={handleSetSelectValues}>
                    {selectOptions}
                </Select>
            </FormControl>);

        case 'suggest':

            return (<Autocomplete
                value={getValues()}
                onChange={handleSetAutocompleteValues}
                multiple={!!commandInput.multiple}
                freeSolo
                autoSelect
                disablePortal
                id="command-input"
                options={autocompleteOptions}
                sx={{ width: 300 }}
                renderInput={(params) => <TextField {...params} label={commandInput.name} />}
            />);

        case 'text':

            return (<TextField
                sx={{ width: 300 }}
                id="command-input"
                label={commandInput.name}
                multiline
                rows={6}
                value={getValues()}
                onChange={handleSetInputValue}
            />);

        case 'number':

            return (<TextField
                sx={{ width: 300 }}
                id="command-input"
                label={commandInput.name}
                inputProps={{ pattern: "-?[0-9.]+" }}
                value={getValues()}
                onChange={handleSetInputValue}
            />);

        case 'value':

            return (<TextField
                sx={{ width: 300 }}
                id="command-input"
                label={commandInput.name}
                value={getValues()}
                onChange={handleSetInputValue}
            />);

        default:
            return (<></>)
    }
}
