import { ChatInputCommandInteraction } from "discord.js"
import { AttrnameToCompiler, CodePartFunc, CodePartPairs, NumOpFunc, OperFunc } from "./types"
import { ShortKey, indexToKey, keyToAttrname } from "./structs"
import { parse } from "arras-parser"
import { distyperef } from "./utils"
import { Build } from "./code"
import { singleDateCellToUnix } from "./date"

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
        statVal    <= (userVal + rangeBoundary) 
        && statVal >= (userVal - rangeBoundary)
    )
}

const rangeFunc = (statVal: number, min: number, max: number) => {
    return statVal >= min && statVal <= max
}

const re_matchNumOP = /^(?<oper>[><]=?)\D*(?<value>\d+)$/
const re_matchAround = /^<(?<range>\d+)>(?<value>\d+)$/
const re_matchRange = /^<(?<min>\d+)\D*-\D*(?<max>\d+)>$/
const re_matchSingleSlot = /^(?<key>[a-z]+|\d+);(?<value>.+)$/
const re_matchInner = /\([^)]+\)/g
const re_matchSpecialCaseAround = /^<(?<tolerance>\([^)]+\))>(?<value>\([^)]+\))$/

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

    compileCodeMatch(expr: string | null): false | CodePartPairs | undefined {
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

export function parseGenericCodeMatch(expr: string): CodePartPairs {
    expr = expr.replaceAll(" ", "")
    if (!expr) return []

    const exprArr = expr.split("],[")
    exprArr[0] = exprArr[0].replace(/^\[/, "")
    const last = exprArr.length - 1
    exprArr[last] = exprArr[last].replace(/\]$/, "")

    // for consistency
    const errKeyofPair = (pair: string, key: string, message: string) => {
        return Error(`Key '${key}' of pair '${pair}' ${message}`)
    }

    const results: CodePartPairs = []
    for (const pair of exprArr) {
        const res = re_matchSingleSlot.exec(pair)
        if (!res || !res.groups) throw new Error(`Failed to match '${pair}' as a pair.`)

        // here we received the raw name attr
        let key = res.groups.key
        const value = res.groups.value

        // if its an index, get the attr name
        if (!isNaN(parseInt(key))) {
            const keyIndex = parseInt(key) - 1
            if (keyIndex < 0 || keyIndex > indexToKey.length - 1)
                throw errKeyofPair(pair, key, "is out of bounds of [1-14] as an index.")

            key = indexToKey[keyIndex]

            // Here then find ONLY 1 attr that contains the key
        } else {
            const results = indexToKey.filter((val) => val.includes(key))

            // no results found
            if (results.length == 0)
                throw errKeyofPair(pair, key, "doesn't match any attr.")

            // too many results found
            if (results.length > 1) {
                const attrs = results.join(", ")
                throw errKeyofPair(pair, key, `matches too many attrs: ${attrs}`)
            }

            // get the assigned result
            key = results[0]
        }

        const targetKey = key as ShortKey
        const attrname = keyToAttrname[targetKey]
        /** We pick the compiler and compile it with the value. */
        const predicate = attrnameToCompiler[attrname](value) as CodePartFunc
        results.push({ key: attrname, predicate })
    }

    return results
}

/**
 * Parse a {@link distyperef.DateOperation} (Integer Operation).
 * @param expr The expression.
 * @returns Returns the parsed function or null as failure.
 */
export function parseIntOper(expr: string): NumOpFunc | null {
    expr = expr.replace(/[ |,|.]/g, "")

    let res: number
    if (!isNaN((res = parseInt(expr)))) {
        return (statVal) => statVal == res
    }

    const genRes = re_matchNumOP.exec(expr)
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

    // Failed to match. 
    return null
}

/**
 * Parse a {@link distyperef.DateOperation}.
 * @param expr expression.
 * @returns null: failure otherwise success.
 * @throws {Error} with message if some values are incorrect.
 */
export function parseDateOper(expr: string, defaultYear: boolean): NumOpFunc | null {
    const rangeRes = re_matchSpecialCaseAround.exec(expr);

    // Special casing because `tolerance` can't default to a year
    // that would be silly and pointless.
    if (rangeRes?.groups) {
        const tolerance = rangeRes.groups.tolerance;
        const value = rangeRes.groups.value;

        const toleranceUnix = singleDateCellToUnix(tolerance)
        const valueUnix = singleDateCellToUnix(value, defaultYear)

        return (statVal) => aroundFunc(statVal, valueUnix, toleranceUnix)
    }

    // XXX how im i supposed to avoid the global flag trap?
    const res = parseIntOper(expr.replaceAll(re_matchInner, expr => String(singleDateCellToUnix(expr, defaultYear))))
    re_matchInner.lastIndex = 0;
    return res;
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
                `'${name}' code part value '${userVal}' is not parseable as type ${distyperef.NumberOperation}.`
            )
        return expr
    }
}

