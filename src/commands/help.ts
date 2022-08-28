import { Flashlight } from "../classes/Flashlight";
import { EmbedField, EmbedBuilder } from "discord.js";

export const command: Flashlight.Command = {
    data: {
        name: "help",
        description: "returns information about a command",
        options: [
            {
                required: false,
                type: 3,
                name: "command_name",
                description: "Specific command you need help for. Leave empty to show all commands available"
            }
        ]
    },
    async execute(client, interaction, sendMsg: Function) {
        const messageToSend = new EmbedBuilder().setColor("#b6268c");

        const commandToLookup = interaction.options.getString("command_name");

        if (!commandToLookup) {
            let embedFields: EmbedField[] = [];
            let i = 0;
            client.commands.forEach((cmd) => {
                embedFields.push({
                    name: cmd.data.name,
                    value: cmd.data.description,
                    inline: i++ % 3 === 0,
                });
            });
            embedFields.sort((a, b) => a.name.localeCompare(b.name));
            messageToSend.setTitle("**Command list**")
                .setDescription("Use /help `command_name` to get detailed information about a certain command.")
                .addFields(...embedFields);

            return sendMsg({ embeds: [messageToSend], ephemeral: true });
        }

        const command = client.commands.get(commandToLookup)

        if (!command) {
            return sendMsg({ content: `\`${commandToLookup}\` is not a valid command.`, ephemeral: true });
        }
        messageToSend.addFields({ name: "**Name**", value: command.data.name, inline: true });

        if (command.data.description)
            messageToSend.addFields({ name: "**Description**", value: command.data.description, inline: false });

        return sendMsg({ embeds: [messageToSend], ephemeral: true });
    },
}
