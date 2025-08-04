import { SaveCode } from "./utilities/code"
import { SlashCommandBuilder } from "discord.js"
import { Command } from "./utilities/types"
import unixFormat from "./utilities/unixformat"

const command: Command = {
    payload: new SlashCommandBuilder()
        .setName("analyze")
        .setDescription("Analyze a code and return it readable and parsed.")
        .addStringOption((option) =>
            option
                .setName("code")
                .setDescription("The Arras.io save code to analyze.")
                .setRequired(true)
        )
        .addBooleanOption((option) =>
            option
                .setName("blur_token")
                .setDescription(
                    "Blur the safety token in the output for privacy."
                )
                .setRequired(false)
        ),
    async execute(interaction) {
        const textCode = interaction.options.getString("code", true)
        const blur =
            interaction.options.getBoolean("blur_token", false) || false

        const res = SaveCode.validate(textCode)
        if (res.state == "err") {
            interaction.reply(`Invalid code! ${res.message}`)
            return
        }

        const code = new SaveCode(textCode)

        const contents = [
            `ID: ${code.ID}`,
            `Server: [#${code.server.id}](${code.server})`,
            `Region: ${code.server.region}`,
            `Mode: ${code.mode}`,
            `Sub-mode: ${code.dirSortedMode}`,
            `Tank: ${code.tankClass}`,
            `Build: ${code.build}`,
            `Kills/Assists/Boss kills: ${code.kills}/${code.assists}/${code.bossKills}`,
            `Polygons destroyed/Dread kills: ${code.polygonsDestroyed}/${code.customKills}`,
            `Score: ${code.formattedScore}`,
            `Kills/Million: ${(((code.kills + code.assists / 25) / code.rawScore) * 1_000_000).toFixed(2)}`,
            `Saved at: ${code.creationTimestamp(unixFormat.DDmmmmYYYY_HHMM)}, ${code.creationTimestamp(unixFormat.relative)}`,
            `Safety token: ${blur ? "||" + code.safetyToken + "||" : code.safetyToken}`,
        ]

        interaction.reply(contents.join("\n"))
    },
    test() {
        // just making sure the object is defined
        return !!SaveCode
    },
}

export default command
