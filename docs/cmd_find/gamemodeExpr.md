# [GamemodeExpression](./gamemodeExpr.md)

A gamemode expression is a string which describes a mode's property.
This is the 7th part of a save code, by pressing L (or debug keybind)
in game, you can see the current gamemode on the bottom right.


**Gamemodes can have the following properties:**

**(Strikethrough(ed) properties aren't savable or in a better way saves can't have them.)**
**NOTE:** Growth saves were deprecated a year ago.
- prefixes: a: Arms Race, ~~g: Growth~~, m: Maze, ~~o: Open~~, p: Portal and r: Rock.
- teamtype: ~~f: FFA, d: Duos, s: Squads and c: Clan Wars.~~ You can also add an integer [1-4] to indicate TDM
- ~~tdm minigame: if the mode is TDM, it can optionally have a tdm minigame character after TDM declaration~~
- ~~tdm minigame: s: Siege, b: Soccer (or Football), d: Domination, g: Grudge Ball, a: Assault, m: Mothership~~
t: Tag, p: Pandemic, e: Elimination and z: Sandbox
- custom words: ex.: e8outbreak -> "e", number of letters, word with said number of letters
- custom words: multiple words: w33oldscdreadnoughts -> "w", part count (includes seperators), step 3: letters in next word, next word with said letters, decrement part count, if 0 exit, "s", back to step 3
- custom words: if letter count exceeds 9, use a, b, c and d for 10, 11, 12 and 13 respectively
- ~~map layout: same as `custom words` but with "x"~~

**Matching:**
If you append "!" at the start, you enter strict mode, normal mode otherwise
Normal mode generally matches if the opposing gamemode has all of its properties
while strict mode matches if the opposing gamemode is the exact same

logic behind matching:
- prefixes: Normal: the opposing mode must have all prefixes; Strict: must have the exact same prefixes
- teamtype: Normal: if specified, must have the same teamtype; Strict: must have the same teamtype even when unspecified
- ~~tdm minigame: same as teamtype~~
- custom words: Normal: opposing mode's custom words must all be in those which youve specified; Strict: must have same exact custom words (order doesnt matter)
- ~~map layout: same as custom words~~