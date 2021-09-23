import { Flashlight } from "../classes/Flashlight";
import { Message as DiscordMessage } from "discord.js";

export const command: Flashlight.Command = {
    name: "match_costs",
    description: "Calculate match costs for a match",
    aliases: ["mc"],
    hasArgs: false,
    execute(_client, _args, message: DiscordMessage) {
        message.reply(`This response took **${Math.abs((Date.now() - message.createdAt.getTime()) / 1000).toString(10)}ms**`);
    }
}
