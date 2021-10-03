import { Flashlight } from "../classes/Flashlight";
import { MessageAttachment, MessageEmbed } from "discord.js";

export const command: Flashlight.Command = {
    name: "info",
    description: "General information about the bot",
    aliases: ["i", "information"],
    hasArgs: false,
    execute(client, _, __, message) {
        const botImageEmbed = new MessageAttachment("./assets/flashlight.png");
        const messageToSend = new MessageEmbed()
            .setColor("#b6268c")
            .setTitle("Yet another match costs bot")
            .setAuthor("Flashlight", client?.user?.displayAvatarURL(), "https://flashlight.leoflt.com")
            .setDescription(`Flashlight is the result of [LeoFLT](https://osu.ppy.sh/users/3668779) losing a night of sleep to code [D I O](https://osu.ppy.sh/users/3958619)'s match cost [formula](https://media.discordapp.net/attachments/811643995755249664/855984680045248532/mc_formula.png).`)
            .setThumbnail("attachment://flashlight.png")
            .setFooter("Created by LeoFLT", "https://cdn.discordapp.com/avatars/146685063914848256/520c7de67563acb00649fd7957f2094c.png");
        return message.channel.send({ embeds: [messageToSend], files: [botImageEmbed] });
    }
};