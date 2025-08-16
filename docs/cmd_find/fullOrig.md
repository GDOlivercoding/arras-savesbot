/find Command Help

Filter and find saves based on options.

# **Options:**
NOTE: All code parts are matchable in the match-code options.
- **screenshot-count**: Filter saves by the number of screenshots. type: NumberOrNumeralOperation 
- **sub-mode**: Filter by the sub-mode (dirSortedMode) of the save. Choose from available modes. type: Literal string
- **history-count**: Filter by the number of past saves. Supports comparison expressions. type: NumberOrNumeralOperation 
- **region**: Filter by the server region where the save was made. type: Literal string

- **match-code**: Match code parts. See below for details. type: CodePartExpression

# Value Types

**number**: Any decimal (123) or hexadecimal (0x*) integer

**NumberOrNumeralOperation:** number, (<|>|<=|>=)number, <number>number, <number-number>
option 1: number, this will check for strict equality.
option 2: Prefix operator before number: >, <, >= and <= (ex.: >5, <=50).
option 3: `<number>number`, e.g., `<5>100` matches values between 95 and 105.
option 4: `<number-number>`, e.g., `<10-20>` matches values between 10 and 20 (inclusive).

You are free to use commas and periods wherever for readability.
They won't change how the command functions.

**DateOperation:** (<|>|<=|>=)\[(\d+(y|mon|d|h|min|s) ?)+\]
An operator followed by [] filled with numbers with a measurement suffix.
NumberOrNumeralOperation but replace number with \[(\d+(y|mon|d|h|min|s) ?)+\]
(ex.: >=[2024y 6mon 99h], <[2mon]>[2024y 7mon], <[2024y]-[2025y]>)
Unspecified values default to current UTC values.

**CodePartExpression**
All non-code parts are their own options (like region).
Use the `match-code` option to match code parts:
syntax: [key;value], [key;value], ...

key may be a string which one of the options below contain (kills, kill(s), (po)lygon(s)), 
or an index of the part in the code [0-13].

- Example: `[score;>1,000,000]` or `[6;>1,000,000]`
- Multiple pairs can be separated by commas: `[score;>=1,000,000],[kills;<10]`

**Value types for each option:** 
(index, name, type, notes)
- 0: id: string, to get code by id use /view-save, strict comparison
- 1: server: string (server ID), strict comparison to server id (ex.:arras.io/#ab -> "ab")
- 2: mode: string (gamemode), input a gamemode to parse, append "!" at the start to strictly match
- 3: tank: string, both user input and tank names get lower cased, and spaces and dashes get removed
- 4: build: string of numOrOps seperated by /, 10/10/10 matches first 3 upgrades to be exactly 10, //<=10 matches if Only
the third upgrade is lower or equal to 10, (more ex.: 10/<5-8>//>=50/<2>7)
- 5: score: numberOrOp
- 6: runtime: numberOrOp, time spent alive in seconds
- 7: kills: numberOrOp
- 8: assists: numberOrOp
- 9: bosses: numberOrOp, boss kills or assists
- 10: polygons: numberOrOp, polygons destroyed
- 11: custom: numberOrOp, special "dread" kills
- 12: creation: numberOrOp with unix timestamp (>=1754080892) or **DateOperation**
- 13: token: string, strict comparison

---

**Command Examples:**
- `/find screenshot-count:>=1 score:<5.000.000`
- `/find tank-class:sniper runtime-seconds:>3600`
- `/find history-count:0 score:<200,000>1,000,000`
- `/find match-code:[score;>=1,000,000],[kills;<20]`

Rich example for all options:
/find screenshot-count:2 sub-mode:Normal
history-count:>0 region:Oceania
match-code:[; ]

Results are shown in pages, with up to 25 saves per page. Only the first 10