import { parse } from "arras-parser"
import { Gamemode } from "arras-parser/types"
import { Path } from "pathobj/tspath"
import { DirSortedMode, Region, RegionChar } from "./types"

export class SaveCode {
    innerCode: string
    parts: string[]
    ID: string
    server: Server
    mode: Gamemode
    dirSortedMode: DirSortedMode
    tankClass: string
    build: Build
    rawScore: number
    formattedScore: string
    runtimeSeconds: number
    kills: number
    assists: number
    bossKills: number
    polygonsDestroyed: number
    customKills: number
    creationTime: Date
    safetyToken: string

    /**
     * Construct a new Arras.io `SaveCode` object from a code
     * @param {string} code The string code
     */
    constructor(code: string) {
        this.innerCode = code.replace(/^`?\(/, "").replace(/\)`?$/, "")
        const parts = this.innerCode.split(":")
        this.parts = parts

        const [
            codeID,
            serverId,
            mode,
            tankClass,
            build,
            rawScore,
            runtimeSeconds,
            kills,
            assists,
            bossKills,
            polygonsDestroyed,
            customKills,
            creationTime,
            safetyToken
        ] = parts

        this.ID = codeID
        this.server = new Server(serverId)
        this.mode = parse(mode)

        const Mode = this.mode
        // oml
        /**
         * Extracted sub mode for the parent directory of the save.
         * @type {'Normal' | 'Growth' | 'Arms Race' | 'Olddreads' | 'Newdreads'}
         */
        this.dirSortedMode = Mode.isNormalMode()
            ? "Normal"
            : Mode.prefixHas("Growth")
              ? "Growth"
              : Mode.prefixHas("Arms_Race")
                ? "Arms Race"
                : Mode.customWords.includes("old")
                  ? "Olddreads"
                  : "Newdreads"

        this.tankClass = tankClass
        this.build = new Build(build)
        this.rawScore = parseInt(rawScore)
        this.formattedScore = scoreToReadable(this.rawScore)
        this.runtimeSeconds = parseInt(runtimeSeconds)
        this.kills = parseInt(kills)
        this.assists = parseInt(assists)
        this.bossKills = parseInt(bossKills)
        this.polygonsDestroyed = parseInt(polygonsDestroyed)
        this.customKills = parseInt(customKills)
        // https://stackoverflow.com/questions/847185/convert-a-unix-timestamp-to-time-in-javascript
        this.creationTime = new Date(parseInt(creationTime) * 1000)
        this.safetyToken = safetyToken
    }

    constructDirname() {
        const now = new Date()

        return new Path(
            import.meta.dirname,
            this.dirSortedMode,
            [
                now.toISOString().split("T")[0],
                this.formattedScore,
                this.tankClass
            ].join(" ")
        )
    }

    creationTimestamp(format: string) {
        return `<t:${Math.floor(this.creationTime.getTime() / 1000)}:${format}>`
    }

    /**
     * Is this the same run as another code?
     */
    isSameRun(code: SaveCode) {
        return this.ID == code.ID
    }

