export interface Tile {
    id: string
    name: string
    icon?: string
    color?: string
    parentId?: string
    active?: boolean
}

export interface ClientSettings {
    backgroundImageUrl?: string
    tileAlpha?: number
    tileBlur?: number
    theme?: string
}

export interface ClientData {
    clientSettings: ClientSettings
    tiles: Tile[]
}
