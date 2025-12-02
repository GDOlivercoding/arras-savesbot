# [NumberOperation:](./numOp.md)
`Integer, (<|>|<=|>=)Integer, <Integer>Integer, <Integer-Integer>`

- an Integer, this will check for strict equality.
- Prefix operator before an Integer: >, <, >= and <= (ex.: >5, <=50).
- `<Integer>Integer`, e.g., `<5>15` matches the latter value with a tolerance of the former value ([10-20] here).
- `<Integer-Integer>`, e.g., `<10-20>` matches range between 10 and 20 (inclusive).

You are free to use commas (,) and points (.) wherever for readability.
They won't change how the command functions (ex.: >=1,000,000)