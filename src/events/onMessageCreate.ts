import config from "../config/envVars";
import Logger from "../utils/logger";
import parser from "../utils/parser";
import { Flashlight } from "../classes/Flashlight";
import { Message as DiscordMessage } from "discord.js";

export const event: Flashlight.Event = {
    name: "messageCreate",
    once: false,
    async execute(client, message: DiscordMessage) {
        if (message.author.bot)
            return;

        if (message.guild && message.mentions.users.first()?.id === client.user?.id && client?.user?.id) {
            const newPrefix = /(prefix)(?:(?:\s+|:\s+)(.{1,3}))?/.exec(message.content);
            
            if (newPrefix  && newPrefix[1] && newPrefix[2]) {
                await client.prefixes.set(message.guild.id, newPrefix[2]);
                try {
                    return message.reply(`Prefix set to \`${newPrefix[2]}\``);
                } catch (e: any) {
                    return Logger.error(e?.message);
                }
            }

            if (newPrefix && newPrefix[1]) {
                try {
                    return message.reply(`Flashlight's prefix for this guild is \`${await client.prefixes.get(message.guild.id) || config.discord.prefix}\``);
                } catch (e: any) {
                    return Logger.error(e?.message);
                }
            }
            
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

        if (command.hasArgs && (!!!args.size && !!!strArgs.length)) {
            const helpCmd = client.commands.get('help');
            return helpCmd?.execute(client, args, [command.name], message);
        }

        try {
            if (command.name === "prefix" || command.name === "help")
                command.execute(client, args, strArgs, message);
            else
                command.execute(client, args, message); 
        } catch (e: any) {
            Logger.error(e.message);
            return message.reply("An unknown error has occurred. Please try again.");
        }
    }
}
