import { Path } from "pathobj/tspath";
import { SaveCode } from "./code";
import { CompiledFunc, DirSortedMode, Region, Save, SaveQueryOptions, SaveStructure } from "./types";

export const arrasSaves = new Path("C:\\Users\\Uzivatel\\Desktop\\Directory\\content\\Arras.io saves")
export const modes: DirSortedMode[] = [
    "Normal", "Growth", 
    "Arms Race", "Olddreads", "Newdreads"
];

export type ModeToDescription = {
    [K in typeof modes[number]]: string;
}

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

export const keys = {
    id: {}, // code ID, ???
    server: {}, // server id, ???
    mode: {}, // Gamemode object, ???
    tank: {}, // tank class query, match if includes insensitively
    build: {}, // Tank build, ???
    score: {}, // raw score integer, Comparison operation
    runtime: {}, // raw runtime seconds integer, comparison operatio
               // add a mode readable way to do this after (ex.: >=[1d 15h])
    kills: {}, // not yet implemented, implement simple comparison operation
    assists: {}, // not yet implemented, implement simple comparison operation
    bosses: {}, // not yet implemented, implement simple comparison operation
    polygons: {}, // not yet implemented, implement simple comparison operation
    custom: {}, // not yet implemented, implement simple comparison operation
    creation: {}, // implement unix timestamp comparison and >=[1d 15h] (relative now to creation time)
    token: {} // why the fuck why would we match the token
};

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

function interrogate(target: Path): SaveStructure {
    const codeFile = target.join("code.txt");
    if (!codeFile.exists()) 
        // there has to be a better way
        throw new Error(`Save ${codeFile} doesnt exist.`)

    const text = codeFile.readText();
    const res = SaveCode.validate(text);
    if (res.state == "err") {
        // same here
        throw new Error(`Invalid code ${text} of file ${codeFile}: ${res.message}`)
    }

    const code = new SaveCode(text);

    const [windowed, fullscreen] = getScreenshots(target);

    return {code, path: target, windowed, fullscreen}
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
    endedRuns: IDToSave
    /** Path to ended runs directory. */
    endedRunsPath: Path

    valueOf() {
        return this.saves;
    }

    constructor(target: Path) {
        this.target = target;
        this.subs = modes;
        this.pathSubs = [];
        this.draft = {};
        this.saves = {};
        this.endedRuns = {};
        this.endedRunsPath = this.target.join("Ended Runs");

        for (let save of this.loadSubs(...this.subs)) {
            this.saves[save.code.ID] = save;
        }

        for (let endedRun of this.loadSubs("Ended Runs")) {
            this.endedRuns[endedRun.code.ID] = endedRun;
        }
    }

    private *loadSubs(...subs: (string | Path)[]): Generator<Save, void, any> {
        for (let mode of subs) {
            let path = this.target.join(mode);
            this.pathSubs.push(path);

            for (let save of path.iterDir(i => i.isDir())) {

                const history: SaveStructure[] = [];
                for (let oldSave of save.iterDir(i => i.isDir())) {
                    history.push(interrogate(oldSave));
                }
                
                const { code, path, windowed, fullscreen } = interrogate(save);
                yield { code, path, windowed, fullscreen, history }
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
    discard(ID: string) {
        let save = this.getSaveByID(ID);
        if (!save) {
            throw new Error(`Save with id ${ID} doesn't exist.`)
        }

        let path = save.path;
        let newPath = this.endedRunsPath.join(path.name)
        path.rename(newPath)

        this.endedRuns[ID] = save;
        delete this.saves[ID]
        return save;
    }

    // filtering, searching, querying...

    filterSaves(includeEndedRuns?: boolean) {
        if (includeEndedRuns) {
            this.draft = {...this.saves, ...this.endedRuns};
        } else {
            this.draft = this.saves;
        }
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

    byScreenshotCount(countFunc: CompiledFunc) {
        this.filterByCallback(save => {
            let total = 0;
            if (save.windowed) total++;
            if (save.fullscreen) total++;
            return countFunc(total);
        })
        return this;
    }

    // byTankClassQuery(tankClassQuery: string) {
    //    const transform = (s: string) => s
    //        .toLowerCase()
    //        .replace(/[ |-]/g, "");
    //
    //    tankClassQuery = transform(tankClassQuery)

    //    this.draft = this.draft.filter(save => {
    //        return transform(save.code.tankClass).includes(tankClassQuery)
    //    });
    //    return this;
    //}

    byDirSortedMode(mode: DirSortedMode[]) {
        this.filterByCallback(save => {
            return mode.includes(save.code.dirSortedMode)
        });
        return this;
    }

    byCodePartKey<K extends keyof typeof keys>(key: K, value: typeof keys[K]) {

    }

    byHistoryCount(historyCount: CompiledFunc) {
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
            region
        } = options;

        this.filterSaves(includeEndedRuns);
        if (screenshots != null) this.byScreenshotCount(screenshots);
        if (dirSortedMode != null) this.byDirSortedMode(dirSortedMode);
        if (history != null) this.byHistoryCount(history);
        if (region != null) this.byRegion(region);
        return this.finishFilter();
    }
}

export default new SaveCollection(arrasSaves)