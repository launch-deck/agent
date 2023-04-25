import { useLayoutEffect, useRef, useState } from "react";
import Add from '@mui/icons-material/Add';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import TileComp from "./tile";
import { Tile } from "../interfaces";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import { selectTile, updateSortOrder } from "./redux/agent-data-slice";

const useWindowSize = () => {
    const [size, setSize] = useState([0, 0]);
    useLayoutEffect(() => {
        function updateSize() {
            setSize([window.innerWidth, window.innerHeight]);
        }
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);
    return size;
}

/**
 * Gets an element's width and height without padding
 * 
 * @param element the element
 * @returns the width and height without padding
 */
const getElementSizeWithoutPadding = (element: Element): { width: number, height: number } => {
    if (!element) {
        return {
            height: 0,
            width: 0
        }
    }

    const computedStyle = getComputedStyle(element);

    const size = {
        height: element.clientHeight,
        width: element.clientWidth
    };

    size.height -= parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
    size.width -= parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);

    return size;
}

/**
 * Calculates the number of root and child tiles that can be displayed given the size of the elements
 */
const calculateMaxTileCounts = (parentTilesElem: Element, childTilesElem: Element): [number, number] => {
    const tileSize = 80;
    const tileGap = 10;
    const padding = 40;

    const parentTilesElemSize = getElementSizeWithoutPadding(parentTilesElem);
    const childTilesElemSize = getElementSizeWithoutPadding(childTilesElem);

    const parentColumns = Math.floor((parentTilesElemSize.width - padding) / (tileSize + tileGap));
    const parentRows = Math.floor((parentTilesElemSize.height - padding) / (tileSize + tileGap));

    const childColumns = Math.floor((childTilesElemSize.width - padding) / (tileSize + tileGap));
    const childRows = Math.floor((childTilesElemSize.height - padding) / (tileSize + tileGap));

    return [parentColumns * parentRows, childColumns * childRows];
}

