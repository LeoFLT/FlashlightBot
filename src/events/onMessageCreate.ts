import Logger from "../utils/logger";
import { Event } from "../classes/Flashlight";
import { Message as DiscordMessage } from "discord.js";

export const event: Event = {
    name: "messageCreate",
    once: false,
    execute(client, message: DiscordMessage) {
        const args = message.content.slice(1).trim().split(/\s+/);
        const commandName: any = args.shift()?.toLowerCase();
        const command = client.commands.get(commandName) || client.commands.find(command => command.aliases && command.aliases.includes(commandName));
        
        if (!command) return;
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