import "dotenv/config";
import { commands } from "./get-commands";
import { Client, GatewayIntentBits, REST, Routes, MessageMentions } from 'discord.js';

for (let [name, cmd] of Object.entries(commands)) {
    if (!cmd.test()) {
        throw new Error(`Command test of ${name} has failed.`);
    }
}

const rest = new REST({version: "10"}).setToken(process.env.TOKEN || "MISSING");
rest.put(
    Routes.applicationCommands(process.env.APP_ID || "MISSING"), 
    {body: Object.values(commands).map(cmd => cmd.payload.toJSON())}
)
.then(() => console.log("Successfully synced commands"));


const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent
    ]
});

client.once("ready", async client => {
    console.log("Ready!", client.user.tag);

    const channel = await client.channels.fetch("1395076755274072116");
    if (channel && channel.isSendable()) {
        channel.send("Ready!")
    } else {
        throw new Error("Wrong channel." + channel)
    }
})

client.on('interactionCreate', interaction => {
    if (!interaction.isChatInputCommand()) return;
    commands[interaction.commandName].execute(interaction)
});

client.login(process.env.TOKEN);