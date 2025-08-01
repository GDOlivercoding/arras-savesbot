import { parse } from "arras-parser";
import { Gamemode } from "arras-parser/types";
import { SlashCommandBuilder } from "discord.js";
import { Command } from "./utilities/types";

const command: Command = {
    payload: new SlashCommandBuilder()
    .setName('parsemode')
    .setDescription('Parse a gamemode string.')
    .addStringOption(option => option
        .setName("mode")
        .setDescription("Kill yourself immediately.")
        .setRequired(true)
    ),
    async execute(interaction) {
        const mode = interaction.options.getString('mode', true);

        let result: Gamemode;
        
        try {
            result = parse(mode);
        } catch (error) {
            interaction.reply(`${error}`)
            return;
        }  

        interaction.reply(`${result}`)
    },
    test() {
        return !!parse
    },
}

export default command;