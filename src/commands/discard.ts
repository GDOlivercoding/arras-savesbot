import { SlashCommandBuilder } from "discord.js"
import { Command } from "../base/types"
import saveCollection from "../base/saves"

const command: Command = {
    payload: new SlashCommandBuilder()
        .setName("discard")
        .setDescription("Discard a save.")
        .addStringOption((o) =>
            o
                .setName("code-id")
                .setDescription("The code ID of the save.")
                .setRequired(true)
        ),
    async execute(interaction) {
        const codeid = interaction.options.getString("code-id", true)

        try {
            const save = saveCollection.discard(codeid)
            interaction.reply(`Successfully discarded ${save.path.name}!`)
        } catch (error) {
            return interaction.reply(`${error}`)
        }
    },
    test() {
        return true
    }
}

export default command
