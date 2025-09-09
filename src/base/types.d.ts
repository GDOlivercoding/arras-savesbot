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

type PartialNullable<T> = Partial<{
    [P in keyof T]: T[P] | null
}>

type DirSortedMode =
    | "Normal"
    | "Growth"
    | "Arms Race"
    | "Olddreads"
    | "Newdreads"

type Region = "Europe" | "US West" | "US Central" | "Oceania" | "Asia"
type RegionChar = "e" | "w" | "c" | "o" | "a"

/** Bare structure of save, usually present as a history save */
interface SaveStructure {
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
interface Save extends SaveStructure {
    history: SaveStructure[]
}

/** Save or Save history */
interface SaveOrSaveStruct extends SaveStructure {
    history?: SaveStructure[]
}

/** a Top level save of an ended run */
interface SaveEndedRun extends Save {
    code: undefined
}

type AnySave = Save | SaveEndedRun

type SaveQueryOptions = PartialNullable<{
    screenshots: EvaluatorFunc
    dirSortedMode: DirSortedMode
    history: EvaluatorFunc
    region: Region
    codeParts: CodePartPairs
}>

// operator syntax

type EvaluatorFunc<V> = (statVal: V) => boolean
type CompilerFunc<R> = (userVal: string) => R

type NumOpFunc = (statVal: number) => boolean
type OperFunc = (statVal: number, userVal: number) => boolean

// map for find.ts

type ModeToDescription = {
    [K in DirSortedMode]: string
}

type PickedCodeKeys =
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
    | "safetyToken";

type AttrnameToCompiler = {
    [K in PickedCodeKeys]: CompilerFunc<EvaluatorFunc<SaveCode[K]>>
}

type KeyToAttrname = {
    [K in ShortKey]: PickedCodeKeys
}

// TODO tighten these types later.
type CodePartPair = {
    key: PickedCodeKeys,
    predicate: CodePartFunc
}

type CodePartFunc = (statVal: unknown) => boolean

type CodePartPairs = CodePartPair[]

type DateSuffixes = "y" | "mon" | "d" | "h" | "min" | "s"

type DateOperationMap = Partial<{
    [K in DateSuffixes]: number
}>

type State = {state: "ok" | "err", message: string}

// /.../settings.json structure
type Data = {
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
    unclaimed: Record<string, string>
    /**
     * path
     */
    restore: string | null
}