export default function TileLayout() {

    const dispatch = useAppDispatch();
    const allTiles = useAppSelector(state => state.agentData.tiles);
    const selected = useAppSelector(state => state.selectedTile);
    const clientSettings = useAppSelector(state => state.agentData.settings.clientSettings);
    const editMode = true;

    useWindowSize();

    const [state, setState] = useState({
        parentPageNumber: 1,
        childPageNumber: 1
    });

    const selectedTileId = selected?.id;
    const selectedParentTileId = selected?.parentId || selected?.id;

    const parentTilesElem = useRef(null);
    const childTilesElem = useRef(null);

    const parentTiles = allTiles.filter(tile => !tile.parentId);
    const childTiles = allTiles.filter(tile => tile.parentId === selectedParentTileId);

    const handleTileSelect = (tile?: Tile) => {
        dispatch(selectTile(tile));
    }

    const addTile = (e: any, parentId?: string) => {
        e.stopPropagation();

        dispatch(selectTile({
            id: "0",
            name: "",
            commands: [],
            parentId
        }));
    }

    const previousParentPage = (e: any) => {
        e.stopPropagation();
        setState({
            ...state,
            parentPageNumber: Math.max(1, state.parentPageNumber - 1)
        });
    }

    const nextParentPage = (e: any) => {
        e.stopPropagation();
        setState({
            ...state,
            parentPageNumber: state.parentPageNumber + 1
        });
    }

    const previousChildPage = (e: any) => {
        e.stopPropagation();
        setState({
            ...state,
            childPageNumber: Math.max(1, state.childPageNumber - 1)
        });
    }

    const nextChildPage = (e: any) => {
        e.stopPropagation();
        setState({
            ...state,
            childPageNumber: state.childPageNumber + 1
        });
    }

    const moveTileNext = (tile: Tile, index: number, tileList: Tile[]) => {
        const nextTile = tileList.length > (index + 1) ? tileList[index + 1] : null;

        if (nextTile) {
            const ids = allTiles.slice().sort((a, b) => {
                const aId = a.parentId ?? "null";
                const bId = b.parentId ?? "null";
                return aId === bId ? 0 : aId > bId ? 1 : -1;
            }).map(tile => tile.id);

            const currentIndex = ids.indexOf(tile.id);
            ids.splice(currentIndex, 1);
            const nextIndex = ids.indexOf(nextTile.id);
            ids.splice(nextIndex + 1, 0, tile.id);

            dispatch(updateSortOrder(ids));
        }
    }

    const moveTileBack = (tile: Tile, index: number, tileList: Tile[]) => {
        const previousTile = tileList.length > 1 && index > 0 ? tileList[index - 1] : null;

        if (previousTile) {
            const ids = allTiles.slice().sort((a, b) => {
                const aId = a.parentId ?? "null";
                const bId = b.parentId ?? "null";
                return aId === bId ? 0 : aId > bId ? 1 : -1;
            }).map(tile => tile.id);

            const currentIndex = ids.indexOf(tile.id);
            ids.splice(currentIndex, 1);
            const previousIndex = ids.indexOf(previousTile.id);
            ids.splice(previousIndex, 0, tile.id);

            dispatch(updateSortOrder(ids));
        }
    }

    const maxTiles = calculateMaxTileCounts(parentTilesElem.current as any, childTilesElem.current as any);

    const parentTop = maxTiles[0];
    const parentSkip = (state.parentPageNumber - 1) * parentTop;
    const parentTake = parentSkip + parentTop;
    const parentTileCount = parentTiles.length + 1;
    const showParentPreviousPage = (state.parentPageNumber > 1);
    const showParentNextPage = (parentTake < parentTileCount);
    const showParentAdd = !showParentNextPage;

    const childTop = maxTiles[1];
    const childSkip = (state.childPageNumber - 1) * childTop;
    const childTake = childSkip + childTop;
    const childTileCount = childTiles.length + 1;
    const showChildPreviousPage = (state.childPageNumber > 1);
    const showChildNextPage = (childTake < childTileCount);
    const showChildAdd = !showChildNextPage;

    const parents = parentTiles.slice(parentSkip, parentTake).map((tile, index) => (
        <TileComp
            key={tile.id}
            tile={tile}
            selected={tile.id === selectedTileId || tile.id === selectedParentTileId}
            showMoveBack={tile.id === selectedTileId && parentTiles.indexOf(tile) > 0}
            showMoveNext={tile.id === selectedTileId && parentTiles.indexOf(tile) + 1 < parentTiles.length}
            onMoveNext={() => moveTileNext(tile, index, parentTiles)}
            onMoveBack={() => moveTileBack(tile, index, parentTiles)}
            onClick={() => handleTileSelect(tile)} />
    ));
    const children = childTiles.slice(childSkip, childTake).map((tile, index) => (
        <TileComp
            key={tile.id}
            tile={tile}
            selected={tile.id === selectedTileId}
            showMoveBack={tile.id === selectedTileId && childTiles.indexOf(tile) > 0}
            showMoveNext={tile.id === selectedTileId && childTiles.indexOf(tile) + 1 < childTiles.length}
            onMoveNext={() => moveTileNext(tile, index, childTiles)}
            onMoveBack={() => moveTileBack(tile, index, childTiles)}
            onClick={() => handleTileSelect(tile)} />
    ));
    const hasChildren = selectedParentTileId && selectedParentTileId !== "0" && (editMode || children.length > 0);

    const imageUrl = clientSettings?.backgroundImageUrl ? `url(${clientSettings.backgroundImageUrl})` : '';
    const childBackgroundColor = clientSettings?.theme === 'light' ? "rgba(235, 235, 235, 40%)" : "rgba(20, 20, 20, 40%)";

    return (
        <div className="tile-layout" style={{ backgroundImage: imageUrl }} onClick={() => handleTileSelect()}>
            <div className="tile-container parents" ref={parentTilesElem}>
                <div className="tiles">
                    {parents}

                    <div hidden={!showParentAdd} className="tile" onClick={addTile} >
                        <Add />
                    </div>
                </div >

                <div className="previous" hidden={!showParentPreviousPage} >
                    <button type="button" onClick={previousParentPage} >
                        <ChevronLeft />
                    </button >
                </div >
                <div className="next" hidden={!showParentNextPage} >
                    <button type="button" onClick={nextParentPage} >
                        <ChevronRight />
                    </button >
                </div >
            </div >
            <div className={`tile-container children ${hasChildren ? 'has-children' : ''}`} ref={childTilesElem}>
                <div className="tiles" style={{ backgroundColor: childBackgroundColor }}>
                    {children}

                    <div hidden={!showChildAdd} className="tile" onClick={(e) => addTile(e, selectedParentTileId)} >
                        <Add />
                    </div >
                </div >

                <div className="previous" hidden={!showChildPreviousPage} >
                    <button type="button" onClick={previousChildPage} >
                        <ChevronLeft />
                    </button >
                </div >
                <div className="next" hidden={!showChildNextPage} >
                    <button type="button" onClick={nextChildPage} >
                        <ChevronRight />
                    </button >
                </div >
            </div >
        </div >
    );
}
