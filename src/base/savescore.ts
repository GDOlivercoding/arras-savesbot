// packages
import { Attachment } from "discord.js"
import { Path } from "pathobj/tspath"

// local
import { SaveCode } from "./code"
import { Data, Save, SaveStructure } from "./types"
import saveCollection from "./saves"
import { downloadFile } from "./utils"

const home = Path.home()
const arrasSaves = new Path(
    "C:\\Users\\Uzivatel\\Desktop\\Directory\\content\\Arras.io saves"
)

const dirData = home.join("AppData", "Local", "Arras")
const logdata = dirData.join("logdata.txt")
const settings = dirData.join("settings.json")

let code: SaveCode
let data: Data
let savePath: Path

// why does the constructor default to time now
const now = new Date()

async function addScreenshots(
    windowed: Attachment | null,
    fullscreen: Attachment | null
): Promise<[Path | null, Path | null]> {
    const [windName, fullName] = [
        windowed ? savePath.join(windowed.name).withStem("windowed") : null,
        fullscreen
            ? savePath.join(fullscreen.name).withStem("fullscreen")
            : null
    ]

    if (windowed && windName) downloadFile(windowed.url, windName)
    if (fullscreen && fullName) downloadFile(fullscreen.url, fullName)

    return [windName, fullName]
}

function resolveRestore(): SaveStructure[] {
    // return a list of the new save history

    // ffs with these types man
    const send = (...items: { toString(): string }[]) => {
        console.info(...items)
    }

    const targetRestore = saveCollection.savesArr.find((save) => {
        return save.code.ID == code.ID && save.code.innerCode != code.innerCode
    })

    if (!targetRestore) {
        // No structure update
        return []
    }

    send("Resolving restore", targetRestore.path.name)

    const target = targetRestore.path

    targetRestore.history.map(save => save.path).forEach((dir) => {
        dir.rename(savePath.join(dir.name))
    })

    const newLocation = target.rename(savePath.join(target.name))

    send("Resolved restore, new: ", newLocation)

    return [...targetRestore.history, targetRestore]
}

function writeToLogdata(windowed: Path | null, fullscreen: Path | null) {
    let contents = logdata.readText()
    const instNumber = parseInt(contents[0]) + 1
    contents = instNumber + contents.slice(1)

    const text = `New instance on ${now.toISOString()} instance number ${instNumber}

Path: ${savePath.name}
Full-path: ${savePath}
windowed screenshot: ${windowed}
fullscreen screenshot: ${fullscreen}

Settings:
\\> confirmation: ${data.confirmation}
\\> pic_export: ${data.pic_export}
\\> screenshot directory: ${data.ss_dir}

Data:
\\> code: ${code}
\\> gamemode: ${code.dirSortedMode}
\\> mode: ${code.mode}
\\> region ${code.server.region}
\\> score: ${code.formattedScore}
\\> runtime in hours: ${(code.runtimeSeconds / 3600).toFixed(2)}h
\\> runtime in minutes: ${(code.runtimeSeconds / 60).toFixed(2)}min`

    logdata.write(contents + "\n" + text)
    return text
}

export function test(): boolean {
    return (
        settings.exists() 
        && logdata.exists() 
        && dirData.exists() 
        && arrasSaves.exists()
    )
}

export async function main(
    strcode: string,
    windowedBuffer: Attachment | null,
    fullscreenBuffer: Attachment | null,
    restore: boolean
): Promise<Save & { written: string }> {
    if (!settings.exists()) {
        throw Error("Settings file doesn't exist!")
    }

    data = JSON.parse(settings.readText())

    const res = SaveCode.validate(strcode);
    if (res.state == "err") {
        throw Error(`Invalid Code: ${res.message}`)
    }
    
    code = new SaveCode(strcode)

    const dirname = code.constructDirname().name

    savePath = arrasSaves.join(code.dirSortedMode, dirname)
    if (!savePath.exists()) savePath.mkdir()

    const codeFile = savePath.join("code.txt")
    codeFile.write(code.innerCode)

    const [windowed, fullscreen] = await addScreenshots(
        windowedBuffer,
        fullscreenBuffer
    )

    let history: SaveStructure[] = []
    if (restore) {
        history = resolveRestore()
    }

    data.unclaimed[code.innerCode] = now.toISOString()
    settings.write(JSON.stringify(data))

    return {
        code,
        fullscreen,
        windowed,
        history,
        path: savePath,
        written: writeToLogdata(windowed, fullscreen)
    }
}
