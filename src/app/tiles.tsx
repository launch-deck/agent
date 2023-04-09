import { Tile, Settings, ClientSettings } from "@launch-deck/common";
import { useEffect, useState } from "react";
import TileEdit from "./tile-edit";
import TileLayout from "./tile-layout";
import contextBridge from "./context-bridge";
import SettingsComp from "./settings";

export default function Tiles() {

    const [updateIndex, setUpdateIndex] = useState(0);
    const [selected, setSelected] = useState<Tile>();
    const [data, setData] = useState<{ tiles: Tile[], settings?: Settings }>({
        tiles: [] as Tile[],
    });

    useEffect(() => {
        Promise.all([
            contextBridge.getTiles(),
            contextBridge.getSettings()
        ]).then(([tiles, settings]) => {
            setSelected(() => tiles.find(t => t.id === selected?.id));

            setData(() => ({
                tiles,
                settings
            }));
        });
    }, [updateIndex]);

    const selectTile = (tile?: Tile) => {
        setSelected(tile);
    }

    const handleSettingsChanged = (settings: Settings): void => {
        setData({
            ...data,
            settings
        });
    }

    const handleSettingsSave = async (): Promise<void> => {
        if (data.settings) {
            await contextBridge.updateSettings(data.settings);
        }
    }

    const handleSettingsCancel = async (): Promise<void> => {
        const settings = await contextBridge.getSettings();
        setData({
            ...data,
            settings
        });
    }

    const handleSave = async (tile: Tile) => {
        await contextBridge.upsertTile(tile);
        setSelected(() => tile)
        setUpdateIndex(() => updateIndex + 1);
    }

    const handleDelete = async (tile: Tile) => {
        await contextBridge.deleteTile(tile.id);
        setUpdateIndex(updateIndex + 1);
    }

    if (selected) {
        return (
            <div className="tilePage">
                <TileLayout
                    allTiles={data.tiles}
                    selected={selected}
                    clientSettings={data.settings?.clientSettings}
                    editMode={true}
                    onTileSelect={selectTile}
                    onOrderUpdate={() => setUpdateIndex(updateIndex + 1)}></TileLayout>
                <TileEdit
                    key={selected.id}
                    tile={selected}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onDeselect={() => selectTile()}></TileEdit>
            </div>
        );
    } else {
        return (
            <div className="tilePage">
                <TileLayout
                    allTiles={data.tiles}
                    selected={selected}
                    clientSettings={data.settings?.clientSettings}
                    editMode={true}
                    onTileSelect={selectTile}
                    onOrderUpdate={() => setUpdateIndex(updateIndex + 1)}></TileLayout>
                <SettingsComp
                    settings={data.settings}
                    onSave={handleSettingsSave}
                    onCancel={handleSettingsCancel}
                    settingsChanged={handleSettingsChanged} />
            </div>
        );
    }
}
