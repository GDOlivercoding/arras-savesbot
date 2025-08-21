import { DirSortedMode, ModeToDescription, Region, KeyToAttrname } from "./types"

export const modes: DirSortedMode[] = [
    "Normal",
    "Growth",
    "Arms Race",
    "Olddreads",
    "Newdreads"
]

export const modeToDescription: ModeToDescription = {
    Normal: "Modes without excessively modifiers, usually connected to nexus. (except Portal)",
    Growth: "Deprecated save type. Saves if the mode is growth or overgrowth.",
    "Arms Race": "If the mode has the Arms Race prefix, lower in the hierarchy than growth.",
    Olddreads: "The Old Dreadnoughts gamemode, any mode with 'old' in it.",
    Newdreads: "Any v2 Dreadnought, this also includes any runs in the new Labyrinth."
}

export const regions: Region[] = [
    "Europe",
    "US West",
    "US Central",
    "Oceania",
    "Asia"
]

export type ShortKey = (typeof indexToKey)[number]

export const indexToKey = [
    "id", // code ID, ???
    "server", // server id, ???
    "mode", // Gamemode object, ???
    "tank", // tank class query, match if includes insensitively
    "build", // Tank build, ???
    "score", // raw score integer, Comparison operation
    "runtime", // raw runtime seconds integer, comparison operatio
    // add a mode readable way to do this after (ex.: >=[1d 15h])
    "kills", // not yet implemented, implement simple comparison operation
    "assists", // not yet implemented, implement simple comparison operation
    "bosses", // not yet implemented, implement simple comparison operation
    "polygons", // not yet implemented, implement simple comparison operation
    "custom", // not yet implemented, implement simple comparison operation
    "creation", // implement unix timestamp comparison and >=[1d 15h] (relative now to creation time)
    "token" // why the fuck why would we match the token
] as const

export const keyToAttrname: KeyToAttrname = {
    id: "ID",
    server: "server",
    mode: "mode",
    tank: "tankClass",
    build: "build",
    score: "rawScore",
    runtime: "runtimeSeconds",
    kills: "kills",
    assists: "assists",
    bosses: "bossKills",
    polygons: "polygonsDestroyed",
    custom: "customKills",
    creation: "creationTime",
    token: "safetyToken"
}