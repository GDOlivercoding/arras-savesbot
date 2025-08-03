import { Path } from "pathobj/tspath";
import { Build, SaveCode } from "./code";
import { NumOpFunc, DirSortedMode, Region, Save, SaveQueryOptions, SaveStructure, ModeToDescription, PickedCodeKeys, SaveEndedRun, AnySave } from "./types";
import { Gamemode } from "arras-parser/types";

export const arrasSaves = new Path("C:\\Users\\Uzivatel\\Desktop\\Directory\\content\\Arras.io saves")
export const modes: DirSortedMode[] = [
    "Normal", "Growth", 
    "Arms Race", "Olddreads", "Newdreads"
];

export const modeToDescription: ModeToDescription = {
    Normal: "Modes without excessively modifiers, usually connected to nexus. (except Portal)",
    Growth: "Deprecated save type. Saves if the mode is growth or overgrowth.",
    "Arms Race": "If the mode has the Arms Race prefix, lower in the hierarchy than growth.",
    Olddreads: "The Old Dreadnoughts gamemode, any mode with 'old' in it.",
    Newdreads: "Any v2 Dreadnought, this also includes any runs in the new Labyrinth."
}

export const regions: Region[] = [
    "Europe", "US West", 
    "US Central", "Oceania", "Asia"
]

export type ShortKey = typeof indexToKey[number]

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
] as const;

export const keyToAttrname = {
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
} as const;

function getScreenshots(target: Path): [Path | null, Path | null] {
    const files = target.iterDir(i => i.isFile() && i.suffix != ".txt");
    if (!files.length) return [null, null]
    if (files.length == 1) return [files[0], null]

    let [windowed, fullscreen] = files;

    if (windowed.stat().size < fullscreen.stat().size) {
        [windowed, fullscreen] = [fullscreen, windowed];
    }

    return [windowed, fullscreen]

}

function interrogateBottom(bottom: Path): SaveStructure {
    const codeFile = bottom.join("code.txt");

    if (!codeFile.exists()) 
        throw new Error(`Code file ${codeFile} doesn't exist.`)

    const text = codeFile.readText();
    const res = SaveCode.validate(text);
    if (res.state == "err") {
        // same here
        throw new Error(`Invalid code ${text} of file ${codeFile}: ${res.message}`)
    }

    const code = new SaveCode(text);
    
    const [windowed, fullscreen] = getScreenshots(bottom);

    return {code, path: bottom, windowed, fullscreen}
}

function interrogateTop(top: Path): AnySave {
    const codeFile = top.join("code.txt");

    let code: undefined | SaveCode;
    if (codeFile.exists()) {
        const text = codeFile.readText();
        const res = SaveCode.validate(text);
        if (res.state == "err") {
            // same here
            throw new Error(`Invalid code "${text}" of file "${codeFile}": "${res.message}"`)
        }
        code = new SaveCode(text);
    }
    
    const [windowed, fullscreen] = getScreenshots(top);

    /** Grab the history in a clean way. */
    const history = top.iterDir(i => i.isDir()).map(bottom => interrogateBottom(bottom))

    return {code, path: top, windowed, fullscreen, history}
}

interface IDToSave {
    [ID: string]: Save
}

export class SaveCollection {
    /** The readonly directory target. */
    readonly target: Path
    /** The sub directories of target. */
    subs: string[];
    /** The sub directories of target as Path objects. */
    pathSubs: Path[];
    /** The value of this object, an array of collected saves. */
    saves: IDToSave
    /** Temporary filter attribute, {@link SaveCollection.filterSaves} */
    draft: IDToSave
    /** Special Ended runs sub. */
    //endedRuns: SaveEndedRun[]
    /** Path to ended runs directory. */
    endedRunsPath: Path

    valueOf() {
        return this.saves;
    }

    get savesArr() {
        return Object.values(this.saves);
    }

