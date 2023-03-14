const nodeCron = require("node-cron");
const fetch = require("node-fetch");

var isLive = false;
var interval = 3;
var client;

var userAgents = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/110.0.1587.69",
];

let checkTask;

const createCheckTask = () => {
    checkTask = nodeCron.schedule(`*/${interval} * * * *`, async () => {
        console.log("Checking if Sam is live");

        await isSamLive();
    });
};

// first time init
createCheckTask();

const isSamLive = async () => {
    const response = await fetch("https://www.youtube.com/@sam/streams", {
        headers: {
            "User-Agent": isLive ? userAgents[0] : userAgents[1],
        },
    });

    const data = await response.text();
    const liveLabelIndex = data.indexOf('{"label":"LIVE"}');

    if (liveLabelIndex > -1) {
        if (isLive) {
            return true;
        }

        console.log("Sam is now live! Sending Discord ping...");
        isLive = true;

        checkTask.stop();
        interval = 59;
        createCheckTask();
        checkTask.start();

        if (client) {
            client.channels.cache
                .get("835283858768396358")
                .send(
                    `@everyone Sam just went live! <:LIVE:432677353211297823>\nhttps://www.youtube.com/@sam/live`
                );
        }

        return true;
    }

    if (isLive) {
        isLive = false;

        console.log("Stream must have ended. Checking again in 6 minutes...");
        checkTask.stop();
        interval = 3;
        createCheckTask();
        checkTask.start();
    } else {
        console.log("No updates...");
    }

    return false;
};

const setClient = (newClient) => {
    client = newClient;
};

module.exports = {
    checkTask,
    setClient,
};
