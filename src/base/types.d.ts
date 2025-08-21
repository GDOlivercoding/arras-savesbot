import { ChatInputCommandInteraction, SlashCommandOptionsOnlyBuilder } from "discord.js"
import { SaveCode } from "./code"
import { Path } from "pathobj/tspath"
import { ShortKey } from "./structs"

// commands

interface Command {
    payload: SlashCommandOptionsOnlyBuilder
    execute(interaction: ChatInputCommandInteraction): Promise<unknown>
    test(): boolean
}

// saves and structures

type PartialNullable<T> = {
    [P in keyof T]?: T[P] | null
}

export type DirSortedMode =
    | "Normal"
    | "Growth"
    | "Arms Race"
    | "Olddreads"
    | "Newdreads"

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

export type SaveQueryOptions = PartialNullable<{
    screenshots: NumOpFunc
    dirSortedMode: DirSortedMode
    history: NumOpFunc
    region: Region
    codeParts: CodePartMap
}>

// operator syntax

export type OperFunc = (statVal: number, userVal: number) => boolean
export type NumOpFunc = (statVal: number) => boolean

// map for find.ts

export type ModeToDescription = {
    [K in DirSortedMode]: string
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
    [K in PickedCodeKeys]: (
        userVal: string
    ) => (statVal: SaveCode[K]) => boolean
}

export type KeyToAttrname = {
    [K in ShortKey]: PickedCodeKeys
}

// TODO tighten these types later.
export type CodePartPair = {
    key: PickedCodeKeys,
    predicate: CodePartFunc
}

type CodePartFunc = (statVal: unknown) => boolean

export type CodePartPairs = CodePartPair[]

type DateSuffixes = "y" | "mon" | "d" | "h" | "min" | "s" | "ms"

type DateOperationMap = Partial<{
    [K in DateSuffixes]: number
}>

type State = {state: "ok" | "err", message: string}

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
    unclaimed: { [code: string]: string }
    /**
     * path
     */
    restore: string | null
}
