import config from "../config/envVars";
import Logger from "../utils/logger";
import parser from "../utils/parser";
import { Flashlight } from "../classes/Flashlight";
import { Message as DiscordMessage, MessagePayload, ReplyMessageOptions, Permissions } from "discord.js";
const bitFieldBasic = new Permissions([
    Permissions.FLAGS.EMBED_LINKS,
    Permissions.FLAGS.VIEW_CHANNEL,
    Permissions.FLAGS.SEND_MESSAGES
]);
const bitFieldReply = new Permissions([Permissions.FLAGS.READ_MESSAGE_HISTORY]);

export const event: Flashlight.Event = {
    name: "messageCreate",
    once: false,
    async execute(client, message: DiscordMessage) {
        if (message.author.bot)
            return;
        if (message.channel.type === "GUILD_TEXT" || message.channel.type === "GUILD_NEWS")
            if (message.guild?.me && !message.channel.permissionsFor(message.guild.me).has(bitFieldBasic))
                return;

        let useReply = false;

        if (message.channel.type !== "DM") {
            if (message?.guild?.me)
                useReply = message.channel.permissionsFor(message?.guild?.me).has(bitFieldReply);
        } else {
            useReply = true;
        }

        const sendMsg = ((opts: string | MessagePayload | ReplyMessageOptions) => {
            if (useReply)
                return message.reply(opts);
            else
                return message.channel.send(opts);
        });
        if (message.guild && message.mentions.users.first()?.id === client.user?.id && client?.user?.id) {
            const newPrefix = /(prefix)(?:(?:\s+|:\s+)(.{1,3}))?/.exec(message.content);
            
            if (newPrefix  && newPrefix[1] && newPrefix[2]) {
                await client.prefixes.set(message.guild.id, newPrefix[2]);
                try {
                    return sendMsg(`Prefix set to \`${newPrefix[2]}\``);
                } catch (e: any) {
                    return Logger.error(e?.message);
                }
            }

            if (newPrefix && newPrefix[1]) {
                try {
                    return sendMsg(`Flashlight's prefix for this guild is \`${await client.prefixes.get(message.guild.id) || config.discord.prefix}\``);
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

        if (command.hasArgs && (!args.size && !strArgs.length)) {
            const helpCmd = client.commands.get('help');
            return helpCmd?.execute(client, args, [command.name], message, sendMsg);
        }

        try {
            command.execute(client, args, strArgs, message, sendMsg);
        } catch (e: any) {
            Logger.error(e.message);
            return sendMsg("An unknown error has occurred. Please try again.");
        }
    }
}
