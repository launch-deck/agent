import { Command, CommandInput } from "@launch-deck/common";
import Delete from '@mui/icons-material/Delete';
import Add from '@mui/icons-material/Add';
import IconButton from "@mui/material/IconButton";
import CommandInputComp from "./command-input";

interface Props {
    command: Command
    commandInputs: { [key: string]: CommandInput } | null | undefined
    color: number
    onUpdate?: (command: Command) => void
    onRemove?: () => void
    onAdd?: () => void
}

export default function Command({ command, commandInputs, color, onUpdate, onRemove, onAdd }: Props) {

    const handleUpdate = (key: string, value: string) => {
        if (command && onUpdate) {
            onUpdate({
                ...command,
                data: {
                    ...command.data,
                    [key]: value
                }
            });
        }
    }

    const commandInputComps = (commandInputs && onRemove) ? Object.keys(commandInputs).map(key => {
        if (commandInputs && commandInputs[key]) {
            const defaultValue = command.data?.hasOwnProperty(key) ? command.data[key] : '';
            return (<CommandInputComp key={key} commandInput={commandInputs[key]} defaultValue={defaultValue} onUpdate={(value) => handleUpdate(key, value)} />)
        }
        return (<></>);
    }) : [];

    return (
        <div className={`command color-${color}`}>
            {command.name}

            <IconButton className="remove" type="button" hidden={!onRemove} onClick={(e) => { e.stopPropagation(); onRemove ? onRemove() : null }} >
                <Delete />
            </IconButton>
            <IconButton className="add" type="button" hidden={!onAdd} onClick={(e) => { e.stopPropagation(); onAdd ? onAdd() : null }} >
                <Add />
            </IconButton>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                {commandInputComps}
            </div>
        </div>
    );
}
