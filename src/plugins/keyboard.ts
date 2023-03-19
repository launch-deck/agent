import { Key, keyboard } from "@nut-tree/nut-js";
import type { Command, CommandInputSelectionOption, Plugin } from "@launch-deck/common";

enum CommandType {
    KEYPRESS,
    SPECIAL_KEY,
    MEDIA,
    TEXT
}

export default {

    ns: '@launch-deck/keyboard-plugin',

    async handleCommand(command: Command): Promise<void> {

        const value = command.data?.value;
        const modifierVal = command.data?.modifier;

        if (value) {

            const modifiers = modifierVal ? modifierVal.split(",").map(key => parseInt(key) as Key) : [];
            const type = command.type as CommandType;

            switch (type) {
                case CommandType.KEYPRESS:
                case CommandType.SPECIAL_KEY:
                case CommandType.MEDIA:

                    const key: Key = parseInt(value) as Key;

                    await keyboard.pressKey(...modifiers);
                    await keyboard.pressKey(key);
                    await keyboard.releaseKey(key);
                    await keyboard.releaseKey(...modifiers);

                    break;
                case CommandType.TEXT:
                    await keyboard.type(value);
                    break;
            }
        }
    },

    async getCommands(): Promise<Command[]> {

        const commands: Command[] = [
            buildCommand(CommandType.SPECIAL_KEY, "Special Key", [
                buildSelectionOption("Space", Key.Space),
                buildSelectionOption("Arrow Up", Key.Up),
                buildSelectionOption("Arrow Down", Key.Down),
                buildSelectionOption("Arrow Left", Key.Left),
                buildSelectionOption("Arrow Right", Key.Right),
                buildSelectionOption("Enter", Key.Enter),
                buildSelectionOption("Tab", Key.Tab),
                buildSelectionOption("Backspace", Key.Backspace),
                buildSelectionOption("Escape", Key.Escape),
                buildSelectionOption("F1", Key.F1),
                buildSelectionOption("F2", Key.F2),
                buildSelectionOption("F3", Key.F3),
                buildSelectionOption("F4", Key.F4),
                buildSelectionOption("F5", Key.F5),
                buildSelectionOption("F6", Key.F6),
                buildSelectionOption("F7", Key.F7),
                buildSelectionOption("F8", Key.F8),
                buildSelectionOption("F9", Key.F9),
                buildSelectionOption("F10", Key.F10),
                buildSelectionOption("F11", Key.F11),
                buildSelectionOption("F12", Key.F12),
                buildSelectionOption("Print Screen", Key.Print),
                buildSelectionOption("Insert", Key.Insert),
                buildSelectionOption("Home", Key.Home),
                buildSelectionOption("End", Key.End),
                buildSelectionOption("Page Up", Key.PageUp),
                buildSelectionOption("Page Down", Key.PageDown),
                buildSelectionOption("Delete", Key.Delete),
            ]),
            buildCommand(CommandType.KEYPRESS, "Keypress", [
                buildSelectionOption("1", Key.Num1),
                buildSelectionOption("2", Key.Num2),
                buildSelectionOption("3", Key.Num3),
                buildSelectionOption("4", Key.Num4),
                buildSelectionOption("5", Key.Num5),
                buildSelectionOption("6", Key.Num6),
                buildSelectionOption("7", Key.Num7),
                buildSelectionOption("8", Key.Num8),
                buildSelectionOption("9", Key.Num9),
                buildSelectionOption("0", Key.Num0),
                buildSelectionOption("A", Key.A),
                buildSelectionOption("B", Key.B),
                buildSelectionOption("C", Key.C),
                buildSelectionOption("D", Key.D),
                buildSelectionOption("E", Key.E),
                buildSelectionOption("F", Key.F),
                buildSelectionOption("G", Key.G),
                buildSelectionOption("H", Key.H),
                buildSelectionOption("I", Key.I),
                buildSelectionOption("J", Key.J),
                buildSelectionOption("K", Key.K),
                buildSelectionOption("L", Key.L),
                buildSelectionOption("M", Key.M),
                buildSelectionOption("N", Key.N),
                buildSelectionOption("O", Key.O),
                buildSelectionOption("P", Key.P),
                buildSelectionOption("Q", Key.Q),
                buildSelectionOption("R", Key.R),
                buildSelectionOption("S", Key.S),
                buildSelectionOption("T", Key.T),
                buildSelectionOption("U", Key.U),
                buildSelectionOption("V", Key.V),
                buildSelectionOption("W", Key.W),
                buildSelectionOption("X", Key.X),
                buildSelectionOption("Y", Key.Y),
                buildSelectionOption("Z", Key.Z),
                buildSelectionOption(",", Key.Comma),
                buildSelectionOption(".", Key.Period),
                buildSelectionOption("/", Key.Slash),
                buildSelectionOption(";", Key.Semicolon),
                buildSelectionOption("'", Key.Quote),
                buildSelectionOption("[", Key.LeftBracket),
                buildSelectionOption("]", Key.RightBracket),
                buildSelectionOption("\\", Key.Backslash),
                buildSelectionOption("`", Key.Grave),
            ]),
            buildCommand(CommandType.MEDIA, "Media Keys", [
                buildSelectionOption("Play / Pause", Key.AudioPlay),
                buildSelectionOption("Next Track", Key.AudioNext),
                buildSelectionOption("Previous Track", Key.AudioPrev),
                buildSelectionOption("Stop", Key.AudioStop),
                buildSelectionOption("Mute", Key.AudioMute),
                buildSelectionOption("Decrease Volume", Key.AudioVolDown),
                buildSelectionOption("Increase Volume", Key.AudioVolUp),
            ]),
            {
                name: "Text",
                type: CommandType.TEXT,
                commandInputs: {
                    "value": { name: "Key", type: 'text' }
                }
            }
        ];

        return Promise.resolve(commands);
    }
} as Plugin;

function buildCommand(type: CommandType, name: string, options?: CommandInputSelectionOption[]): Command {
    return {
        name,
        type,
        commandInputs: {
            "value": {
                name: "Key",
                type: 'select',
                selectionOptions: options
            },
            "modifier": {
                name: "Modifier",
                type: 'select',
                multiple: true,
                selectionOptions: [
                    { name: "Control", data: Key.LeftControl.valueOf().toString() },
                    { name: "Shift", data: Key.LeftShift.valueOf().toString() },
                    { name: "Alt", data: Key.LeftAlt.valueOf().toString() },
                    { name: "Windows", data: Key.LeftSuper.valueOf().toString() },
                ]
            }
        }
    }
}

function buildSelectionOption(name: string, key: Key): CommandInputSelectionOption {
    return {
        name,
        data: key.valueOf().toString()
    }
}
