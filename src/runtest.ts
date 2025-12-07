import { Path } from "pathobj/tspath";

const tests = Path.cwd("tests");
for (const test of tests.iterDir(i => i.isFile() && i.name.endsWith(".test.ts"))) {
    const module = await import(test.toFileURL().toString())
    const value = module.default;
    if (value)
        console.log(`Test ${test.stem} succeeded with value: \n${value}`)
    else {
        console.log(`Test ${test.stem} failed with value: \n${value}.`)
        break;
    }
}