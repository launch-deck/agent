import { KeyValue } from '@angular/common';
import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import type { Command, CommandInput } from '@launch-deck/common';

@Component({
    selector: 'app-command',
    templateUrl: './command.component.html',
    styleUrls: ['./command.component.css']
})
export class CommandComponent {

    @Input() command: Command;
    @Input() commandInputs: { [key: string]: CommandInput } | null | undefined;
    @Input() color: number;
    @Output() remove = new EventEmitter<any>();
    @Output() add = new EventEmitter<any>();
    @Output() changed = new EventEmitter<any>();

    @HostBinding('class') get className() {
        return 'color-' + this.color;
    }

    get commandData(): { [key: string]: string; } {
        this.command.data = this.command.data || {};
        return this.command.data;
    }
    set commandData(data: { [key: string]: string; }) {
        this.command.data = data;
    }

    constructor() { }

    /**
     * Get values from the data to allow for multiple selection using CSV
     */
    getValues(commandInputKey: string): string | string[] {

        if (this.commandInputs) {
            const commandInput = this.commandInputs[commandInputKey];

            if (commandInput && commandInput.multiple) {
                return this.commandData[commandInputKey]?.split(",");
            }
        }

        return this.commandData[commandInputKey];
    }

    /**
     * Sets the values to allow for multiple selection using CSV
     * 
     * @param value the selected value(s)
     * @param commandInputKey the command input key associated to the value(s)
     */
    setValue(value: string | string[], commandInputKey: string): void {
        this.commandData[commandInputKey] = (value instanceof Array) ? value.join(',') : value;
    }

    /**
     * Sorts the key value pairs by the original object property order
     */
    originalOrder = (a: KeyValue<string, CommandInput>, b: KeyValue<string, CommandInput>): number => {
        return 0;
    }

}
