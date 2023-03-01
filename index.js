const { REST, Routes } = require("discord.js");
const { Client, GatewayIntentBits } = require("discord.js");
const fetch = require("node-fetch");

require("dotenv").config();

const rest = new REST({ version: "10" }).setToken(
    process.env.DISCORD_BOT_TOKEN
);

(async () => {
    try {
        console.log("Started refreshing application (/) commands.");

        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_BOT_CLIENT_ID),
            {
                body: [],
            }
        );

        console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
        console.error(error);
    }
})();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
    ],
});

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", async (message) => {
    try {
        if (message.author.bot) return;

        // check if member is Moderator permissions
        if (
            !message.member.permissions.has("ModerateMembers") &&
            !message.member.roles.cache.has("1066421968926154772")
        ) {
            return;
        }

        const prefix = "/clip";
        if (message.content.toLowerCase().indexOf(prefix) !== 0) return;

        let msgContent = message.content.slice(prefix.length).trim();
        if (msgContent.length === 0) {
            msgContent = "Untitled";
        }

        const res = await fetch(
            "https://api.streamaze.live/timestamp/discord-reply",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    timestamp: new Date().toUTCString(),
                    title: msgContent,
                }),
            }
        );

        const json = await res.json();
        if (json?.timestamp && json?.url) {
            message.reply(
                `Timestamp: ${json.timestamp}\nTitle: ${json.title}\nLink: ${json.url}`
            );
        } else {
            if (json?.message) {
                message.reply(json.message);
            } else {
                message.reply("Something went wrong!");
            }

            console.error(json);
        }
    } catch (error) {
        console.error(error);
        message.reply("Something went wrong!");
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);
