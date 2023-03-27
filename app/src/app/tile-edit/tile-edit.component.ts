import { CdkDragDrop, copyArrayItem, moveItemInArray } from '@angular/cdk/drag-drop';
import { Clipboard } from '@angular/cdk/clipboard';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import type { Command, Tile } from '@launch-deck/common';
import { MatTooltip } from '@angular/material/tooltip';
import { DataService } from 'src/app/services/data.service';

@Component({
    selector: 'app-tile-edit',
    templateUrl: './tile-edit.component.html',
    styleUrls: ['./tile-edit.component.css']
})
export class TileEditComponent implements OnInit {

    @Input() tile!: Tile;

    @Output() save = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();
    @Output() remove = new EventEmitter<void>();

    section = 0;

    private colors = 7;
    private color = 1;
    colorMap: any = {};
    commandInputsMap: any = {};
    commands: Observable<Command[]> = this.dataService.data
        .pipe(
            map(data => data.commands.sort((a, b) => {
                var order = a.class && b.class ? a.class.localeCompare(b.class) : 0;

                if (order === 0 && a.name && b.name) {
                    order = a.name.localeCompare(b.name);
                }
                return order;
            })),
            tap(commands => commands.forEach(command => {
                this.commandInputsMap[(command.class || "") + command.type] = command.commandInputs;
                if (!this.colorMap.hasOwnProperty(command.class)) {
                    this.colorMap[(command.class || "")] = this.color;
                    if (this.color === this.colors) {
                        this.color = 1;
                    } else {
                        this.color++;
                    }
                }
            }))
        );

    @ViewChild('tooltip') tooltip!: MatTooltip;

    constructor(private dataService: DataService,
        private clipboard: Clipboard) { }

    ngOnInit(): void {

    }

    drop(event: CdkDragDrop<Command[] | any>) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            copyArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex,
            );
            event.container.data[event.currentIndex] = this.cloneCommand(event.container.data[event.currentIndex]);
        }
    }

    addCommand(command: Command) {
        this.tile?.commands.push(this.cloneCommand(command));
    }

    removeCommand(command: Command) {
        this.tile?.commands.splice(this.tile?.commands.indexOf(command), 1);
    }

    copyUrlToClipboard() {
        this.clipboard.copy(location.origin + '/api/run/' + this.tile?.id);
        this.tooltip.disabled = false;
        this.tooltip.show();
        setTimeout(() => this.tooltip.hide(2000));
        setTimeout(() => this.tooltip.disabled = true, 2000);
    }

    private cloneCommand(command: Command) {
        delete command.commandInputs;
        return Object.assign({}, command);
    }
}
