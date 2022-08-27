import { MessageAttachment, MessageEmbed } from "discord.js";
import { Flashlight } from "../classes/Flashlight";

export const command: Flashlight.Command = {
    name: "invite",
    description: "returns an invite to add Flashlight to other guilds",
    hasArgs: false,
    aliases: ["inv"],
    execute(client, _, __, message, sendMsg: Function) {
        const botImageEmbed = new MessageAttachment("./assets/flashlight.png");
        const messageToSend = new MessageEmbed()
            .setColor("#b6268c")
            .setTitle("Yet another match costs bot")
            .setAuthor("Flashlight", client?.user?.displayAvatarURL(), "https://flashlight.leoflt.com")
            .setThumbnail("attachment://flashlight.png")
            .setDescription("Use [this link](https://flashlight.leoflt.com) to invite the bot to your server.")
        return sendMsg({ embeds: [messageToSend], files: [botImageEmbed] });
    }
};