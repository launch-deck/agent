import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { combineLatest, map, tap, Observable, Subject, BehaviorSubject, ReplaySubject, firstValueFrom, shareReplay, filter } from 'rxjs';
import type { Tile } from "@launch-deck/common";
import { DataService } from 'src/app/services/data.service';
import { TileEditComponent } from '../tile-edit/tile-edit.component';

const listAnimation = trigger('listAnimation', [
    transition('* <=> *', [
        query(':enter',
            [style({ opacity: 0 }), stagger('50ms', animate('400ms ease-out', style({ opacity: 1 })))],
            { optional: true }
        )
    ])
]);

@Component({
    selector: 'app-tile-grid',
    templateUrl: './tile-grid.component.html',
    styleUrls: ['./tile-grid.component.css'],
    animations: [listAnimation]
})
export class TileGridComponent implements OnInit, OnChanges {

    @Input() selectedTile?: Tile;
    @Output() select = new EventEmitter<Tile>();

    @ViewChild('rootTiles', { static: true }) rootTilesElem: ElementRef<HTMLElement>;
    @ViewChild('childTiles', { static: true }) childTilesElem: ElementRef<HTMLElement>;

    tiles: Observable<Tile[]>;
    children: Observable<Tile[]>;
    hasChildren: boolean = false;

    showRootNextPage: boolean = false;
    showRootPreviousPage: boolean = false;
    showRootAdd: boolean = false;
    showChildNextPage: boolean = false;
    showChildPreviousPage: boolean = false;
    showChildAdd: boolean = false;

    rootChanged: number = 0;
    childChanged: number = 0;

    private readonly tileObservable: Observable<Tile[]> = this.dataService.data.pipe(
        map(data => {
            return data.tiles.sort((a, b) => {
                var ia = data.tileOrder.indexOf(a.id);
                var ib = data.tileOrder.indexOf(b.id);
                return ia - ib;
            });
        }),
        shareReplay(1)
    );
    private readonly selectedTileSubject: Subject<Tile | undefined> = new Subject<Tile | undefined>();

    private maxTileSubject: Subject<[number, number]> = new ReplaySubject<[number, number]>(1);
    private pageNumberSubject: Subject<[number, number]> = new BehaviorSubject<[number, number]>([1, 1]);

    constructor(private dataService: DataService,
        private elRef: ElementRef,
        private dialog: MatDialog) { }

