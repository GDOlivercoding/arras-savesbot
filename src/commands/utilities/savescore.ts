import { Attachment, ChatInputCommandInteraction } from 'discord.js';
import { Path } from 'pathobj/tspath';
import { SaveCode } from './code.js';
import { Data, DirSortedMode, Save, SaveStructure } from './types';
import { finished, Readable } from 'stream';
import fs from 'fs';
import saveCollection from "./saves"

const home = Path.home();
const arrasSaves = new Path("C:\\Users\\Uzivatel\\Desktop\\Directory\\content\\Arras.io saves")

const dirData = home.join("AppData", "Local", "Arras")
const logdata = dirData.join("logdata.txt")
const settings = dirData.join("settings.json")

let code: SaveCode;
let data: Data;
let savePath: Path;

// why does the constructor default to time now
const now = new Date();

async function downloadFile(url: string, fp: Path) {
    const res = await fetch(url) as any;
    if (!res.body) throw new Error("Body missing.")
    const fileStream = fs.createWriteStream(fp.toString(), { flags: 'wx' });
    finished(Readable.fromWeb(res.body).pipe(fileStream), (err) => { if (err) throw err; });
};

async function addScreenshots(windowed: Attachment | null, fullscreen: Attachment | null): Promise<[Path | null, Path | null]> {
    let [windName, fullName] = [
        windowed ? savePath.join(windowed.name).withStem("windowed") : null,
        fullscreen ? savePath.join(fullscreen.name).withStem("fullscreen") : null,
    ];

    if (windowed && windName) downloadFile(windowed.url, windName);
    if (fullscreen && fullName) downloadFile(fullscreen.url, fullName);

    return [windName, fullName];
}

function resolveRestore(interaction: ChatInputCommandInteraction): SaveStructure[] {
    const send = (...items: any[]) => {
        console.info(...items);
        interaction.editReply(items.map(i => i.toString()).join(" "))
    } 

    let targetRestore = saveCollection
        .filterSaves()
        .finishFilter()
        .find(save => {
            return save.code.ID == code.ID && save.code.innerCode != code.innerCode
        })

    if (!targetRestore) {
        // No structure update
        return [];
    }

    send("Resolving restore", targetRestore.path.name)

    let target = targetRestore.path;

    targetRestore.history.forEach(save => {
        let dir = save.path;
        dir.rename(savePath.join(dir.name));
    })

    let newLocation = target.rename(savePath.join(target.name));

    send("Resolved restore, new: ", newLocation)

    return [...targetRestore.history, targetRestore]
}

function writeToLogdata(windowed: Path | null, fullscreen: Path | null) {
    let contents = logdata.readText();
    const instNumber = parseInt(contents[0]) + 1;
    contents = instNumber + contents.slice(1);

    const text = 
`New instance on ${now.toISOString()} instance number ${instNumber}

Path: ${savePath.name}
Full-path: ${savePath}
windowed screenshot: ${windowed}
fullscreen screenshot: ${fullscreen}

Settings:
> confirmation: ${data.confirmation}
> pic_export: ${data.pic_export}
> screenshot directory: ${data.ss_dir}

Data:
> code: ${code.innerCode}
> gamemode: ${code.dirSortedMode}
> mode: ${code.mode}
> region ${code.server.region}
> score: ${code.formattedScore}
> runtime in hours: ${(code.runtimeSeconds / 3600).toFixed(2)}
> runtime in minutes: ${(code.runtimeSeconds / 60).toFixed(2)}`

    logdata.write(contents + "\n" + text)
    return text;
}

export function test(): boolean {
    if (
        !settings.exists()
        || !logdata.exists()
        || !dirData.exists()
        || !arrasSaves.exists()
    ) return false;
    
    return true;
}

export async function main(
    interaction: ChatInputCommandInteraction, 
    strcode: string, 
    windowedBuffer: Attachment | null,
    fullscreenBuffer: Attachment | null,
    restore: boolean
): Promise<Save & { written: string }> {
    if (!settings.exists()) {
        const err = new Error("Settings file doesn't exist!",)
        interaction.reply(`${err}`)
        throw err;
    }

    // WHY THE FUCK DO TRY CATCH BLOCKS HAVE THEIR OWN SCOPE
    data = JSON.parse(settings.readText());

    code = new SaveCode(strcode);

    const dirname = code.constructDirname().name

    savePath = arrasSaves.join(code.dirSortedMode, dirname);
    if (!savePath.exists()) savePath.mkdir();

    const codeFile = savePath.join("code.txt")
    codeFile.write(code.innerCode);

    const [windowed, fullscreen] = await addScreenshots(windowedBuffer, fullscreenBuffer);

    let history: SaveStructure[] = [];
    if (restore) {
        history = resolveRestore(interaction)
    };

    data.unclaimed[code.innerCode] = now.toISOString();
    settings.write(JSON.stringify(data));

    return {
        code, 
        fullscreen, 
        windowed, 
        history,
        path: savePath,
        written: writeToLogdata(windowed, fullscreen)
    };
}