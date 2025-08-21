import { Path } from "pathobj/tspath"
import { Command } from "./base/types"

const cmdDir = Path.cwd("commands")
const commands: { [name: string]: Command } = {}

for (const item of cmdDir.iterDir((item) => item.isFile() && item.suffix == ".ts")) {
    const module = await import(item.toFileURL().toString())
    const command: Command = module.default
    commands[command.payload.name] = command
}

export { commands };