    // TODO include ended runs
    constructor(target: Path) {
        this.target = target;
        this.subs = modes;
        this.pathSubs = [];
        this.draft = {};
        this.saves = {};
        // this.endedRuns = [];
        this.endedRunsPath = this.target.join("Ended Runs");

        for (let save of this.loadSubs(...this.subs)) {
            if (!save.code) throw new Error(`Code file of save ${save.path} doesn't exist.`)
            this.saves[save.code.ID]
        }

        //for (let endedSave of this.loadSubs("Ended Runs")) {
        //    if (endedSave.code) throw Error(`Save ${endedSave.path} is an Ended Run but has code ${endcode}.`)
        //    this.endedRuns.push(endedSave);
        //}
    }

    private *loadSubs(...subs: (string | Path)[]): Generator<AnySave, void, any> {
        for (let mode of subs) {
            let path = this.target.join(mode);
            this.pathSubs.push(path);

            for (let save of path.iterDir(i => i.isDir())) {
                yield interrogateTop(save);
            }
        }
    }

    // MISC

    getSaveByID(ID: string) {
        return this.saves[ID]
    }

    /**
     * Discard this save, put it into the Ended Runs category and return it.
     * FileIO and innerIO operation.
     * @param ID The ID of the target save to discard.
     * @returns The discarded save captured by its ID.
     */
    discard(ID: string): Save {
        let save = this.getSaveByID(ID);
        if (!save) {
            throw new Error(`Save with id ${ID} doesn't exist.`)
        }

        let path = save.path;
        let newPath = this.endedRunsPath.join(path.name)
        path.rename(newPath)

        // this.endedRuns[ID] = save;
        delete this.saves[ID]
        return save;
    }

    // filtering, searching, querying...

    filterSaves(includeEndedRuns?: boolean) {
        //if (includeEndedRuns) {
        //    this.draft = {...this.saves, ...this.endedRuns};
        //} else {
        //    this.draft = this.saves;
        //}
        this.draft = this.saves;
        return this;
    }

    /**
     * Private inplace operation to delete all saves from {@link SaveCollection.draft}
     * that don't satisfy the specified callback.
     * @param callback The callback to filter the saves by.
     */
    private filterByCallback(callback: (save: Save, index: number, arr: Save[]) => boolean) {
        Object.values(this.draft)
        .filter(callback)
        .forEach(save => {delete this.draft[save.code.ID]})
    }

    byScreenshotCount(countFunc: NumOpFunc) {
        this.filterByCallback(save => {
            let total = 0;
            if (save.windowed) total++;
            if (save.fullscreen) total++;
            return countFunc(total);
        })
        return this;
    }

    byDirSortedMode(mode: DirSortedMode[]) {
        this.filterByCallback(save => {
            return mode.includes(save.code.dirSortedMode)
        });
        return this;
    }

    byCodePartKey<K extends PickedCodeKeys>(pair: [K, (statVal: SaveCode[K]) => boolean]) {
        const [key, predicate] = pair;
        this.filterByCallback(save => predicate(save.code[key]))
    }

    byHistoryCount(historyCount: NumOpFunc) {
        this.filterByCallback(save => historyCount(save.history.length))
        return this;
    }

    byRegion(region: Region) {
        this.filterByCallback(save => save.code.server.region == region)
        return this
    }

    finishFilter() {
        let results = this.draft;
        this.draft = {};
        return Object.values(results);
    }

    querySaves(options: SaveQueryOptions, includeEndedRuns?: boolean): Save[] {
        const {
            screenshots,
            dirSortedMode,
            history,
            region,
            codeParts
        } = options;

        this.filterSaves(includeEndedRuns);
        if (screenshots != null) this.byScreenshotCount(screenshots);
        if (dirSortedMode != null) this.byDirSortedMode(dirSortedMode);
        if (history != null) this.byHistoryCount(history);
        if (region != null) this.byRegion(region);
        if (codeParts != null) codeParts.forEach(part => this.byCodePartKey(part))
        return this.finishFilter();
    }
}

export default new SaveCollection(arrasSaves)