# TODO

## Implement dates for number comparisons (<=[2025y 6mon])

Keys: y (year), mon (month), d (day), h (hour), min (minute), s (second) and ms (milisecond)

Take the default values of NOW of UTC

Replace them if user specifies said keys

Then convert to a unix timestamp and compile as a number expression

## [Integrate ended runs](C:\Users\Uzivatel\Desktop\Langs\js+ts\node.js\discord.js\savesbot\src\commands\utilities\saves.ts)

In saves.ts, integrate ended runs in such a way where code matching is either disabled, or only enabled for non ended runs

## Improve embed pager to work

currently embedpager.ts' embedSlice() function does not work properly

## Finish implement code matching

Filters like mode and server and not done properly or at all.

## Tighten code match types

tighten `CodePartFunc` and `CodePartPair` types in types.d.ts