    /**
     * Validate an Arras.io save code string.
     * This makes sure that constructing a Savecode object from the passed text is safe.
     * @param code The code string.
     * @returns Whether the code is valid or not.
     */
    static validate(code: string): { state: "ok" | "err"; message: string } {
        const err: (msg: string) => { state: "err"; message: string } = (
            message: string
        ) => {
            return { state: "err", message }
        }

        const codeParts = code
            .replace(/^`?\(/, "")
            .replace(/\)`?$/, "")
            .split(":")

        if (codeParts.length !== 14)
            return err(`Part length should be 14 and not ${codeParts.length}`)

        //console.log(codeParts);

        function regexCheck(): ReturnType<typeof SaveCode.validate> {
            const codeID = /([\d|a-z]+)/
            const server = /(#[e|w|c|a|o][a-z])/
            const mode = /([\d|a-z]+)/ // Mode is going to get validated later; too hard for regex
            const tankClass = /((?:[\d|A-Z|a-z]+[-| ]?)+)(?<![-| ])$/
            const build = /(?:\d\/?)+(?<!\/)$/

            const digitOnly: RegExp[] = Array(10).fill(/(\d+)/)

            const [
                score, // score must be `750K <= score <= 2 ** 32 - 1`
                runtime, // runtime in seconds
                kills,
                assists,
                bossKills,
                polygonsDestroyed,
                customKills,
                unixTimestamp // seconds since 1st of jan 1970 midnight UTC
            ] = digitOnly

            const safetyToken = /(.+)/

            const regexes = [
                codeID,
                server,
                mode,
                tankClass,
                build,
                score,
                runtime,
                kills,
                assists,
                bossKills,
                polygonsDestroyed,
                customKills,
                unixTimestamp,
                safetyToken
            ] as const

            for (let index = 0; index < regexes.length; index++) {
                const re = regexes[index]
                const part = codeParts[index]
                const res = re.exec(part)

                // XXX The latter check is VERY important!!!
                if (!res || res[0] != part) {
                    return err(
                        `Regex ${re} failed to match ${part}${res ? `, output: ${res[0]}` : ""}`
                    )
                }
            }

            return { state: "ok", message: "Passed all checks" }
        }

        const reRes = regexCheck()
        if (reRes.state == "err") {
            return reRes
        }

        try {
            parse(codeParts[2]) // mode
        } catch {
            return err(`Failed parsing mode ${codeParts[2]}`)
        }

        return { state: "ok", message: "Passed all validation checks" }
    }

    /**
     * Format this code.
     * Add surrounding parens and optionally backticks
     * for discord formatting.
     * @param discordFormatting Whether to add backticks for discord formatting.
     * @returns The formatted code.
     */
    wrap(discordFormatting?: boolean) {
        let code = this.innerCode
            .replace(/^(?<!\()/, "(")
            .replace(/(?<!\))$/, ")")
        if (discordFormatting) {
            const backtick = "`"
            code = Array(2).fill(backtick).join(code)
        }
        return code
    }

    toString() {
        return this.wrap(true)
    }

    valueOf() {
        return this.toString()
    }
}

export class Server {
    regions: { [P in RegionChar]: Region } = {
        e: "Europe",
        w: "US West",
        c: "US Central",
        a: "Asia",
        o: "Oceania"
    } as const

    /** The server id passed in the constructor minus its trailing hashtag. */
    id: string
    region: Region
    regionChar: RegionChar
    isSandbox: boolean

    /**
     *
     * @param {string} serverId
     */
    constructor(serverId: string) {
        this.id = serverId.replace(/^#/, "")
        this.regionChar = this.id[0] as RegionChar

        if (!this.regionChar)
            throw new Error(`Regional character ${this.id[0]} is invalid.`)

        this.region = this.regions[this.regionChar]
        this.isSandbox = this.id.length == 3
    }

    get link() {
        return `https://arras.io/#${this.id}`
    }

    toString() {
        return this.link
    }
}

export class Build {
    build: string
    parts: number[]
    sum: number

    constructor(build: string) {
        this.build = build
        this.parts = this.build.split("/").map((i) => parseInt(i))
        this.sum = this.parts.reduce((p, v) => p + v)
        // Maybe add more?
    }

    valueOf() {
        return this.build
    }

    toString() {
        return this.build
    }
}

const suffixes: { [key: number | string]: string } = {
    6: "K",
    7: "m",
    8: "m",
    9: "m",
    10: "b"
}

/**
 *
 * @param {string | number} score
 * @returns {string}
 */
function scoreToReadable(score: number): string {
    // 1_784_485
    const str = score.toString()

    // 1
    const remainder = str.length % 3

    // 178
    const chars = [...str.slice(0, 3)]

    if (remainder) {
        chars.splice(remainder, 0, ".")
    }

    chars.push(suffixes[str.length])
    return chars.join("")
}
