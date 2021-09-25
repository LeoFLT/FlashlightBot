import config from "./config/envVars";
import Logger from "./utils/logger";
import { Flashlight } from "./classes/Flashlight";
import { readdirSync } from "fs";
import { Intents } from "discord.js";

const client = new Flashlight.Client ({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES], partials: ['CHANNEL']});
const commandFiles = readdirSync(`${__dirname}/commands`).filter(file => file.endsWith('.js'));
const eventFiles = readdirSync(`${__dirname}/events`).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
    try {
        const command: Flashlight.Command = require(`${__dirname}/commands/${file}`).command;
        client.addCommand(command.name, command);
        Logger.info(`Loaded command: ${file}`);
    } catch (e: any) {
        Logger.error(`${file}: ${e.message}`);
    }
}

for (const file of eventFiles) {
    try {
        const event: Flashlight.Event = require(`${__dirname}/events/${file}`).event;
        client.addEvent(event.once, event.name, (...args: any[]) => event.execute(client, ...args));
        Logger.info(`Loaded event: ${file}`);
    } catch (e: any) {
        Logger.error(e.message);
    }
}

client.login(config.discord.token);
client.prefixes.on("error", err => Logger.error("Keyv: " + err));