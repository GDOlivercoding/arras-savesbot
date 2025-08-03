import { ChatInputCommandInteraction } from "discord.js"
import { SaveCode } from "./code"
import { Path } from "pathobj/tspath"
import { keyToAttrname } from "./saves"

// commands 

interface Command {
    payload: { toJSON(): any; [x: string]: any }
    execute(interaction: ChatInputCommandInteraction): Promise<any>
    test(): boolean
}

// saves and structures

type MakeOptional<T> = {
    [P in keyof T]?: T[P] | null
}

export type DirSortedMode = 'Normal' | 'Growth' | 'Arms Race' | 'Olddreads' | 'Newdreads';

export type Region = "Europe" | "US West" | "US Central" | "Oceania" | "Asia"
export type RegionChar = "e" | "w" | "c" | "o" | "a"

/** Bare structure of save, usually present as a history save */
export interface SaveStructure {
    /** Parsed and validated code of `path.join("code.txt")` file. */
    code: SaveCode
    /** Path pointing to the directory this save belongs to. */
    path: Path
    /** Path pointing to the windowed screenshot of this save (optional). */
    windowed: Path | null
    /** Path pointing to the fullscreen screenshot of this save (optional). */
    fullscreen: Path | null
}

/** Top level save, the current version of save history. */
export interface Save extends SaveStructure {
    history: SaveStructure[]
}

/** Save or Save history */
export interface SaveOrSaveStruct extends SaveStructure {
    history?: SaveStructure[]
}

/** a Top level save of an ended run */
export interface SaveEndedRun extends Save {
    code: undefined
}

export type AnySave = Save | SaveEndedRun

export type SaveQueryOptions = MakeOptional<{
    screenshots: NumOpFunc
    dirSortedMode: DirSortedMode[]
    history: NumOpFunc
    region: Region
    codeParts: CodePartPair[]
}>

// operator syntax

export type OperFunc = (statVal: number, userVal: number) => boolean
export type NumOpFunc = (statVal: number) => boolean

// map for find.ts

export type ModeToDescription = {
    [K in DirSortedMode]: string;
}

export type PickedCodeKeys = 
    | "ID" 
    | "server" 
    | "mode"
    | "tankClass"
    | "build"
    | "rawScore"
    | "runtimeSeconds"
    | "kills"
    | "assists"
    | "bossKills"
    | "polygonsDestroyed"
    | "customKills"
    | "creationTime"
    | "safetyToken"

export type AttrnameToCompiler = {
    [K in keyof Pick<SaveCode, PickedCodeKeys>]: (userVal: string) => (statVal: SaveCode[K]) => boolean
}

// TODO tighten these types later.
export type CodePartFunc = (statVal: string | number | Server | Gamemode | Build | Date) => boolean
export type CodePartPair = [PickedCodeKeys, CodePartFunc]

/**
 * Keys interface captures the key's name and the type of parameter
 * being passed in.
 */
export interface Keys {
    id: never // code ID, ???
    server: never // server id, ???
    // \region: {} // region NAME, strictly match for NAME // non code fields are going to be special
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