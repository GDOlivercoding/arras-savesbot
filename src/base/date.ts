import { dateToUnix, distyperef } from "./utils";
import { DateOperationMap, DateSuffixes } from "./types";

const re_matchSingle = /^(?<value>\d+)(?<unit>y|mon|d|h|min|s)$/

/**  
 * The limit to every value of a {@link distyperef.DateOperation} 
 * for safety of the {@link Date} constructor. 
*/

const LIMIT = 1_000_000

/**
 * A "difficult" decision, we can either use Dates (native), Unix (common) or Unix in miliseconds (native .getTime()).
 * Because the values on our side are Date(s) which are easy to convert to all.
 * Because runtime takes seconds, we can conclude that
 * the best possible value type is Unix in seconds.
 */

/**
 * Parse a single Date cell. (ex.: [2025y 8mon 24d 1h 7min 48s 758ms])
 * @param expr The single Date cell to parse.
 * @param defaultYear Whether to *NOT* default the year to the current year
 *  (like other date parts).
 * @returns A number representing the parsed Date cell as a unix timestamp.
 */
export function singleDateCellToUnix(expr: string, defaultYear?: boolean): number {
    const orig = expr;
    expr = expr.replace(/^\(/, "").replace(/\)$/, "")
    const split = expr.split(" ").map(s => s.trim()).filter(s => !!s)

    const now = new Date()
    const parts: DateOperationMap = {};

    for (const part of split) {
        const singleRes = re_matchSingle.exec(part);

        if (singleRes?.groups) {

            const value = parseInt(singleRes.groups.value);
            const unit = singleRes.groups.unit as DateSuffixes;
            if (value > LIMIT) {
                throw Error(
                    `Value '${value}'`
                    + ` of cell '${part}'`
                    + ` of ${distyperef.DateOperation} '${orig}'`
                    + ` exceeds the limit of ${LIMIT}.`
                )

            }
            parts[unit] = value;

        } else {
            // I think the groups value will always be true so this is useless.
            throw Error(
                `Pair '${part}'`
                + ` of cell '${orig}'`
                + ` is invalid. `
                + ` Make sure the pair starts with a number and ends with a date suffix.`
            )
        }
    }

    let year = parts.y ?? (defaultYear ? now.getUTCFullYear() : 1970)
    if (defaultYear && year < 100) {
        year += 2000
    }
    parts.y = year;
    console.log(parts)

    const target = new Date(
        parts.y,
        parts.mon ?? 0,
        parts.d ?? 0,
        parts.h ?? 0,
        parts.min ?? 0,
        parts.s ?? 0
    )

    //console.log(target)
    return dateToUnix(target)
}