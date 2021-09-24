import Logger from "../utils/logger";
import parser from "../utils/parser";
import { Flashlight } from "../classes/Flashlight";
import { Message as DiscordMessage } from "discord.js";

export const event: Flashlight.Event = {
    name: "messageCreate",
    once: false,
    execute(client, message: DiscordMessage) {
        if (message.author.bot)
            return;
        const strArgs = message.content.slice(1).trim().split(/\s+/);
        const commandName = strArgs.shift()?.toLowerCase() as string;
        const args = parser(strArgs);
        const command = client.commands.get(commandName) || client.commands.find(command => command.aliases && command.aliases.includes(commandName));

        if (!command)
            return;

        if (command.hasArgs && !!!args.size) {
            return message.reply('No arguments provided');
        }

        try {
            command.execute(client, args, message); 
        } catch (e: any) {
            Logger.error(e.message);
            return message.reply("An unknown error has occurred. Please try again.");
        }
    }
}
