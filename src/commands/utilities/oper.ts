import { ChatInputCommandInteraction } from "discord.js"
import { AttrnameToCompiler, CodePartPair, NumOpFunc, OperFunc } from "./types"
import { ShortKey, indexToKey, keyToAttrname } from "./saves"
import { parse } from "arras-parser"

const opToFunc: {
    [key: string]: OperFunc
} = {
    ">": (statVal, userVal) => statVal > userVal,
    "<": (statVal, userVal) => statVal < userVal,
    "<=": (statVal, userVal) => statVal <= userVal,
    ">=": (statVal, userVal) => statVal >= userVal
}

const aroundFunc = (
    statVal: number,
    userVal: number,
    rangeBoundary: number
) => {
    return (
        statVal <= userVal + rangeBoundary && statVal >= userVal - rangeBoundary
    )
}

const rangeFunc = (statVal: number, min: number, max: number) => {
    return statVal >= min && statVal <= max
}

const re_matchGeneric = /^(?<oper>[><]=?)\D*(?<value>\d+)$/
const re_matchAround = /^<(?<range>\d+)>(?<value>\d+)$/
const re_matchRange = /^<(?<min>\d+)\D*-\D*(?<max>\d+)>$/
const re_matchSingleSlot = /^(?<key>[a-z]+|\d+);(?<value>.+)$/

export class InteractionCompiler {
    interaction: ChatInputCommandInteraction

    constructor(interaction: ChatInputCommandInteraction) {
        this.interaction = interaction
    }

    /**
     * Compile a number operation.
     * @param expr The expression, either a string or null if not defined.
     * @returns false: Compiling the expression failed, undefined: `expr`
     * was passed in as `null`, NumOrOp: Success
     */
    compileNumOp(expr: string | null): false | NumOpFunc | undefined {
        if (expr == null) return

        const func = parseIntOper(expr)
        if (!func) {
            this.interaction.reply(`Invalid pattern ${expr}.`)
            return false
        }

        return func
    }

    compileCodeMatch(expr: string | null): false | CodePartPair[] | undefined {
        if (expr == null) return
        try {
            return parseGenericCodeMatch(expr)
        } catch (error) {
            this.interaction.reply(
                `An error has occured while parsing code match pattern: ${error}`
            )
            return false
        }
    }
}

export function parseGenericCodeMatch(expr: string): CodePartPair[] {
    expr = expr.replaceAll(" ", "")
    if (!expr) return []

    const exprArr = expr.split("],[")
    exprArr[0] = exprArr[0].replace(/^\[/, "")
    const last = exprArr.length - 1
    exprArr[last] = exprArr[last].replace(/\]$/, "")

    const results: CodePartPair[] = []
    for (const pair of exprArr) {
        const res = re_matchSingleSlot.exec(pair)
        if (!res || !res.groups) throw new Error(`Failed to match '${pair}'`)

        // here we received the raw name attr
        let key = res.groups.key
        const value = res.groups.value

        // if its an index, get the attr name
        if (!isNaN(parseInt(key))) {
            const keyIndex = parseInt(key)
            key = indexToKey[keyIndex]

            // Here then find ONLY 1 attr that contains the key
        } else {
            const results = indexToKey.filter((val) => val.includes(key))

            // no results found
            if (results.length == 0)
                throw new Error(
                    `Key '${key}' of pair '${pair}' doesn't match any attr.`
                )

            // too many results found
            if (results.length > 1) {
                const attrs = results.join(", ")
                throw new Error(
                    `key '${key}' of pair '${pair}' matches multiple attrs: ${attrs}`
                )
            }

            // get the assigned result
            key = results[0]
        }

        const targetKey = key as ShortKey
        const targetAttr = keyToAttrname[targetKey]
        /** We pick the compiler and compile it with the value. */
        const func = attrnameToCompiler[targetAttr](value)
        results.push([targetAttr, func])
    }

    return results
}

