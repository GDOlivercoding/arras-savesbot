import { SlashCommandBuilder } from "discord.js";
import { Command } from "./utilities/types";
import { Path } from "pathobj/tspath";

const path = new Path(import.meta.dirname).join("utilities", "find-help.txt");

const command: Command = {
    payload: new SlashCommandBuilder()
    .setName("find-help")
    .setDescription("Help of the /find command."),

    async execute(interaction) {
        interaction.reply({
            flags: "Ephemeral",
            content: path.readText()
        });
    },

    test() {
        return path.exists();
    },
}

export default command;