# TODO

## ~~Implement dates for number comparisons (<=[2025y 6mon])~~
## Implement a readable way for users to enter a date as a string (creationTime code part option)

Keys: y (year), mon (month), d (day), h (hour), min (minute), s (second) and ms (milisecond)

Take the default values of NOW of UTC

**Not actually, seems like it isn't that simple! Looks like i should only play around year defaulting that sounds about right.**

Replace them if user specifies said keys

Then convert to a unix timestamp and compile as a number expression

## Integrate ended runs

In saves.ts, integrate ended runs in such a way where code matching is either disabled, or only enabled for non ended runs

## Improve embed pager to work and add pagination

currently embedpager.ts' embedSlice() function does not work properly

## Finish implement code matching

Filters like mode and server and not done properly or at all.
currently mode and build have be severely improved.

code parts TODO: ID, server, (numOPs *may* be improvable), creationTime (refer to the first header) and safetyToken if theres something to do with it 

## Tighten code match types

tighten `CodePartFunc` and `CodePartPair` types in types.d.ts

## Rewrite savescore.ts to use saves.ts

---

## TODO ./src/base/saves.ts:SaveCollection.register():239:4

# DONE

## ~~Server code part doesn't work~~

TODO: server matching actually doesn't work at all for some reason

[done](https://discord.com/channels/1395076754816761956/1401911748679831622/1406290365463662710)

## ~~Debug tspath's SingleArgType~~

because it doesnt work for some reason

```ts
type Func = (options?: {name: string, target: string}) => void

const wrong: Parameters<Func> extends [infer E] ? E : never // never
const correct: Parameters<Func> extends (infer E)[] ? E : never // {name: string, target: string}
```

## ~~Fix C:\Users\Uzivatel\Desktop\Langs\js+ts\node.js\discord.js\savesbot\src\commands\utilities\savescore.ts:34:31~~

because `ReadableStream<Uint8Array>` is not compatible with `ReadableStream<any>`

[solution](https://discord.com/channels/508357248330760243/1405872191689592882)

## ~~package.json: @types/node is a dev dependency and make prettier a dev dependency~~

## ~~Anchoring build matching to the end with $~~

self explanatory, as in regex: /expr$/, done just needs testing, done
https://discord.com/channels/1395076754816761956/1402656124452212799/1403029718667628574

## ~~Test code matching for `build`~~

## ~~Connect to github and push all changes~~