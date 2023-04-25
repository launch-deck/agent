import TileEdit from "./tile-edit";
import TileLayout from "./tile-layout";
import SettingsComp from "./settings";
import { useAppSelector } from "./redux/hooks";

export default function Tiles() {

    const selectedTile = useAppSelector(state => state.selectedTile);

    if (selectedTile) {
        return (
            <div className="tilePage">
                <TileLayout />
                <TileEdit />
            </div>
        );
    } else {
        return (
            <div className="tilePage">
                <TileLayout />
                <SettingsComp />
            </div>
        );
    }
}