    ngOnInit(): void {

        this.dataService.data.subscribe(data => {
            if (data.settings.coreSettings?.backgroundImageUrl) {
                this.elRef.nativeElement.style.backgroundImage = 'url(' + data.settings.coreSettings.backgroundImageUrl + ')';
            }
        });

        this.tiles = combineLatest([
            this.tileObservable.pipe(map(tiles => tiles.filter(tile => !tile.parentId))),
            this.maxTileSubject,
            this.pageNumberSubject,
        ]).pipe(
            map(([tiles, maxTiles, pageNumber]) => this.getTilesForPage(tiles, maxTiles, pageNumber, true)),
            tap(_ => this.rootChanged++)
        );

        this.children = combineLatest([
            this.tileObservable,
            this.selectedTileSubject,
            this.maxTileSubject,
            this.pageNumberSubject,
        ])
            .pipe(
                tap(([tiles, selected, maxTiles, pageNumber]) => this.hasChildren = !!(selected && (selected.id !== "0" || selected.parentId))),
                map(([tiles, selected, maxTiles, pageNumber]) => {
                    if (!selected) {
                        return [];
                    }
                    const children = tiles.filter(child => child.parentId === selected.id || (selected.parentId && child.parentId === selected.parentId));
                    return this.getTilesForPage(children, maxTiles, pageNumber, false);
                }),
                tap(_ => this.childChanged++)
            );

        this.calculateMaxTileCounts();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['selectedTile']) {
            this.selectedTileSubject.next(this.selectedTile);
        }
    }

    @HostListener('window:resize')
    @HostListener('window:orientationchange')
    onResize() {
        this.calculateMaxTileCounts();
    }

    async moveTileNext(tile: Tile, tileList: Tile[], index: number): Promise<void> {
        const allTiles = await firstValueFrom(this.tileObservable);
        const nextTile = tileList.length > (index + 1) ? tileList[index + 1] : null;

        if (nextTile) {
            const ids = allTiles.sort((a, b) => {
                const aId = a.parentId ?? "null";
                const bId = b.parentId ?? "null";
                return aId === bId ? 0 : aId > bId ? 1 : -1;
            }).map(tile => tile.id);

            const currentIndex = ids.indexOf(tile.id);
            ids.splice(currentIndex, 1);
            const nextIndex = ids.indexOf(nextTile.id);
            ids.splice(nextIndex + 1, 0, tile.id);
            this.dataService.updateTileOrder(ids);
        }
    }

    async moveTileBack(tile: Tile, tileList: Tile[], index: number): Promise<void> {
        const allTiles = await firstValueFrom(this.tileObservable);
        const previousTile = tileList.length > 1 && index > 0 ? tileList[index - 1] : null;

        if (previousTile) {
            const ids = allTiles.sort((a, b) => {
                const aId = a.parentId ?? "null";
                const bId = b.parentId ?? "null";
                return aId === bId ? 0 : aId > bId ? 1 : -1;
            }).map(tile => tile.id);

            const currentIndex = ids.indexOf(tile.id);
            ids.splice(currentIndex, 1);
            const previousIndex = ids.indexOf(previousTile.id);
            ids.splice(previousIndex, 0, tile.id);
            this.dataService.updateTileOrder(ids);
        }
    }

    async selectTile(tile?: Tile): Promise<void> {
        if (tile && !tile.parentId) {
            this.rootChanged++;
        }

        this.select.emit(tile);
    }

    addTile(parentId?: string): void {
        this.selectTile({
            id: "0",
            name: '',
            commands: [],
            parentId: parentId
        })
    }

    async nextRootPage(): Promise<void> {
        if (this.showRootNextPage) {
            const pageNumber = await firstValueFrom(this.pageNumberSubject);
            pageNumber[0] += 1;
            this.pageNumberSubject.next(pageNumber);
        }
    }

    async nextChildPage(): Promise<void> {
        if (this.showChildNextPage) {
            const pageNumber = await firstValueFrom(this.pageNumberSubject);
            pageNumber[1] += 1;
            this.pageNumberSubject.next(pageNumber);
        }
    }

    async previousRootPage(): Promise<void> {
        if (this.showRootPreviousPage) {
            const pageNumber = await firstValueFrom(this.pageNumberSubject);
            pageNumber[0] = Math.max(1, pageNumber[0] - 1);
            this.pageNumberSubject.next(pageNumber);
        }
    }

    async previousChildPage(): Promise<void> {
        if (this.showChildPreviousPage) {
            const pageNumber = await firstValueFrom(this.pageNumberSubject);
            pageNumber[1] = Math.max(1, pageNumber[1] - 1);
            this.pageNumberSubject.next(pageNumber);
        }
    }

    /**
     * Gets the tiles that should be displayed given the full list of tiles, number of tiles to display, page number and edit mode
     * 
     * @param allTiles the list of all tiles
     * @param maxTiles the max number of tiles that can be displayed in the root and child lists
     * @param pageNumber the current page numbers of the root and child lists
     * @param forRoot if getting the tiles for root (true) or child (false)
     * @returns A sliced list of tiles to display
     */
    private getTilesForPage(allTiles: Tile[], maxTiles: [number, number], pageNumber: [number, number], forRoot: boolean): Tile[] {
        const top = forRoot ? maxTiles[0] : maxTiles[1];
        const page = (forRoot ? pageNumber[0] : pageNumber[1]);
        const skip = (page - 1) * top;
        const take = skip + top;
        const totalTileCount = allTiles.length + 1;

        if (forRoot) {
            this.showRootPreviousPage = (page > 1);
            this.showRootNextPage = (take < totalTileCount);
            this.showRootAdd = !this.showRootNextPage;
        } else {
            this.showChildPreviousPage = (page > 1);
            this.showChildNextPage = (take < totalTileCount);
            this.showChildAdd = !this.showChildNextPage;
        }

        return allTiles.slice(skip, take);
    }

    /**
     * Calculates the number of root and child tiles that can be displayed given the size of the elements
     */
    private calculateMaxTileCounts(): void {

        const tileSize = 80;
        const tileGap = 10;
        const padding = 40;

        const rootTilesElemSize = this.getElementSizeWithoutPadding(this.rootTilesElem.nativeElement);
        const childTilesElemSize = this.getElementSizeWithoutPadding(this.childTilesElem.nativeElement);

        const rootColumns = Math.floor((rootTilesElemSize.width - padding) / (tileSize + tileGap));
        const rootRows = Math.floor((rootTilesElemSize.height - padding) / (tileSize + tileGap));

        const childColumns = Math.floor((childTilesElemSize.width - padding) / (tileSize + tileGap));
        const childRows = Math.floor((childTilesElemSize.height - padding) / (tileSize + tileGap));

        this.maxTileSubject.next([rootColumns * rootRows, childColumns * childRows]);
    }

    /**
     * Gets an element's width and height without padding
     * 
     * @param element the element
     * @returns the width and height without padding
     */
    private getElementSizeWithoutPadding(element: Element): { width: number, height: number } {
        const computedStyle = getComputedStyle(element);

        const size = {
            height: element.clientHeight,
            width: element.clientWidth
        };

        size.height -= parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
        size.width -= parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);

        return size;
    }

}
