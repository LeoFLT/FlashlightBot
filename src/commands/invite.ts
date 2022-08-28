import { Flashlight } from "../classes/Flashlight";
import { AttachmentBuilder, EmbedBuilder } from "discord.js";

export const command: Flashlight.Command = {
    data: {
        name: "invite",
        description: "returns an invite to add Flashlight to other guilds"
    },
    execute(client, _, sendInteraction: Function) {
        const botImageEmbed = new AttachmentBuilder("./assets/flashlight.png");
        const messageToSend = new EmbedBuilder()
            .setColor("#b6268c")
            .setTitle("Yet another match costs bot")
            .setAuthor({ name: "Flashlight", iconURL: client?.user?.displayAvatarURL(), url: "https://flashlight.leoflt.com" })
            .setThumbnail("attachment://flashlight.png")
            .setDescription("Use [this link](https://flashlight.leoflt.com) to invite the bot to your server.")
        return sendInteraction({ embeds: [messageToSend], files: [botImageEmbed] });
    }
};