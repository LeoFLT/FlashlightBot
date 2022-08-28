import { REST } from '@discordjs/rest';
import { Routes } from "discord.js";
import { readdirSync } from "fs";
import path from "path";
import config from "../config/envVars";
import Logger from "./logger";

const commands: any[] = [];
const commandFiles = readdirSync(path.join(__dirname, "..", "commands")).filter((file: string) => file.endsWith('.js'));

for (const file of commandFiles) {
    const { command } = require(path.join(__dirname, "..", "commands", file));
    if (command.data?.name)
        commands.push(command.data);
}
const rest = new REST({ version: "10" }).setToken(config.discord.token as string);

export default async function buildSlashCommands() {
    try {
        Logger.info("Started refreshing application commands.");
        await rest.put(Routes.applicationCommands(config.discord.clientId as string), { body: commands });
        Logger.info("Successfully reloaded application commands.");
    }
    catch (error) {
        Logger.error(error);
    }
};
