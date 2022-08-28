import { Flashlight } from "../classes/Flashlight";
import { AttachmentBuilder, EmbedBuilder } from "discord.js";

export const command: Flashlight.Command = {
    data: {
        name: "formula",
        description: "Returns information about the formula used to calculate \"match_costs\"",
    },
    execute(_, __, sendInteraction: Function) {
        const mcImageEmbed = new AttachmentBuilder("./assets/mc_formula.png");
        const messageToSend = new EmbedBuilder()
        .setColor("#b6268c")
        .setTitle("Match Costs Formula:")
        .setImage("attachment://mc_formula.png")
        .setFooter({ text: "Original formula created by D I O", iconURL: "https://a.ppy.sh/3958619" })
        return sendInteraction({ embeds: [messageToSend], files: [mcImageEmbed] });
    }
};