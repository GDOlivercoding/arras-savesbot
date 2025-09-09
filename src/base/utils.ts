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
    /** Wed 09  July 01:47:57 */
    wwww_DDmmmmYYYY_HHMM: "F",
    /** Relative to the point in time. (ex.: 8 hours ago, 2 years ago) */
    relative: "R"
} as const

export type UnixFormat = typeof unixFormat[keyof typeof unixFormat]

const nameToLink = {
    NumberOperation: "https://discord.com/channels/1395076754816761956/1402655824530247712/1402766407304872008",
    BuildExpression: "https://discord.com/channels/1395076754816761956/1402655824530247712/1402768168258244760",
    DateOperation: "https://discord.com/channels/1395076754816761956/1402655824530247712/1402766854807752815",
    GamemodeExpression: "https://discord.com/channels/1395076754816761956/1402655824530247712/1404176405876445345",
    CodePartExpression: "https://discord.com/channels/1395076754816761956/1402655824530247712/1402769566186340465"
} as const;

// goofy ahh
type Formatted = {
    [K in keyof typeof nameToLink]: `[**${K extends symbol ? never : K}**](${typeof nameToLink[K]})`
}

const handler: ProxyHandler<Formatted> = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    get(_target, prop, _receiver) {
        if (typeof prop == "symbol") throw Error(`Internal: Link proxy indexed by symbol '${String(prop)}'`);
        if (!(prop in nameToLink)) throw Error(`Internal: Invalid link key '${prop}'.`)
        const cast = prop as keyof Formatted
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
export const distyperef = new Proxy({} as Formatted, handler)

export async function downloadFile(url: string, savePath: Path) {
    const res = await fetch(url)
    if (!res.body) throw new Error("Body missing.")
    const fileStream = savePath.createWriteStream({ flags: "wx" })
    // FIXME: Incompatible types
    finished(Readable.fromWeb(res.body).pipe(fileStream), (err) => err && (() => {throw err})())
}

export function dateToUnix(date: Date) {
    return Math.floor(date.getTime() / 1000)
}