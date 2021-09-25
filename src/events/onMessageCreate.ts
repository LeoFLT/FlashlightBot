import config from "../config/envVars";
import Logger from "../utils/logger";
import parser from "../utils/parser";
import { Flashlight } from "../classes/Flashlight";
import { Message as DiscordMessage } from "discord.js";
import Keyv from "keyv";

export const event: Flashlight.Event = {
    name: "messageCreate",
    once: false,
    async execute(client, message: DiscordMessage) {
        if (message.author.bot)
            return;

        if (message.guild && message.mentions.users.first()?.id === client.user?.id && client?.user?.id) {
            const newPrefix = /(prefix)(?:(\s+|:\s+)(.{1,3}))?/.exec(message.content);
            
            if (newPrefix && newPrefix[2]) {
                await client.prefixes.set(message.guild.id, newPrefix[2]);
                return message.reply(`Prefix set to \`${newPrefix[2]}\``);
            }

            if (newPrefix && newPrefix[1])
                return message.reply(`Flashlight's prefix for this guild is \`${await client.prefixes.get(message.guild.id) || config.discord.prefix}\``)
            
        }

        let prefix: string = config.discord.prefix  as string;
        if (message.guild) {
            const guildPrefix = await client.prefixes.get(message.guild.id);
            if (guildPrefix)
                prefix = guildPrefix;
        }        

        if (!message.content.startsWith(prefix))
            return;

        const strArgs = message.content.slice(prefix.length).trim().split(/\s+/);
        const commandName = strArgs.shift()?.toLowerCase() as string;
        const args = parser(strArgs);
        const command = client.commands.get(commandName) || client.commands.find(command => command.aliases && command.aliases.includes(commandName));

        if (!command)
            return;

        if (command.hasArgs && !!!args.size) {
            return message.reply("No arguments provided");
        }

        try {
            if (commandName === "prefix" || commandName === "help")
                command.execute(client, args, strArgs, message);
            else
                command.execute(client, args, message); 
        } catch (e: any) {
            Logger.error(e.message);
            return message.reply("An unknown error has occurred. Please try again.");
        }
    }
}
