import { Path } from 'pathobj/tspath'
import { Command } from './commands/utilities/types';

const cmdDir = Path.cwd("commands");
let commands: {[name: string]: Command} = {};

for (let item of cmdDir.iterDir(item => item.isFile())) {
    const module = await import(item.toFileURL().toString());
    const command: Command = module.default;
    commands[command.payload.name] = command;
    
}

export { commands };