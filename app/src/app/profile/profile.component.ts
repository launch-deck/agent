import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import type { Tile } from '@launch-deck/common';
import { DataService } from '../services/data.service';

const iconAnimation = trigger('iconAnimation', [
    transition('* <=> *', [
        query(':enter',
            [style({ opacity: 0 }), stagger('50ms', animate('400ms ease-out', style({ opacity: 1 })))],
            { optional: true }
        ),
        query(':leave',
            [animate('400ms ease-out', style({ opacity: 0 }))],
            { optional: true }
        )
    ])
]);

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css'],
    animations: [iconAnimation]
})
export class ProfileComponent implements OnInit {

    selectedTile?: Tile;

    constructor(private dataService: DataService) { }

    ngOnInit(): void {
    }

    async save(): Promise<void> {
        if (this.selectedTile) {
            (this.selectedTile.id !== "0") ? await this.dataService.updateTile(this.selectedTile) : await this.dataService.createTile(this.selectedTile);
        }
    }

    async cancel(): Promise<void> {
        if (this.selectedTile) {
            if (this.selectedTile.id !== "0") {
                const data = await this.dataService.refreshData();
                this.selectedTile = data.tiles.find(tile => tile.id === this.selectedTile?.id);
            } else {
                this.selectedTile = undefined;
            }
        }
    }

    async remove(): Promise<void> {
        if (this.selectedTile) {
            const id = this.selectedTile.id;
            this.selectedTile = undefined;
            await this.dataService.deleteTile(id);
        }
    }

}
