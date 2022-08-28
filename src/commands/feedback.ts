import { Flashlight } from "../classes/Flashlight";
import {
    ActionRowBuilder, MessageComponentInteraction,
    ModalActionRowComponentBuilder, ModalBuilder,
    TextInputBuilder, TextInputStyle
} from "discord.js";

export const command: Flashlight.Command = {
    data: {
        name: "feedback",
        description: "Submit feedback or suggestions to the creator"
    },
    execute(_, interaction: MessageComponentInteraction, __) {
        const modal = new ModalBuilder()
            .setCustomId("feedback")
            .setTitle("Feedback");

        const formInput = new TextInputBuilder()
            .setCustomId("feedback-form-input")
            .setLabel("Submit feedback/feature requests")
            .setStyle(TextInputStyle.Paragraph);

        const actionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>()
            .addComponents(formInput);

        modal.addComponents(actionRow);

        return interaction.showModal(modal);
    }
};