import { parse } from "arras-parser"
import { Gamemode } from "arras-parser/types"
import { SlashCommandBuilder } from "discord.js"
import { Command } from "../base/types"

const command: Command = {
    payload: new SlashCommandBuilder()
        .setName("parsemode")
        .setDescription("Parse a gamemode string.")
        .addStringOption((option) =>
            option.setName("mode").setDescription("mode").setRequired(true)
        ),
    async execute(interaction) {
        const mode = interaction.options.getString("mode", true)

        let result: Gamemode

        try {
            result = parse(mode)
        } catch (error) {
            interaction.reply(`${error}`)
            return
        }

        interaction.reply(`${result}`)
    },
    test() {
        return (
            parse("am4")
            && parse("ag1sx17bastion")
            && parse("w33oldscdreadnoughts")
            && parse("aeaovergrowth")
            && parse("2").teamType == "2tdm"
            && parse("x16layout").mapLayout[0] == "layout"
            && parse("agrmop").prefixFlags == 126
        ) 
    }
}

export default command
