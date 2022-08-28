import { Flashlight } from "../classes/Flashlight";
import { EmbedBuilder } from "discord.js";

export const command: Flashlight.Command = {
    data: {
        name: "privacy_policy",
        description: "Information about the privacy policy and the data the bot might retain"
    },
    execute(_, __, sendInteraction: Function) {
        const messageToSend = new EmbedBuilder()
            .setColor("#b6268c")
            .setTitle("Flashlight's privacy policy")
            .setDescription("**• Information you provide**\nFlashlight collects information from you when you voluntarily use message content to signal that you want the data to be parsed. The information it collects is strictly the message contents, no user information (such as your Discord tag, avatar or nickname) is collected.\n\n**• Where information is processed**\nFlashlight processes data it collects in the United States. No matter where in the world you reside, you consent to the processing and transferring of such information in and to the U.S. and other countries. The laws of the U.S. that govern data collection and use may be different to the laws of the country you live in.\n\n**• Our use of your data**\nFlashlight uses the data you provide it **ONLY** to process your request and return you information in a more digestible manner.\n\n**• Data retention**\nFlashlight's use of your data is limited to the time it takes to process your request: after your request is processed, it discards the information provided. Flashlight does not store any user data.")
        return sendInteraction({ embeds: [messageToSend] });
    }
};