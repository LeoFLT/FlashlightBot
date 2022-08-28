import Logger from "../utils/logger";
import { Flashlight } from "../classes/Flashlight";
import { MessagePayload, InteractionReplyOptions, Interaction } from "discord.js";

export const event: Flashlight.Event = {
    name: "interactionCreate",
    once: false,
    async execute(client, interaction) {
        if (!interaction.isCommand())
            return;

        const sendInteraction = ((opts: string | MessagePayload | InteractionReplyOptions) => {
            return interaction.reply(opts);
        });

        const command = client.commands.get(interaction.commandName);

        if (!command)
            return;

        try {
            command.execute(client, interaction, sendInteraction);
        } catch (e: any) {
            Logger.error(e);
            return sendInteraction({ content: "An unknown error has occurred. Please try again.", ephemeral: true });
        }
    }
}
