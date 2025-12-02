# [CodePartExpression](./codeParts.md)
`[key;value], [index;value], ...`

Match code parts by their name and index with their own value types.
Key may be a name of a part, or an index of the part in the code [1-14].

**Value types for each option:** 
(index, name, type, notes)
- 1: **id**: `string`, use /view-save to get by ID, this may be useful to check if this save has the properties of other options.
- 2: **server**: server ID `string`, strict comparison to server id (ex.:arras.io/#ab -> "ab")
- 3: **mode**: [**GamemodeExpression**](./gamemodeExpr.md)
- 4: **tank**: `string`, both user input and tank names get lower cased, and spaces and dashes get removed
- 5: **build**: [**BuildExpression**](./buildExpr.md)
- 6: **score**: [**NumberOperation**](./numOp.md)
- 7: **runtime**: [**NumberOperation**](./numOp.md), time spent alive in seconds, this may get the DateOperation treatment as well
- 8: **kills**: [**NumberOperation**](./numOp.md)
- 9: **assists**: [**NumberOperation**](./numOp.md)
- 10: **bosses**: [**NumberOperation**](./numOp.md), boss kills and assists count
- 11: **polygons**: [**NumberOperation**](./numOp.md), polygons destroyed
- 12: **custom**: [**NumberOperation**](./numOp.md), special "dread" kills
- 13: **creation**: [**NumberOperation**](./numOp.md) with unix timestamp (>=1754080892) or [**DateOperation**](dateOp.md)
- 14: **token**: `string`, strict comparison

- Example: `[score;>1,000,000]` or `[7;>1,000,000]`
- Multiple pairs can be separated by commas: `[score;>=1,000,000],[kills;<10]`