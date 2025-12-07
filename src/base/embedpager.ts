import { APIEmbedField, EmbedBuilder } from "discord.js"

/**
 * Slice embed fields into embeds of correct size.
 * @param fields The fields to slice.
 * @param title A string representing the title, 
 * or a function that takes the current page index and returns the title.
 * @returns The sliced embeds as {@link EmbedBuilder}s
 */
function sliceEmbeds(
    fields: APIEmbedField[],
    title: string | ((index: number) => string)
): EmbedBuilder[] {
    let getTitle: (index: number) => string
    if (typeof title == "string") {
        getTitle = () => title
    } else {
        getTitle = title
    }

    let i = 0
    const output: EmbedBuilder[] = []
    let curEmbed = new EmbedBuilder()
    .setTitle(getTitle(i))

    const chunkSize = 25

    for (let index = 0; index < fields.length; index++) {
        const field = fields[index]

        if (
            JSON.stringify(curEmbed.toJSON()).length +
                (field.name.length + field.value.length) >
                6000 ||
            (index % chunkSize == 0 && index > chunkSize - 1)
        ) {
            // dump result
            i++
            output.push(curEmbed)
            curEmbed = new EmbedBuilder().setTitle(getTitle(i))
        }

        curEmbed.addFields(field)
    }

    if (JSON.stringify(curEmbed.toJSON()).length) output.push(curEmbed)

    return output
}

export default sliceEmbeds
