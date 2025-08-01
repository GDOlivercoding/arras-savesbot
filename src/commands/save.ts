import "dotenv/config"
import { Attachment, SlashCommandBuilder } from "discord.js";
import { Command } from "./utilities/types";
import { main as savescore, test as savetest } from "./utilities/savescore";

const command: Command = {
    payload: new SlashCommandBuilder()
    .setName("save")
    .setDescription("Save a score.")
    .addStringOption(o => o
        .setName("code")
        .setDescription("code")
        .setRequired(true)
    )
    .addAttachmentOption(o => o
        .setName("screenshot_1")
        .setDescription("screenshot_1")
        .setRequired(false)
    )
    .addAttachmentOption(o => o
        .setName("screenshot_2")
        .setDescription("screenshot_2")
        .setRequired(false)
    )
    .addBooleanOption(o => o
        .setName("restore")
        .setDescription("restore")
    ),
    async execute(interaction) {
        if (interaction.user.id != process.env.OWNER_ID) {
            interaction.reply("Owner command only.");
            return;
        }

        const code = interaction.options.getString("code", true);
        const ss1 = interaction.options.getAttachment("screenshot_1", true);
        const ss2 = interaction.options.getAttachment("screenshot_2", true);
        const restore = interaction.options.getBoolean("restore");

        let windowed: Attachment
        let fullscreen: Attachment;

        if (ss1.size >= ss2.size) {
            [windowed, fullscreen] = [ss1, ss2]
        } else {
            [windowed, fullscreen] = [ss2, ss1]
        }

        let promise = interaction.reply(`Saving ${code} ...`)

        try {
            const text = await savescore(
                interaction, code, windowed, fullscreen, 
                restore == null ? true : restore
            );
            await promise;
            interaction.editReply("Saved score successfully.\n" + text.written);

        } catch (error) {
            const replyFuncChoice = interaction.replied ? interaction.editReply : interaction.reply;
            replyFuncChoice(`Something went wrong: ${error}`)
        }
        
    },
    test: savetest
}

export default command;