import config from "./config/envVars";
import Logger from "./utils/logger";
import { Flashlight } from "./classes/Flashlight";
import { readdirSync } from "fs";
import { GatewayIntentBits, Partials } from "discord.js";
import BuildSlashCommands from "./utils/slashCommandBuilder";

const client = new Flashlight.Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages], partials: [Partials.Channel] });
const commandFiles = readdirSync(`${__dirname}/commands`).filter(file => file.endsWith('.js'));
const eventFiles = readdirSync(`${__dirname}/events`).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
    try {
        const command: Flashlight.Command = require(`${__dirname}/commands/${file}`)?.command;
        if (!command)
            continue;
        client.addCommand(command.data.name, command);
        Logger.info(`Loaded command: ${file}`);
    } catch (e: any) {
        Logger.error(e);
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

BuildSlashCommands().then(() => client.login(config.discord.token));
client.on("warn", e => Logger.info(e));