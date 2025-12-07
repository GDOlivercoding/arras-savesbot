import { SlashCommandBuilder } from "discord.js";
import { Command } from "../base/types";
import { serverStatus } from "../base/utils";
import { APIServer } from "../base/code";
import sliceEmbeds from "../base/embedpager";

const command: Command = {
    payload: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Search for servers")
    .addBooleanOption(o => o
        .setName("no-sandboxes")
        .setDescription("Don't show sandboxes")
    )
    ,
    async execute(interaction) {
        const noSandboxes = interaction.options.getBoolean("no-sandboxes") || false;

        const status = await serverStatus()
        let servers = Object.values(status).map(server => new APIServer(server))

        if (noSandboxes) {
            servers = servers.filter(server => !server.isSandbox)
        }

        const contents = servers.map(server => {
            const maxClients = server.maxClients ? `/${server.maxClients}p` : ""
            let text = `[#${server.name}](${server}) ${server.mode} ${server.clients}p${maxClients}`
            if (!server.online) {
                text = `*${text}*`;
            }

            return text
        });

        const embeds = sliceEmbeds(contents.map(line => ({name: "Server", inline: true, value: line})), "Results");

        interaction.reply({embeds: [embeds[0]]})
    },
    
}

export default command;