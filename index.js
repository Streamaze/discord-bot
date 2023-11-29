const {
    REST,
    Routes,
    ActivityType,
    Client,
    GatewayIntentBits,
} = require("discord.js");
const fetch = require("node-fetch");
const express = require("express");

// ---------------------------------------
// Initialize Discord Bot
// ---------------------------------------

require("dotenv").config();

const rest = new REST({ version: "10" }).setToken(
    process.env.DISCORD_BOT_TOKEN
);

const { checkTask, setClient } = require("./src/modules/LiveChecker");

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
        GatewayIntentBits.GuildEmojisAndStickers,
    ],
    allowedMentions: {
        parse: ["everyone"],
    },
});

checkTask.start();
setClient(client);

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setStatus("online");
    client.user.setActivity("Sam's stream", {
        type: ActivityType.Watching,
    });
});

client.on("messageCreate", async (message) => {
    try {
        if (message.author.bot) return;

        // check if member has permissions
        if (
            !message.member.permissions.has("Administrator") &&
            !message.member.roles.cache.has("1095878889756184637")
        ) {
            return;
        }

        let prefix = "/clip";
        if (message.content.toLowerCase().indexOf(prefix) === 0) {
            let msgContent = message.content.slice(prefix.length).trim();
            if (msgContent.length === 0) {
                msgContent = "Untitled";
            }

            const res = await fetch(
                `${process.env.STREAMAZE_API_URL}/timestamp/discord-reply`,
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
        } else if (message.content.toLowerCase().indexOf("/ticker") === 0) {
            prefix = "/ticker";
            let msgContent = message.content.slice(prefix.length).trim();
            if (msgContent.length === 0) {
                msgContent = "";
            }

            const res = await fetch(
                `https://api.lanyard.rest/v1/users/${process.env.LANYARD_USER_ID}/kv/ticker`,
                {
                    method: "PUT",
                    body: msgContent,
                    headers: {
                        Authorization: process.env.LANYARD_API_KEY,
                    },
                }
            );

            if (res.status === 204) {
                message.reply("Done!");
            }
        } else if (message.content.toLowerCase().indexOf("/t") === 0) {
            prefix = "/t";
            let msgContent = message.content.slice(prefix.length).trim();
            if (msgContent.length === 0) {
                msgContent = "";
            }

            const res = await fetch(
                `https://api.lanyard.rest/v1/users/${process.env.LANYARD_USER_ID}/kv/ticker`,
                {
                    method: "PUT",
                    body: msgContent,
                    headers: {
                        Authorization: process.env.LANYARD_API_KEY,
                    },
                }
            );

            if (res.status === 204) {
                message.reply("Done!");
            }
        }
    } catch (error) {
        console.error(error);
        message.reply("Something went wrong!");
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);

// ---------------------------------------
// Initialize Express
// ---------------------------------------
const router = express.Router();

router.post("/webhook/highlight/:channelId", (req, res) => {
    const discordChannelId = req?.params?.channelId;
    const body = req?.body;
    try {
        const message = body?.message;
        if (message) {
            client.channels.cache.get(discordChannelId).send(message);
            res.sendStatus(200);
        } else {
            console.log("Empty message: ", body, " to: ", discordChannelId);
        }
    } catch (e) {
        console.error(e);
        res.sendStatus(500);
    }
});

const app = express();
app.use(express.json());
app.use(router);
app.listen(8000, () => {
    console.log("Express server started on port 8000");
});
