import { ChatInputCommandInteraction } from "discord.js"
import { SaveCode } from "./code"
import { Path } from "pathobj/tspath"

// commands 

interface Command {
    payload: { toJSON(): any; [x: string]: any }
    execute(interaction: ChatInputCommandInteraction): Promise<any>
    test(): boolean
}

// saves and strucutres

type MakeOptional<T> = {
    [P in keyof T]?: T[P] | null
}

export type DirSortedMode = 'Normal' | 'Growth' | 'Arms Race' | 'Olddreads' | 'Newdreads';

export type Region = "Europe" | "US West" | "US Central" | "Oceania" | "Asia"
export type RegionChar = "e" | "w" | "c" | "o" | "a"

export type SaveStructure = {
    code: SaveCode
    path: Path
    windowed: Path | null
    fullscreen: Path | null
}

export type Save = SaveStructure & { history: SaveStructure[] }

export type SaveOrSaveStruct = SaveStructure & { history?: SaveStructure[] }

export type SaveQueryOptions = MakeOptional<{
    screenshots: CompiledFunc
    dirSortedMode: DirSortedMode[]
    history: CompiledFunc
    region: Region
}>

// operator syntax

export type OperFunc = (statVal: number, userVal: number) => boolean
export type CompiledFunc = (statVal: number) => boolean

// map for find.ts

export type ModeToDescription = {
    [K in DirSortedMode]: string;
}

/**
 * Keys interface captures the key's name and the type of parameter
 * being passed in.
 */
export interface Keys {
    id: never // code ID, ???
    server: never // server id, ???
    // region: {} // region NAME, strictly match for NAME // non code fields are going to be speciaů
    mode: never // Gamemode object, ???
    tank: string // tank class query, match if includes insensitively
    build: never // Tank build, ???
    score: number // raw score integer, Comparison operation
    runtime: number // raw runtime seconds integer, comparison operatio
               // add a mode readable way to do this after (ex.: >=[1d 15h])
    kills: number // not yet implemented, implement simple comparison operation
    assists: number // not yet implemented, implement simple comparison operation
    bosses: number // not yet implemented, implement simple comparison operation
    polygons: number // not yet implemented, implement simple comparison operation
    custom: number // not yet implemented, implement simple comparison operation
    creation: Date // implement unix timestamp comparison and >=[1d 15h] (relative literal now to creation time)
    token: never // probably actually never // why the fuck why would we match the token
};

// /.../settings.json structure
export type Data = {
    fullscreen_ss: string
    windowed_ss: string
    single_ss: string
    pic_export: 0 | 1 | 2 
    confirmation: boolean
    ss_dir: string // Maybe path conversion
    open_dirname: boolean
    /**
     * code: iso format
     */
    unclaimed: {[code: string]: string} 
    /**
     * path
     */
    restore: string | null 
}