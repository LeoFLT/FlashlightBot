import { Collection, ColorResolvable, Colors, EmbedBuilder, ModalSubmitInteraction } from "discord.js";
import { Flashlight } from "../classes/Flashlight";
import config from "../config/envVars";

const EmbedColors = new Collection<string, ColorResolvable>()
    .set("feedback", Colors.DarkAqua).set("bug-report", Colors.DarkOrange);

export default async function modalHandler(client: Flashlight.Client, interaction: ModalSubmitInteraction,) {
    let formRes: ModalSubmitInteraction = interaction;
    let formData: string;
    let screenshotData: (URL | undefined)[] = [];

    if (interaction.customId === "feedback") {
        formData = formRes.fields.getTextInputValue("feedback-form-input");
        await interaction?.reply({ content: "Your feedback was received sucessfully.", ephemeral: true });
    }

    if (interaction.customId === "bug-report") {
        formData = formRes.fields.getTextInputValue("bug-report-form-input");
        if (formRes.fields.getTextInputValue("bug-report-screenshot-input")) {
            screenshotData = formRes.fields
                .getTextInputValue("bug-report-screenshot-input")
                .split(",")
                .map(function (el) {
                    try {
                        return new URL(el.trim());
                    } catch (_) {
                        return undefined;
                    }
                }).filter(url => !!url && (url.protocol === "http:" || url.protocol === "https:"));
        }
        await interaction?.reply({ content: "Your bug report was received sucessfully.", ephemeral: true });
    }

    if (!formData!)
        return;

    const userToSendForm = client.users.cache.get(config.discord.owner as string);
    let embedForm = new EmbedBuilder().setColor(EmbedColors.get(interaction.customId)!);

    if (formData!.length < 1024) {
        embedForm.addFields({
            name: `New ${interaction.customId.replaceAll("-", " ")}`,
            value: formData, inline: false
        });
    } else {
        embedForm.addFields({
            name: `New ${interaction.customId.replaceAll("-", " ")}`,
            value: `${formData.slice(0, 1021)}...`, inline: false
        });
        formData = formData.slice(1021);
        do {
            embedForm.addFields({
                name: "\u200B",
                value: `...${formData.slice(0, 1021)}`, inline: false
            });
            formData = formData.slice(1021);
        } while (formData.length > 1024);
    }

    embedForm
        .setFooter({
            text: `Sent by ${formRes.user.tag}`,
            iconURL: formRes.user.displayAvatarURL()
        })
        .setTimestamp(formRes.createdTimestamp)
        .setColor(EmbedColors.get(interaction.customId)!)

    let finalEmbedArr = [embedForm];

    if (screenshotData.length > 0) {
        let embedDataArr: EmbedBuilder[] = [];
        let screenshotDataTrim: (URL | undefined)[] = [];
        let screenshotDataExcess: (URL | undefined)[] = [];

        if (screenshotData.length > 0 && screenshotData.length <= 4) {
            screenshotDataTrim = screenshotData;
        }
        
        // excess screenshots are offloaded to an additional embed as hyperlinks
        if (screenshotData.length > 4) {
            screenshotDataTrim = screenshotData.slice(0, 3);
            screenshotDataExcess = screenshotData.slice(4);
        }

        // create embeds for screenshot display
        for (const screenshot of screenshotDataTrim) {
            embedDataArr.push(
                new EmbedBuilder()
                    .setURL("https://flashlight.leoflt.com")
                    .setImage((screenshot as URL).toString())
                    .setColor(EmbedColors.get(interaction.customId)!)
            );
        }

        // push excess screenshots to an additional embed
        if (screenshotDataExcess.length > 0) {
            embedDataArr.push(
                new EmbedBuilder()
                    .addFields({
                        name: "all screenshots (truncated due to screenshot limit)",
                        value: screenshotDataExcess
                            .map((url, i) => `[screenshot ${i + 1}](${url?.toString()})`).join("\n"),
                        inline: false
                    })
                    .setColor(EmbedColors.get(interaction.customId)!)
            );
        }
        finalEmbedArr.push(...embedDataArr);
    }

    if (userToSendForm)
        return userToSendForm.send({ embeds: finalEmbedArr });
};