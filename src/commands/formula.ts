import { Flashlight } from "../classes/Flashlight";
import { MessageAttachment, MessageEmbed } from "discord.js";

export const command: Flashlight.Command = {
    name: "formula",
    description: "Information about the formula used to calculate `match_costs`",
    aliases: ["f"],
    hasArgs: false,
    execute(clients, _, __, message) {
        const mcImageEmbed = new MessageAttachment("./assets/mc_formula.png");
        const messageToSend = new MessageEmbed()
        .setColor("#b6268c")
        .setTitle("Match Costs Formula:")
        .setImage("attachment://mc_formula.png")
        .setFooter("Original formula created by D I O", "https://a.ppy.sh/3958619")
        return message.channel.send( { embeds: [messageToSend], files: [mcImageEmbed] });
    }
};