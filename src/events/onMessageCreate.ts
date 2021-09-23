import Logger from "../utils/logger";
import { Flashlight } from "../classes/Flashlight";
import { Message as DiscordMessage } from "discord.js";

export const event: Flashlight.Event = {
    name: "messageCreate",
    once: false,
    execute(client, message: DiscordMessage) {
        if (message.author.bot)
            return;
        const args = message.content.slice(1).trim().split(/\s+/);
        const commandName = args.shift()?.toLowerCase() as string;
        console.log(message.content, commandName);
        const command = client.commands.get(commandName) || client.commands.find(command => command.aliases && command.aliases.includes(commandName));
        
        if (!command)
            return;

        if (command.hasArgs && !args.length) {
            message.reply('No arguments provided');
        }

        try {
            command.execute(client, args, message); 
        } catch (e: any) {
            Logger.error(e.message);
        }
    }
}
