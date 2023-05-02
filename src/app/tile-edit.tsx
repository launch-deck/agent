import { Command } from "@launch-deck/common";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect } from "react";
import TileComp from "./tile";
import IconPicker from "./icon-picker";
import CommandComp from "./command";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import { removeTile, resetSelectedTile, selectTile, upsertTile, updateSelectedTile, getAvailableCommands } from "./redux/agent-data-slice";
import IconButton from "@mui/material/IconButton";
import Clear from '@mui/icons-material/Clear';
import Autocomplete from "@mui/material/Autocomplete";

export default function TileEdit() {

    const dispatch = useAppDispatch();
    const selectedTile = useAppSelector(state => state.selectedTile);
    const availableCommands = useAppSelector(state => state.availableCommands);
    const events = useAppSelector(state => state.events);

    useEffect(() => {
        dispatch(getAvailableCommands());
    }, [dispatch]);

    if (!selectedTile || !availableCommands || availableCommands.length === 0) {
        return <></>;
    }

    const inputMap: any = {};
    const colorMap: any = {};

    let colors = 7;
    let color = 1;

    availableCommands.forEach(command => {
        inputMap[(command.class || "") + command.type] = command.commandInputs;
        if (!colorMap.hasOwnProperty(command.class)) {
            colorMap[(command.class || "")] = color;
            if (color === colors) {
                color = 1;
            } else {
                color++;
            }
        }
    });

    const handleSave = () => {
        if (!selectedTile.name) {
            return;
        }
        dispatch(upsertTile(selectedTile));
    }

    const handleDelete = () => {
        dispatch(removeTile(selectedTile.id));
    }

    const handleCancel = () => {
        if (selectedTile.id === "0") {
            dispatch(selectTile());
        } else {
            dispatch(resetSelectedTile());
        }
    }

    const handleNameChange = (event: any) => {
        dispatch(updateSelectedTile({
            ...selectedTile,
            name: event.target.value
        }));
    }

    const handleIconChange = (value: any) => {
        dispatch(updateSelectedTile({
            ...selectedTile,
            icon: value
        }));
    }

    const handleProcessNameChange = (event: any) => {
        dispatch(updateSelectedTile({
            ...selectedTile,
            processName: event.target.value
        }));
    }

    const handleColorChange = (event: any) => {
        dispatch(updateSelectedTile({
            ...selectedTile,
            color: event.target.value
        }));
    }

    const handleClearColorClick = () => {
        dispatch(updateSelectedTile({
            ...selectedTile,
            color: undefined
        }));
    }

    const handleUpdateCommand = (command: Command, index: number) => {
        dispatch(updateSelectedTile({
            ...selectedTile,
            commands: selectedTile.commands.map((c, i) => {
                if (i === index) {
                    return command;
                }
                return c;
            })
        }));
    }

    const handleAddCommand = (command: Command) => {
        dispatch(updateSelectedTile({
            ...selectedTile,
            commands: selectedTile.commands.concat(command)
        }));
    }

    const handleRemoveCommand = (command: Command) => {
        dispatch(updateSelectedTile({
            ...selectedTile,
            commands: selectedTile.commands.filter(c => c !== command)
        }));
    }

    const commands = selectedTile.commands.map((command, index) => {
        let commandInputs = inputMap[(command.class || '') + command.type];
        let color = colorMap[command.class || ''];
        return (<CommandComp key={`${index}`} command={command} commandInputs={commandInputs} color={color} onUpdate={(command) => handleUpdateCommand(command, index)} onRemove={() => handleRemoveCommand(command)} />)
    });

    const availableCommandComps = availableCommands.map((command, index) => {
        let color = colorMap[command.class || ''];
        return (<CommandComp key={index} command={command} commandInputs={command.commandInputs} color={color} onAdd={() => handleAddCommand(command)} />)
    });

    const eventValueOptions = events
        .filter(event => event.ns === "activeWindow")
        .map(event => event.value)
        .filter((value, index, array) => array.indexOf(value) === index);

    return (
        <div style={{ flexGrow: 1, display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: '1rem' }}>

            <Typography variant="h4">{selectedTile.id === "0" ? 'New Tile' : selectedTile.name}</Typography>

            <div style={{ overflow: 'auto', padding: '1rem 1rem 1rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box
                        component="form"
                        sx={{
                            '& > :not(style)': { m: 1, width: '200px', display: 'inline-flex' },
                        }}
                        noValidate
                        autoComplete="off">

                        <TextField
                            id="tileName"
                            label="Tile Name"
                            variant="outlined"
                            value={selectedTile.name}
                            onChange={handleNameChange} />

                        <IconPicker value={selectedTile.icon || ''} onChange={handleIconChange}></IconPicker>

                        <Autocomplete
                            value={selectedTile.processName || ""}
                            onChange={handleProcessNameChange}
                            freeSolo
                            autoSelect
                            disablePortal
                            id="activeOnEventValue"
                            options={eventValueOptions}
                            sx={{ width: 300 }}
                            renderInput={(params) => <TextField {...params} label="Process" />}
                        />

                        <TextField
                            label="Color"
                            value={selectedTile.color || ""}
                            type={"color"}
                            onChange={handleColorChange}
                            InputProps={{
                                endAdornment: (
                                    <IconButton
                                        sx={{ visibility: selectedTile.color ? "visible" : "hidden" }}
                                        onClick={handleClearColorClick}
                                    >
                                        <Clear />
                                    </IconButton>
                                )
                            }}
                            sx={{
                                m: 2,
                                "& .Mui-focused .MuiIconButton-root": { color: "primary.main" },
                            }} />

                    </Box>
                    <TileComp tile={selectedTile}></TileComp>
                </div>

                <Typography variant="h5">Commands</Typography>

                <div className="command-container">

                    <div className="commands">
                        <p hidden={selectedTile.commands?.length > 0}>Drag commands here</p>
                        {commands}
                    </div>

                    <div className="command-list">
                        {availableCommandComps}
                    </div>

                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
                <Button variant="contained" onClick={handleSave}>
                    Save
                </Button>

                <Button variant="outlined" onClick={handleCancel}>
                    Cancel
                </Button>

                <Button hidden={selectedTile.id === "0"} variant="outlined" onClick={handleDelete}>
                    Delete
                </Button>
            </div>

        </div>
    );
}
