import { Flashlight } from "../classes/Flashlight";
import { AttachmentBuilder, EmbedBuilder } from "discord.js";

export const command: Flashlight.Command = {
    data: {
        name: "info",
        description: "Returns general information about the bot"
    },
    execute(client, _, sendInteraction: Function) {
        const botImageEmbed = new AttachmentBuilder("./assets/flashlight.png");
        const messageToSend = new EmbedBuilder()
            .setColor("#b6268c")
            .setTitle("Yet another match costs bot")
            .setAuthor({ name: "Flashlight", iconURL: client?.user?.displayAvatarURL(), url: "https://flashlight.leoflt.com" })
            .setDescription(`Flashlight is the result of [LeoFLT](https://osu.ppy.sh/users/3668779) losing ~~one~~ several nights of sleep to code [D I O](https://osu.ppy.sh/users/3958619)'s match cost [formula](https://media.discordapp.net/attachments/811643995755249664/855984680045248532/mc_formula.png).`)
            .setThumbnail("attachment://flashlight.png")
            .setFooter({ text: "Created by LeoFLT", iconURL: "https://cdn.discordapp.com/avatars/146685063914848256/520c7de67563acb00649fd7957f2094c.png" });
        return sendInteraction({ embeds: [messageToSend], files: [botImageEmbed] });
    }
};