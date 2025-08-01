import { ChatInputCommandInteraction } from "discord.js";
import { CompiledFunc, OperFunc } from "./types"
import { keys } from "./saves";

export const indexToKey = [
    "id", // code ID, ???
    "server", // server id, ???
    // "region", // region NAME, strictly match for NAME // non code fields are going to be speciaů
    "mode", // Gamemode object, ???
    "tank", // tank class query, match if includes insensitively
    "build", // Tank build, ???
    "score", // raw score integer, Comparison operation
    "runtime", // raw runtime seconds integer, comparison operatio
               // add a mode readable way to do this after (ex.: >=[1d 15h])
    "kills", // not yet implemented, implement simple comparison operation
    "assists", // not yet implemented, implement simple comparison operation
    "bosses", // not yet implemented, implement simple comparison operation
    "polygons", // not yet implemented, implement simple comparison operation
    "custom", // not yet implemented, implement simple comparison operation
    "creation", // implement unix timestamp comparison and >=[1d 15h] (relative now to creation time)
    "token" // why the fuck why would we match the token
];

const opToFunc: {
    [key: string]: OperFunc
} = {
    ">": (statVal, userVal) => statVal > userVal,
    "<": (statVal, userVal) => statVal < userVal,
    "=": (statVal, userVal) => statVal == userVal,
    "<=": (statVal, userVal) => statVal <= userVal,
    ">=": (statVal, userVal) => statVal >= userVal,
    get "=="() { return this["="] }
}   

const aroundFunc = (statVal: number, userVal: number, rangeBoundary: number) => {
    return statVal <= (userVal + rangeBoundary) && statVal >= (userVal - rangeBoundary)
};

const rangeFunc = (statVal: number, min: number, max: number) => {
    return statVal >= min && statVal <= max
}

const re_matchGeneric = /^(?<oper>[>|<|=]=?)\D*(?<value>\d+)$/;
const re_matchAround = /^<(?<range>\d+)>(?<value>\d+)$/;
const re_matchRange = /^<(?<min>\d+)\D*-\D*(?<max>\d+)>$/
const re_matchSingleSlot = /^\[(?<key>[a-z]+|\d+);(?<value>[\d|a-z|A-Z]+)\]$/

export class InteractionCompiler {
    interaction: ChatInputCommandInteraction

    constructor(interaction: ChatInputCommandInteraction) {
        this.interaction = interaction
    }
    
    compile(expr: string | null): false | CompiledFunc | undefined {
        if (expr != null) {
            let func = parseIntOper(expr);
            if (!func) {
                this.interaction.reply(`Invalid pattern ${expr}.`);
                return false;
            }

            return func;
        }
    }
}

export function parseGenericCodeMatch(expr: string): [string, CompiledFunc][] {
    let exprArr = expr.split(",")

    let results: [string, CompiledFunc][] = [];
    for (let pair of exprArr) {
        const res = re_matchSingleSlot.exec(pair);
        if (!res || !res.groups) throw new Error(`Failed to match '${pair}'`);

        // here we received the raw name attr
        let key = res.groups.key;   
        let value = res.groups.value;

        // if its an index, get the attr name
        if (!isNaN(parseInt(key))) {
            let keyIndex = parseInt(key);
            key = indexToKey[keyIndex]

        // Here then find ONLY 1 attr that contains the key
        } else {
            let results = indexToKey.filter(val => val.includes(key))

            // no results found
            if (results.length == 0) 
                throw new Error(`Key '${key}' of pair '${pair}' doesn't match any attr.`);

            // too many results found
            if (results.length > 1) {
                let attrs = results.join(", ");
                throw new Error(`key '${key}' of pair '${pair}' matches multiple attrs: ${attrs}`);
            }

            // get the assigned result
            key = results[0];
        }

        /** From here this is a key of `keys` */
        let targetAttr = key as keyof typeof keys
    }

    return results;
}

export function parseIntOper(expr: string): CompiledFunc | null {
    expr = expr.replace(/[ |,|.]/g, "");

    let res: number;
    if (!isNaN(res = parseInt(expr))) {
        return statVal => statVal == res
    }

    const genRes = re_matchGeneric.exec(expr);
    if (genRes && genRes.groups) {
        let userVal = parseInt(genRes.groups.value);
        let operFunc = opToFunc[genRes.groups.oper];
        return statVal => operFunc(statVal, userVal);
    }

    const aroundRes = re_matchAround.exec(expr);
    if (aroundRes && aroundRes.groups) {
        let userVal = parseInt(aroundRes.groups.value);
        let range = parseInt(aroundRes.groups.range);

        return statVal => aroundFunc(statVal, userVal, range);
    }

    const rangeRes = re_matchRange.exec(expr);
    if (rangeRes && rangeRes.groups) {
        let min = parseInt(rangeRes.groups.min);
        let max = parseInt(rangeRes.groups.max);

        return statVal => rangeFunc(statVal, min, max);
    }

    return null;
}