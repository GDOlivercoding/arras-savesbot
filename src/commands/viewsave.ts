import { AttachmentBuilder, SlashCommandBuilder } from "discord.js"
import { Command, SaveOrSaveStruct } from "./utilities/types"
import saveCollection from "./utilities/saves"

const command: Command = {
    payload: new SlashCommandBuilder()
        .setName("view-save")
        .setDescription("Get the information of a save.")
        .addStringOption((o) =>
            o
                .setName("code-id")
                .setDescription("The target code's ID (first element).")
                .setRequired(true)
        )
        .addIntegerOption((o) =>
            o
                .setName("history-index")
                .setDescription("Optional index of the save's history.")
                .setRequired(false)
        ),
    async execute(interaction) {
        const codeID = interaction.options
            .getString("code-id", true)
            .trimStart()
            .trimEnd()
        const historyIndex = interaction.options.getInteger("history-index")

        const save = saveCollection.getSaveByID(codeID)
        if (!save) {
            return interaction.reply(`Can't find a save with id ${codeID}`)
        }

        let target: SaveOrSaveStruct
        if (historyIndex != null) {
            target = save.history[historyIndex - 1]
            if (!target) {
                return interaction.reply(
                    "History index out of bounds," +
                        ` code ${save.code} only` +
                        ` has ${save.history.length} past saves, not ${historyIndex}`
                )
            }
        } else {
            target = save
        }

        const files: AttachmentBuilder[] = []
        if (target.windowed) {
            const { path, windowed } = target
            const buf = windowed.readBuffer()
            files.push(
                new AttachmentBuilder(buf)
                    .setName(
                        `windowed-death-screenshot-${path.name}.${windowed.suffix}`
                    )
                    .setDescription(
                        `Windowed death screenshot of Arras.io run ${path.name}.`
                    )
            )
        }

        if (target.fullscreen) {
            const { path, fullscreen } = target
            const buf = fullscreen.readBuffer()
            files.push(
                new AttachmentBuilder(buf)
                    .setName(
                        `fullscreen-death-screenshot-${path.name}.${fullscreen.suffix}`
                    )
                    .setDescription(
                        `Fullscreen death screenshot of Arras.io run ${path.name}.`
                    )
            )
        }

        const output: string[] = []
        if (target.history) {
            for (let i = 0; i < target.history.length; i++) {
                const save = target.history[i]
                output.push(
                    Array(2)
                        .fill("`")
                        .join(`${i + 1}: ${save.path.name}`)
                )
            }
        }

        const content =
            `Viewing save with code ${save.code},` +
            ` with ${files.length} screenshot${files.length == 1 ? "" : "s"}.` +
            `\nName: ${save.path.name}\n` +
            (target.history
                ? "History:\n" + output.join("\n")
                : `History index ${historyIndex}.`)

        interaction.reply({ content, files })
    },
    test() {
        return true
    }
}

export default command
