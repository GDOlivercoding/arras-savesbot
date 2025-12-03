import { Path } from "pathobj/tspath";
import { finished, Readable } from "stream";

export const unixFormat = {
    /** 01:46 */
    HHMM: "t",
    /** 01:46:24 */
    HHMMSS: "T",
    /** 31.07.2025 */
    DDMMYYYY: "d",
    /** 09 July 2025 */
    DDmmmmYYYY: "D",
    /** 09 July 2025 01:47 */
    DDmmmmYYYY_HHMM: "f",
    /** Wed 09 July 01:47:57 */
    wwww_DDmmmmYYYY_HHMM: "F",
    /** Relative to the point in time. (ex.: 8 hours ago, 2 years ago) */
    relative: "R"
} as const;

export type UnixFormat = typeof unixFormat[keyof typeof unixFormat]

const nameToLink = {
    NumberOperation: "https://github.com/GDOlivercoding/arras-savesbot/blob/main/docs/cmd_find/numOp.md",
    BuildExpression: "https://github.com/GDOlivercoding/arras-savesbot/blob/main/docs/cmd_find/buildExpr.md",
    DateOperation: "https://github.com/GDOlivercoding/arras-savesbot/blob/main/docs/cmd_find/dateOp.md#dateoperation",
    GamemodeExpression: "https://github.com/GDOlivercoding/arras-savesbot/blob/main/docs/cmd_find/gamemodeExpr.md",
    CodePartExpression: "https://github.com/GDOlivercoding/arras-savesbot/blob/main/docs/cmd_find/codeParts.md"
} as const;

// goofy ahh
type DisTypeRef = {
    [K in keyof typeof nameToLink]: `[**${K extends symbol ? never : K}**](${typeof nameToLink[K]})`
}

const handler: ProxyHandler<DisTypeRef> = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    get(_target, prop, _receiver) {
        if (typeof prop == "symbol") throw Error(`Internal: Link proxy indexed by symbol '${String(prop)}'`);
        if (!(prop in nameToLink)) throw Error(`Internal: Invalid link key '${prop}'.`)
        const cast = prop as keyof DisTypeRef
        //if (nameToLink[cast] == "MISSING") throw Error(`Internal: Key '${prop}' has not been implemented.`)

        return `[**${cast}**](${nameToLink[cast]})`
        
    },
}

/**
 * Discord-Type-Reference.
 * 
 * Attributes return a discord formatted string linking
 * to the doc of the type.
 * 
 * For some reason fully typed, so you know the exact string value
 * of the attribute you're accessing.
 */
export const distyperef = new Proxy({} as DisTypeRef, handler)

export async function downloadFile(url: string, savePath: Path) {
    const res = await fetch(url)
    if (!res.body) throw new Error("Body missing." + res)
    const fileStream = savePath.createWriteStream({ flags: "wx" })
    finished(Readable.fromWeb(res.body).pipe(fileStream), (err) => err && (() => {throw err})())
}

export function dateToUnix(date: Date) {
    return Math.floor(date.getTime() / 1000)
}