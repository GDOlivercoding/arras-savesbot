# [Date:](./dateOp.md#date) 
`(Number<suffix> Number<suffix> ...)`

A field () filled with date values.
Add an integers with a date suffix spaced between each other. Available suffixes:
`y: year, mon: month, d: day, h: hour, min: minute, ms: milisecond`

Examples: 
- (2025y 8mon 6d 0h 38min 24s 789ms)
- (999999d)
- (72h)
- (1754433727830s) as a unix timestamp (**this wont work** because of defaulting, check [**DateOperation**](./dateOp.md#dateoperation))
- () empty, this will default to the current time in UTC

Unspecified values default to current UTC values. (?)

# [DateOperation:](./dateOp.md#dateoperation) 
... extends [**NumberOperation**](./numOp.md), [**Date**](./dateOp.md#date)

An extended [**NumberOperation**](./numOp.md) but the numerical values are **[Date](./dateOp.md#date)s**
The single numeral option of a number operation is left in but not recommended. Use the others ones instead:
- \>=(2024y 2mon)
- <(2mon)>(2024y 6mon) Note here: the tolerance date will never default its values to anything.
- <(2024y 11mon)-(2025y 3mon 24d)>
- <(69420s)