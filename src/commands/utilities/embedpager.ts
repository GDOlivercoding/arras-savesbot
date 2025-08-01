import { APIEmbedField, EmbedBuilder } from "discord.js";

function sliceEmbeds(
    fields: APIEmbedField[],
    title: string | ((index: number) => string)
): EmbedBuilder[] {

    let getTitle: (index: number) => string
    if (title instanceof Function) {
        getTitle = title
    } else {
        getTitle = () => title
    }

    let i = 0;
    const output: EmbedBuilder[] = [];
    let curEmbed = new EmbedBuilder()
    curEmbed.setTitle(getTitle(i))

    const chunkSize = 25

    for (let index = 0; index < fields.length; index++) {
        const field = fields[index]

        if (JSON.stringify(curEmbed.toJSON()).length 
            + (field.name.length + field.value.length) 
            > 6000
            || (index % chunkSize == 0 
            && index > chunkSize - 1)
        ) {
            // dump result
            i++;

            console.log(JSON.stringify(curEmbed.toJSON()).length)
            output.push(curEmbed)
            curEmbed = new EmbedBuilder().setTitle(getTitle(i))
        }

        curEmbed.addFields(field);
    }

    if (JSON.stringify(curEmbed.toJSON()).length) 
        output.push(curEmbed)

    return output;
}

export default sliceEmbeds;