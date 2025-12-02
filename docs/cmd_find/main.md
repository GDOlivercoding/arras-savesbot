# [command: /find](./main.md)

**Description**:
Filter and find saves based on options and code parts.

# **Options:**
NOTE: All code parts are matchable in the match-code options.

- **screenshot-count**: Filter saves by the number of screenshots. **type**: [**NumberOperation**](./numOp.md)
- **sub-mode**: Filter by the sub-mode (dirSortedMode) of the save. **type**:  A choice of strings
- **history-count**: Filter by the number of past saves. Supports comparison expressions. **type**: [**NumberOperation**](./numOp.md)
- **region**: Filter by the server region where the save was made. **type**: A choice of strings
- **match-code**: Match code parts. See the parameter type for details.  **type**: [**CodePartExpression**](./codeParts.md)