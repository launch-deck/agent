import { ClientSettings, Tile } from "@launch-deck/common";
import ChevronRight from '@mui/icons-material/ChevronRight';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import Icon from "@mui/material/Icon";

interface Props {
    tile: Tile
    clientSettings?: ClientSettings
    selected?: boolean
    showMoveBack?: boolean
    showMoveNext?: boolean
    onMoveBack?: () => void
    onMoveNext?: () => void
    onClick?: () => void
}

const hexToRgb = (hex: string, alpha: number): string | null => {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})` : null;
}

export default function Tile({ tile, clientSettings, selected, showMoveBack, showMoveNext, onMoveBack, onMoveNext, onClick }: Props) {

    let tileAlpha = 1;
    if (clientSettings?.tileAlpha !== undefined && clientSettings.tileAlpha >= 0) {
        tileAlpha = clientSettings.tileAlpha;
    }
    let tileBlur = 0;
    if (tileAlpha < 1 && clientSettings?.tileBlur !== undefined && clientSettings.tileBlur > 0) {
        tileBlur = clientSettings.tileBlur;
    }
    const theme = clientSettings?.theme || 'dark';

    const defaultBackgroundColor = theme === "dark" ? "#323232" : "#eee";
    const color = theme === "dark" ? "#fff" : "#323232";
    const backgroundColor = hexToRgb(tile.color || defaultBackgroundColor, tileAlpha) || "";
    const backdropFilter = tileBlur > 0 ? `blur(${tileBlur}px)` : '';

    return (
        <>
            <div
                className={`tile ${selected ? "selected" : ""}`}
                style={{ color, backgroundColor, backdropFilter }}
                onClick={(e) => { e.stopPropagation(); onClick ? onClick() : null }}>

                <Icon hidden={!tile.icon}>{tile.icon}</Icon>
                <span className="name">{tile.name}</span>

                <div className="sorting" hidden={!showMoveBack && !showMoveNext}>
                    <button type="button" hidden={!showMoveBack} className="move-back" onClick={(e) => { e.stopPropagation(); onMoveBack ? onMoveBack() : null }} >
                        <ChevronLeft />
                    </button>
                    <button type="button" hidden={!showMoveNext} className="move-next" onClick={(e) => { e.stopPropagation(); onMoveNext ? onMoveNext() : null }} >
                        <ChevronRight />
                    </button>
                </div >
            </div >
        </>
    );
}