export function parseIntOper(expr: string): NumOpFunc | null {
    expr = expr.replace(/[ |,|.]/g, "")

    let res: number
    if (!isNaN((res = parseInt(expr)))) {
        return (statVal) => statVal == res
    }

    const genRes = re_matchGeneric.exec(expr)
    if (genRes && genRes.groups) {
        const userVal = parseInt(genRes.groups.value)
        const operFunc = opToFunc[genRes.groups.oper]
        return (statVal) => operFunc(statVal, userVal)
    }

    const aroundRes = re_matchAround.exec(expr)
    if (aroundRes && aroundRes.groups) {
        const userVal = parseInt(aroundRes.groups.value)
        const range = parseInt(aroundRes.groups.range)

        return (statVal) => aroundFunc(statVal, userVal, range)
    }

    const rangeRes = re_matchRange.exec(expr)
    if (rangeRes && rangeRes.groups) {
        const min = parseInt(rangeRes.groups.min)
        const max = parseInt(rangeRes.groups.max)

        return (statVal) => rangeFunc(statVal, min, max)
    }

    return null
}

/**
 * Helper to create a generic integer operation with an error name specifications.
 * @param name The name of this integer operation for the error message.
 * @returns Parser integer operation callable.
 */
function createIntOperFunc(name: string) {
    return (userVal: string) => {
        const expr = parseIntOper(userVal)
        if (!expr)
            throw Error(
                `${name} code part value '${userVal}' is not parseable as type NumberOrOp.`
            )
        return expr
    }
}

const attrnameToCompiler: AttrnameToCompiler = {
    ID: (userVal) => (id) => userVal == id,
    server: (userVal) => (server) => userVal == server.id, // TODO possibly modify
    mode: (userVal) => {
        // Whether to match if target has all attributes
        // or if target has only these attributes
        let strictMode = false
        if (userVal.startsWith("!")) {
            strictMode = true
            userVal = userVal.replace(/^!/, "")
        }

        const userMode = parse(userVal)
        return (mode) => userMode.compare(mode, strictMode)
    }, // TODO
    tankClass: (userVal) => {
        const transform = (s: string) => s.toLowerCase().replace(/[ -]/g, "")

        userVal = transform(userVal)

        return (tankClass) => transform(tankClass).includes(userVal)
    },
    build: (userVal) => {
        let endAnchor = false;
        if (userVal.endsWith("$")) {
            userVal = userVal.replace(/\$$/, "");
            endAnchor = true;
        }

        const parts = userVal.split("/")

        const parsedParts = parts.map((part) => {
            // empty part means match any, like js comments.
            if (!part) return () => true
            const result = parseIntOper(part)
            if (!result) {
                throw Error(`'${result}' is an invalid number operation.`)
            }
            return result
        })

        // Doing it this way because i want to do as much in the
        // compilation rather than execution.
        if (!endAnchor) {
            return (build) => {
                const buildParts = build.parts
                for (let i = 0; i < parsedParts.length; i++) {
                    const part = buildParts[i]
                    if (!part || !parsedParts[i](part)) return false
                }

                return true
            }
        } else {
            return (build) => {
                const buildParts = build.parts
                // here, `i` the amount of steps away from the end of the array.
                for (let i = 0; i < parsedParts.length + 1; i++) {
                    const part = buildParts[buildParts.length - i]
                    if (!part || !parsedParts[parsedParts.length - i](part)) return false
                }

                return true
            }
        }
    }, // TODO
    rawScore: createIntOperFunc("score"),
    runtimeSeconds: createIntOperFunc("runtime"),
    kills: createIntOperFunc("kills"),
    assists: createIntOperFunc("assists"),
    bossKills: createIntOperFunc("bosses"),
    polygonsDestroyed: createIntOperFunc("polygons"),
    customKills: createIntOperFunc("custom"),
    creationTime: (userVal) => {
        // here we either accept a unix timestamp as a number operation
        // or a date then convertible to a number operation (<[2024y 7m 5d])
        if (!isNaN(parseInt(userVal))) {
            // i want this part executed immediately.
            const wrapped = createIntOperFunc("creation")(userVal)
            return (statValDate) =>
                wrapped(Math.floor(statValDate.getTime() / 1000))
        }

        throw Error("Date comparisons aren't yet implemented.")
        // here compile the pattern and return back to number operations
        //return (creationTime) => true
    },
    safetyToken: (userVal) => (safetyToken) => userVal == safetyToken
} as const;
