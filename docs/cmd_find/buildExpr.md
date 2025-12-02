# [BuildExpression:](./buildExpr.md)

Match a build by upgrade skills with [**NumberOperation**](...)s.
The expression matches at the start at ends when there's nothing else to match.
Leave a slot between slashes to indicate any (might change this to something like a ?).
Special: append a dollar sign ($) to the end to anchor matching to the end of the build.

Examples:
- 0/0 matches the first 2 upgrade skills to be exactly 0 (glass builds)
- //<=5 matches if only the third upgrade is <=5
- //<2>7/<1>7/<=5/<1>7/<=2 matches builds with high bullet (drone) speed and damage, but low reload (usually drone tanks)
- \>=4/$ matches at the end of the build, if the build has a lot of shield regeration
- <2>2/<2>2$ second end-anchoring example
- 10/<5-8>//>=50/<2>7 a showoff example