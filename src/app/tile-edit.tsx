import { Command, Tile } from "@launch-deck/common";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import TileComp from "./tile";
import IconPicker from "./icon-picker";
import CommandComp from "./command";
import contextBridge from "./context-bridge";

interface Props {
    tile: Tile
    onSave: (tile: Tile) => void
    onDelete: (tile: Tile) => void
    onDeselect: () => void
}

export default function TileEdit({ tile, onDelete, onSave, onDeselect }: Props) {

    const getStartingState = (): Tile => {
        const clone = contextBridge.clone(tile);
        return {
            id: clone.id,
            name: clone.name,
            processName: clone.processName || '',
            icon: clone.icon || '',
            color: clone.color || '#333333',
            commands: clone.commands,
            parentId: clone.parentId,
            hasChildren: clone.hasChildren
        } as Tile
    };

    const [cancelCount, setCancelCount] = useState(0);

    const [state, setState] = useState(getStartingState());

    const [commandState, setCommandState] = useState({
        availableCommands: [] as Command[],
        inputMap: {} as any,
        colorMap: {} as any
    });

    useEffect(() => {
        contextBridge.getAvailableCommands().then(availableCommands => {
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

            setCommandState({
                availableCommands,
                inputMap,
                colorMap
            });
        });
    }, []);

    if (commandState.availableCommands.length === 0) {
        return <></>;
    }

    const handleCancel = () => {
        if (tile.id === "0") {
            onDeselect();
        } else {
            setCancelCount(() => (cancelCount + 1));
            setState(() => getStartingState());
        }
    }

    const handleNameChange = (event: any) => {
        setState({
            ...state,
            name: event.target.value
        });
    }

    const handleIconChange = (value: any) => {
        setState({
            ...state,
            icon: value
        });
    }

    const handleProcessNameChange = (event: any) => {
        setState({
            ...state,
            processName: event.target.value
        });
    }

    const handleColorChange = (event: any) => {
        setState({
            ...state,
            color: event.target.value
        });
    }

    const handleAddCommand = (command: Command) => {
        setState({
            ...state,
            commands: state.commands.concat(command)
        });
    }

    const handleRemoveCommand = (command: Command) => {
        setState({
            ...state,
            commands: state.commands.filter(c => c !== command)
        });
    }

    const commands = state.commands.map((command, index) => {
        let commandInputs = commandState.inputMap[(command.class || '') + command.type];
        let color = commandState.colorMap[command.class || ''];
        return (<CommandComp key={`${cancelCount} ${index}`} command={command} commandInputs={commandInputs} color={color} onRemove={() => handleRemoveCommand(command)} />)
    });

    const availableCommands = commandState.availableCommands.map((command, index) => {
        let color = commandState.colorMap[command.class || ''];
        return (<CommandComp key={index} command={command} commandInputs={command.commandInputs} color={color} onAdd={() => handleAddCommand(command)} />)
    });

    return (
        <div style={{ flexGrow: 1, display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: '1rem' }}>

            <Typography variant="h4">{tile.id === "0" ? 'New Tile' : tile.name}</Typography>

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
                            value={state.name}
                            onChange={handleNameChange} />

                        <IconPicker value={state.icon} onChange={handleIconChange}></IconPicker>

                        <TextField
                            id="processName"
                            label="Process"
                            variant="outlined"
                            value={state.processName}
                            onChange={handleProcessNameChange} />

                        <TextField
                            label="Color"
                            value={state.color}
                            type={"color"}
                            onChange={handleColorChange} />

                    </Box>
                    <TileComp tile={state}></TileComp>
                </div>

                <Typography variant="h5">Commands</Typography>

                <div className="command-container">

                    <div className="commands">
                        <p hidden={tile.commands?.length > 0}>Drag commands here</p>
                        {commands}
                    </div>

                    <div className="command-list">
                        {availableCommands}
                    </div>

                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
                <Button variant="contained" onClick={() => onSave(state)}>
                    Save
                </Button>

                <Button variant="outlined" onClick={handleCancel}>
                    Cancel
                </Button>

                <Button variant="outlined" onClick={() => onDelete(state)}>
                    Delete
                </Button>
            </div>

        </div>
    );
}
