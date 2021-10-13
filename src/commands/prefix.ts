import { Flashlight } from "../classes/Flashlight";
import config from "../config/envVars";

export const command: Flashlight.Command = {
    name: "prefix",
    description: "sets the Flashlight prefix for this guild",
    aliases: ["p","flashlight_prefix", "flashlightprefix"],
    usage: "[prefix]",
    example: "!",
    hasArgs: false,
    async execute(client, _, strArgs, message, sendMsg: Function) {
        if (strArgs.length) {
            await client.prefixes.set(message.guild.id, strArgs[0]);
            return sendMsg(`Prefix set to \`${strArgs[0]}\``);
        }

        return sendMsg(`Flashlight's prefix for this guild is \`${await client.prefixes.get(message.guild.id) || config.discord.prefix}\``);
    }
}