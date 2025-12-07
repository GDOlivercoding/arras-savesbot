import { Path } from "pathobj/tspath"
import { SaveCode } from "./code"
import {
    NumOpFunc,
    DirSortedMode,
    Region,
    Save,
    SaveQueryOptions,
    SaveStructure,
    AnySave,
    CodePartPairs,
    IDToSave,
} from "./types"
import { modes } from "./structs"

/** Path pointing to the local arras saves directory. */
export const arrasSaves = new Path(
    "C:\\Users\\Uzivatel\\Desktop\\Directory\\content\\Arras.io saves"
)

export function getScreenshots(target: Path): [Path | null, Path | null] {
    const files = target.iterDir((i) => i.isFile() && i.suffix != ".txt")
    if (!files.length) return [null, null]
    if (files.length == 1) return [files[0], null]

    let [windowed, fullscreen] = files

    if (windowed.stat().size < fullscreen.stat().size) {
        ;[windowed, fullscreen] = [fullscreen, windowed]
    }

    return [windowed, fullscreen]
}

export function interrogateBottom(bottom: Path): SaveStructure {
    const codeFile = bottom.join("code.txt")

    if (!codeFile.exists())
        throw new Error(`Code file ${codeFile} doesn't exist.`)

    const text = codeFile.readText()
    const res = SaveCode.validate(text)
    if (res.state == "err") {
        throw new Error(
            `Invalid code ${text} of file ${codeFile}: ${res.message}`
        )
    }

    const code = new SaveCode(text)

    const [windowed, fullscreen] = getScreenshots(bottom)

    return { code, path: bottom, windowed, fullscreen }
}

export function interrogateTop(top: Path): AnySave {
    const codeFile = top.join("code.txt")

    let code: undefined | SaveCode
    if (codeFile.exists()) {
        const text = codeFile.readText()
        const res = SaveCode.validate(text)
        if (res.state == "err") {
            // same here
            throw new Error(
                `Invalid code "${text}" of file "${codeFile}": "${res.message}"`
            )
        }
        code = new SaveCode(text)
    }

    const [windowed, fullscreen] = getScreenshots(top)

    /** Grab the history in a clean way. */
    const history = top
        .iterDir((i) => i.isDir())
        .map((bottom) => interrogateBottom(bottom))

    return { code, path: top, windowed, fullscreen, history }
}

/**
 * A singleton (probably) object that holds and manages arras saves.
 */
export class SaveCollection {
    /** The readonly directory target. */
    readonly target: Path
    /** The sub directories of target. */
    subs: string[] | readonly string[]
    /** The sub directories of target as Path objects. */
    pathSubs: Path[]
    /** The value of this object, an array of collected saves. */
    saves: IDToSave
    /** Temporary filter attribute, {@link SaveCollection.filterSaves} */
    draft: IDToSave
    /** Special Ended runs sub. */
    //endedRuns: SaveEndedRun[]
    /** Path to ended runs directory. */
    endedRunsPath: Path

    valueOf() {
        return this.saves
    }

    /** Get the .saves attribute as an Array of its values. */
    get savesArr() {
        return Object.values(this.saves)
    }

    // TODO include ended runs
    constructor(target: Path) {
        this.target = target
        this.subs = modes
        this.pathSubs = []
        this.draft = {}
        this.saves = {}
        // this.endedRuns = [];
        this.endedRunsPath = this.target.join("Ended Runs")

        for (const save of this.loadSubs(...this.subs)) {
            if (!save.code)
                throw new Error(`Code file of save ${save.path} doesn't exist.`)
            this.saves[save.code.ID] = save
        }

        console.log(`Collected ${this.savesArr.length} saves.`)

        //for (let endedSave of this.loadSubs("Ended Runs")) {
        //    if (endedSave.code) throw Error(`Save ${endedSave.path} is an Ended Run but has code ${endcode}.`)
        //    this.endedRuns.push(endedSave);
        //}
    }

    private *loadSubs(
        ...subs: (string | Path)[]
    ): Generator<AnySave, void, void> {
        for (const mode of subs) {
            const path = this.target.join(mode)
            this.pathSubs.push(path)

            for (const save of path.iterDir((i) => i.isDir())) {
                yield interrogateTop(save)
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
        const save = this.getSaveByID(ID)
        if (!save) {
            throw new Error(`Save with id ${ID} doesn't exist.`)
        }

        const path = save.path
        const newPath = this.endedRunsPath.join(path.name)
        path.rename(newPath)

        // this.endedRuns[ID] = save;
        delete this.saves[ID]
        return save
    }

    // TODO
    register(save: SaveStructure) { return save };

    // filtering, searching, querying...

    // This will be added later.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    filterSaves(includeEndedRuns?: boolean) {
        //if (includeEndedRuns) {
        //    this.draft = {...this.saves, ...this.endedRuns};
        //} else {
        //    this.draft = this.saves;
        //}
        for (const ID in this.saves) {
            this.draft[ID] = this.saves[ID]
        }
        return this
    }

    /**
     * Inplace operation to delete all saves from {@link SaveCollection.draft}
     * that don't satisfy the specified callback.
     * @param callback The callback to filter the saves by.
     */
    filterByCallback(
        callback: (save: Save, index: number, arr: Save[]) => boolean
    ) {
        Object.values(this.draft)
            .filter((...args) => !callback(...args))
            .forEach((save) => {
                delete this.draft[save.code.ID]
            })
        return this
    }

    byScreenshotCount(countFunc: NumOpFunc) {
        this.filterByCallback((save) => {
            let total = 0
            if (save.windowed) total++
            if (save.fullscreen) total++
            return countFunc(total)
        })
        return this
    }

    byDirSortedMode(mode: DirSortedMode) {
        this.filterByCallback((save) => {
            return mode == save.code.dirSortedMode  
        })
        return this
    }

    byCodePartKeys(
        pairs: CodePartPairs
    ) {
        for (const pair of pairs) {
            const {key, predicate} = pair;
            this.filterByCallback(save => predicate(save.code[key]))
        }
    }

    byHistoryCount(historyCount: NumOpFunc) {
        this.filterByCallback((save) => historyCount(save.history.length))
        return this
    }

    byRegion(region: Region) {
        this.filterByCallback((save) => save.code.server.region == region)
        return this
    }

    finishFilter() {
        const results = Object.values(this.draft)
        this.draft = {}
        return results
    }

    querySaves(
        { screenshots, dirSortedMode, history, region, codeParts }: SaveQueryOptions, 
        includeEndedRuns?: boolean
): Save[] {
        this.filterSaves(includeEndedRuns)
        if (screenshots != null) this.byScreenshotCount(screenshots)
        if (dirSortedMode != null) this.byDirSortedMode(dirSortedMode)
        if (history != null) this.byHistoryCount(history)
        if (region != null) this.byRegion(region)
        if (codeParts != null) this.byCodePartKeys(codeParts)
        return this.finishFilter()
    }
}

export default new SaveCollection(arrasSaves)