function createDateOperFunc(name: string, defaultYear: boolean) {
    return (userVal: string) => {
        const numOpRes = parseIntOper(userVal)
        if (numOpRes) {
            return wrapDateOrIntOperFunc(numOpRes)
        }

        // This part is clear.
        const res = parseDateOper(userVal, defaultYear)
        if (!res) {
            throw Error(
                `'${name}' code part value '${userVal}' is not parseable as type ${distyperef.DateOperation}`
                + ` or ${distyperef.NumberOperation}.`
            )
        }
        return wrapDateOrIntOperFunc(res)
    }
}

/**
 * Safely wraps around a Number operation function that might receive a date,
 * and converts that date to a unix timestamp.
 * @param func 
 * @returns the wrapped function
 */
function wrapDateOrIntOperFunc(func: NumOpFunc) {
    return (statVal: Date | number) => {
        if (typeof statVal == "number") return func(statVal);
        return func(Math.floor(statVal.getTime() / 1000))
    }
}

export const attrnameToCompiler: AttrnameToCompiler = {
    ID: (userVal) => (id) => userVal == id,
    server: (userVal) => (server) => userVal == server.id, // TODO possibly modify
    mode: (userVal) => {
        let strictMode = false
        if (userVal.startsWith("!")) {
            strictMode = true
            userVal = userVal.replace(/^!/, "")
        }

        const userMode = parse(userVal)
        return (mode) => userMode.compare(mode, strictMode)
    }, 
    tankClass: (userVal) => {
        const transform = (s: string) => s.toLowerCase().replace(/[ -]/g, "")

        userVal = transform(userVal)

        return (tankClass) => transform(tankClass).includes(userVal)
    },
    build: (userVal) => {
        let endAnchor = false
        if (userVal.endsWith("$")) {
            userVal = userVal.replace(/\$$/, "")
            endAnchor = true
        }

        const userBuild = new Build(userVal);
        const parts = userBuild.parts

        const parsedParts = parts.map((part) => {
            // empty part means match any, like js comments.
            if (!part) return () => true
            const result = parseIntOper(`${part}`)
            if (!result) {
                throw Error(`'${result}' is an invalid ${distyperef.NumberOperation}.`)
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
                for (let i = 1; i < parsedParts.length + 1; i++) {
                    const part = buildParts[buildParts.length - i]
                    if (!part || !parsedParts[parsedParts.length - i](part))
                        return false
                }

                return true
            }
        }
    },
    rawScore: createIntOperFunc("score"),
    runtimeSeconds: createDateOperFunc("runtime", false),
    kills: createIntOperFunc("kills"),
    assists: createIntOperFunc("assists"),
    bossKills: createIntOperFunc("bosses"),
    polygonsDestroyed: createIntOperFunc("polygons"),
    customKills: createIntOperFunc("custom"),
    creationTime: createDateOperFunc("creation", true),
    safetyToken: (userVal) => (safetyToken) => userVal == safetyToken
} as const
