import { EmbedField, MessageEmbed } from "discord.js";
import { Flashlight } from "../classes/Flashlight";
import config from "../config/envVars";

export const command: Flashlight.Command = {
    name: "help",
    aliases: ["c", "h", "commands", "command"],
    description: "returns information about a command",
    usage:
        "[command name]¹\n"
        + "¹: optional, defaults to showing all commands\n",
    example: "help",
    hasArgs: false,
    isHelp: true,
    async execute(client, _, args, message, sendMsg: Function) {
        const messageToSend = new MessageEmbed().setColor("#b6268c");
        const prefix = await client.prefixes.get(message?.guild?.id) || config.discord.prefix;
        let largestLen = 0;

        client.commands.forEach((cmd) => (cmd.name.length > largestLen ? largestLen = cmd.name.length : undefined));
        if (!args.length) {
            let embedFields: EmbedField[] = [];
            let i = 0;
            client.commands.forEach((cmd) => {
                embedFields.push({
                    name: cmd.name,
                    value: cmd.description,
                    inline: i++ % 3 === 0,
                });
            });
            embedFields.sort((a, b) => a.name.localeCompare(b.name));
            messageToSend.setTitle("**Command list**")
                .setDescription(`Use ${prefix}help command_name to get detailed information about a certain command.`);
            messageToSend.addFields(...embedFields);
             
            return sendMsg({ embeds: [messageToSend] });
        }
        const name = args[0].toLowerCase();
        const command = client.commands.get(name)
            || client.commands.find((c) => c.aliases && c.aliases.includes(name));

        if (!command) {
            return sendMsg(`\`${name}\` is not a valid command/alias.`);
        }
        messageToSend.addField("**Name**", command.name, true);

        if (command.aliases.length > 0)
            messageToSend.addField("**Aliases**", command.aliases.join(", "), true);
        
        if (command.description)
            messageToSend.addField("**Description**", command.description, false);
        
        if (command.usage)
            messageToSend.addField("**Usage**", `${prefix}${command.name} ${command.usage}`, false);
        
        if (command.example)
            messageToSend.addField("**Example**", `${prefix}${command.name} ${command.example}`, false);
        
        return sendMsg({ embeds: [messageToSend] });
    },
};
