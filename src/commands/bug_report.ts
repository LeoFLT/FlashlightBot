import { Flashlight } from "../classes/Flashlight";
import {
    ActionRowBuilder, MessageComponentInteraction,
    ModalActionRowComponentBuilder, ModalBuilder,
    TextInputBuilder, TextInputStyle
} from "discord.js";

export const command: Flashlight.Command = {
    data: {
        name: "bug_report",
        description: "Submit bug reports"
    },
    execute(_, interaction: MessageComponentInteraction, __) {
        const modal = new ModalBuilder()
            .setCustomId("bug-report")
            .setTitle("Bug Report");

        const formInput = new TextInputBuilder()
            .setCustomId("bug-report-form-input")
            .setLabel("Describe the issue")
            .setPlaceholder("Please try to be as detailed as possible. You may reference the screenshots by using $1, $2, etc.")
            .setStyle(TextInputStyle.Paragraph);

        const screenshotLinkInput = new TextInputBuilder()
            .setCustomId("bug-report-screenshot-input")
            .setLabel("Add screenshot links (optional)")
            .setPlaceholder("Separate multiple links with a comma")
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        const firstActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>()
            .addComponents(formInput);

        const secondActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>()
            .addComponents(screenshotLinkInput);


        modal.addComponents(firstActionRow, secondActionRow);

        return interaction.showModal(modal);
    }
};