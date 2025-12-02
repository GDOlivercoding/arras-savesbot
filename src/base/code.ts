import { parse } from "arras-parser"
import { Gamemode } from "arras-parser/types"
import { DirSortedMode, Region, RegionChar, State } from "./types"
import { indexToKey } from "./structs"
import { UnixFormat } from "./utils"

// (6e2121d4:#ef:w33oldscdreadnoughts2:Auto-Tri-Angle:8/8/9/9/9/9/9/7/1/0:10083590:2720:9:3:0:536:9:1728507182:5lZqbl5uVQDOddyJ)

export class SaveCode {
    // meta
    innerCode: string
    parts: string[]

    // code parts from index 0 to 13
    ID: string
    server: Server
    mode: Gamemode
    tankClass: string
    build: Build
    rawScore: number
    runtimeSeconds: number
    kills: number
    assists: number
    bossKills: number
    polygonsDestroyed: number
    customKills: number
    creationTime: Date
    safetyToken: string
    
    // other information
    dirSortedMode: DirSortedMode
    formattedScore: string

    /**
     * Construct a new Arras.io `SaveCode` object from a code string
     * @param code The string code, a string with 14 parts seperated
     * by colons, surrounded by parens and optionally backticks.
     */
    constructor(code: string) {
        // `?(foo)`? -> foo
        this.innerCode = code.replace(/^`?\(/, "").replace(/\)`?$/, "")
        this.parts = this.innerCode.split(":")

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
        ] = this.parts

        this.ID = codeID
        this.server = new Server(serverId)
        this.mode = parse(mode)

        const Mode = this.mode
        
        /* Extracted sub mode for the parent directory of the save. */
        this.dirSortedMode = Mode.isNormalMode()
            ? "Normal"
            : Mode.prefixHas("Growth")
              ? "Growth"
              : Mode.prefixHas("Arms Race")
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

        return [
            now.toISOString().split("T")[0],
            this.formattedScore,
            this.tankClass
        ].join(" ")
    }

    creationTimestamp(format: UnixFormat) {
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
    static validate(code: string): State {
        function err(message: string): State {
            return { state: "err", message }
        }

        const codeParts = code
            .replace(/^`?\(/, "")
            .replace(/\)`?$/, "")
            .split(":")

        if (codeParts.length !== 14)
            return err(`Part length should be 14 and not ${codeParts.length}`)

        //console.log(codeParts);

        function regexCheck(): State {
            const codeID = /([\d|a-z]+)/
            const server = /(#[e|w|c|a|o][a-z])/
            const mode = /([\d|a-z]+)/ // Mode is going to get validated later; too hard for regex
            const tankClass = /((?:[\d|A-Z|a-z]+[-| ]?)+)(?<![-| ])$/
            const build = /(?:\d\/?)+(?<!\/)$/

            const digitOnly: RegExp[] = Array(10).fill(/(\d+)/)

            const [
                score, // score must be `750K <= score <= 2 ** (32 - 1)`
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
                    const name = indexToKey[index]
                    return err(`Failed to validate part '${name}'.`)
                }
            }

            return { state: "ok", message: "Passed all regex checks" }
        }

        const reRes = regexCheck()
        if (reRes.state == "err") {
            return reRes
        }

        const mode = codeParts[2]
        try {
            parse(mode) // mode
        } catch (error) {
            let normalized = `${error}`.replace(/(?<!\.|!|\?)/, ".")
            normalized = normalized[0].toUpperCase() + normalized.slice(1)
            return err(`Failed parsing mode '${mode}': ${normalized}`)
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
            throw new Error(`The serverId string is empty.`)

        this.region = this.regions[this.regionChar]
        if (!this.region) {
            throw Error(`Invalid region character '${this.regionChar}' of '#${this.id}'`)
        }

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
