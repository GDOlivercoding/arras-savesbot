import {
    //ActionRowBuilder,
    //ChatInputCommandInteraction,
    //InteractionEditReplyOptions,
    InteractionReplyOptions,
    SlashCommandBuilder,
    //StringSelectMenuBuilder,
    //StringSelectMenuInteraction,
    //StringSelectMenuOptionBuilder
} from "discord.js"

import {
    Command,
    DirSortedMode,
    Region,
    SaveQueryOptions
} from "../base/types"

import saveCollection, {
    modes,
    //modeToDescription,
    regions
} from "../base/saves"

import sliceEmbeds from "../base/embedpager"
import { InteractionCompiler } from "../base/oper"

const command: Command = {
    payload: new SlashCommandBuilder()
        .setName("find")
        .setDescription("Search the saves.")
        // TODO
        //.addBooleanOption((o) =>
        //    o
        //        .setName("include-ended-runs")
        //        .setDescription("Whether to include delete runs in the search.")
        //)
        .addStringOption((o) =>
            o
                .setName("screenshot-count")
                .setDescription("Filter saves by the number of screenshots.")
        )
        .addStringOption((o) =>
            o
                .setName("sub-mode")
                .setDescription(
                    "Filter by the sub-mode (dirSortedMode) of the save. **Editable later**"
                )
                .addChoices(
                    modes.map((value) => {
                        return { name: value, value }
                    })
                )
        )
        .addStringOption((o) =>
            o
                .setName("history-count")
                .setDescription(
                    "Filter by the number of past saves. Supports comparison."
                )
        )
        .addStringOption((o) =>
            o
                .setName("region")
                .setDescription("The region of the server where it was saved.")
                .addChoices(
                    regions.map((value) => {
                        return { name: value, value }
                    })
                )
        )
        .addStringOption((o) =>
            o
                .setName("match-code")
                .setDescription(
                    "Match any part of the code. do /find-help for help."
                )
        ),
    /** This is a wrapper of {@link saveCollection.querySaves}. */
    async execute(interaction) {
        const compiler = new InteractionCompiler(interaction)
        const options = interaction.options

        const includeEnded = false // options.getBoolean("include-ended-runs")
        const screenshotExpr = options.getString("screenshot-count")
        const dirSortedMode = options.getString("sub-mode") as
            | DirSortedMode
            | undefined
        const historyExpr = options.getString("history-count")
        const region = options.getString("region") as Region | undefined
        const codeMatchExpr = options.getString("match-code")

        const ssFunc = compiler.compileNumOp(screenshotExpr)
        if (ssFunc == false) return

        const historyFunc = compiler.compileNumOp(historyExpr)
        if (historyFunc == false) return

        const codeParts = compiler.compileCodeMatch(codeMatchExpr)
        if (codeParts == false) return

        const searchOptions: SaveQueryOptions = {
            screenshots: ssFunc,
            history: historyFunc,
            dirSortedMode: dirSortedMode,
            region,
            codeParts
        }

        console.log(searchOptions)

        const results = saveCollection.querySaves(searchOptions, includeEnded)

        // const dirSortedModeSelectMenu = new StringSelectMenuBuilder()
        //     .setCustomId("dir-sorted-mode-menu")
        //     .setPlaceholder("<DirSortedMode>")
        //     .addOptions(modes.map(mode => {
        //         return new StringSelectMenuOptionBuilder()
        //         .setLabel(mode)
        //         .setValue(mode)
        //         .setDescription(modeToDescription[mode])
        //     }))

        // const row = new ActionRowBuilder<StringSelectMenuBuilder>()
        //     .addComponents(dirSortedModeSelectMenu)

        const fieldSize = 25

        const embeds = sliceEmbeds(
            results.map((save) => {
                return {
                    name: save.path.name,
                    value: `${save.code}`,
                    inline: true
                }
            }),
            (i) => `Found ${results.length} results page ${i % fieldSize}:`
        )

        // const sendingOptions: InteractionReplyOptions & { withResponse: true } = {
        //     withResponse: true,
        //     embeds: [embeds[0]],
        //     components: [row],
        // }

        const sendingOptions: InteractionReplyOptions = {
            embeds: [embeds[0]]
        }

        interaction.reply(sendingOptions)

        // const collectorFilter = (i) => i.user.id === interaction.user.id;

        // try {
        //     const confirmation = await response.resource!.message!.awaitMessageComponent({
        //         filter: collectorFilter, time: 60_000
        //     }) as StringSelectMenuInteraction;

        //     if (confirmation.customId != "dir-sorted-mode-menu") return;

        //     searchOptions.dirSortedMode = confirmation.values as DirSortedMode[]
        //     results = saveCollection.querySaves(searchOptions, includeEnded);

        //     embeds = sliceEmbeds(
        //         results.map(
        //         save => {return {name: save.path.name, value: save.code.toString(), inline: true}}),
        //         i => `A saves search done by ${interaction.user.globalName} page ${i % fieldSize}:`
        //     );

        //     sendingOptions.embeds = [embeds[0]];
        //     interaction.editReply(sendingOptions as InteractionEditReplyOptions)

        // } catch {
        //     /* empty */
        // }
    },
    test() {
        return true
    }
}

export default command
