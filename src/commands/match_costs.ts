import { Flashlight } from "../classes/Flashlight";
import Logger from "../utils/logger";
import { round } from "../utils/math"
import createMCEmbed from "../utils/createMCEmbed";
import { Mod, Team, TeamType, User } from "../definitions/Match";
import { EmbedBuilder, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction } from "discord.js";

const multiplierArr = [
    {
        "type": 10,
        "name": "ez_multiplier",
        "description": "Add a custom multiplier for the EZ mod"
    },
    {
        "type": 10,
        "name": "hd_multiplier",
        "description": "Add a custom multiplier for the HD mod"
    },
    {
        "type": 10,
        "name": "hr_multiplier",
        "description": "Add a custom multiplier for the HR mod"
    },
    {
        "type": 10,
        "name": "dt_multiplier",
        "description": "Add a custom multiplier for the DT/NC mods"
    },
    {
        "type": 10,
        "name": "ht_multiplier",
        "description": "Add a custom multiplier for the HT mod"
    }
];

export const command: Flashlight.Command = {
    data: {
        "name": "match_costs",
        "description": "Calculate match costs for an osu! multiplayer lobby",
        "options": [
            {
                "type": 3,
                "name": "mp_link",
                "description": "The osu! multiplayer lobby URL",
                "required": true
            },
            {
                "type": 4,
                "name": "remove_maps_from_start",
                "description": "Amount of maps to remove from the calculation, based on the first map played."
            },
            {
                "type": 4,
                "name": "remove_maps_from_end",
                "description": "Amount of maps to remove from the calculation, based on the last map played."
            },
            {
                "type": 3,
                "name": "remove_maps_arbitrary",
                "description": "Remove maps based on their index on the lobby (or beatmap_id). separate multiple maps with commas."
            },
            {
                "type": 5,
                "name": "set_1v1_mode",
                "description": "Force the bot to parse the lobby as a 1v1 match."
            },
            {
                "type": 3,
                "name": "win_condition",
                "description": "Use a specific win condition for the lobby.",
                "choices": [
                    {
                        "name": "Score",
                        "value": "score"
                    },
                    {
                        "name": "Accuracy",
                        "value": "acc"
                    }
                ]
            },
            ...multiplierArr

        ]
    },
    async execute(client, interaction: ChatInputCommandInteraction, sendInteraction: Function) {
        let matchRegex = (interaction.options.get("mp_link")!.value as string)
            .match(/(?<id>(?:https?:\/\/osu\.ppy\.sh\/(?:community\/matches|mp)\/)?\d+(?:\/?)?)?/)
            ?.groups;

        if (!matchRegex?.id)
            return sendInteraction("Invalid MP link format");

        let options: Record<string, any> = { mapIndex: {}, multipliers: {}, winCondition: "score" };

        if (interaction.options.getString("win_condition")) {
            let winCondition = interaction.options.getString("win_condition");

            if (winCondition === "score")
                options.winCondition = Flashlight.MatchCosts.WinCondition.Score;

            if (winCondition === "acc")
                options.winCondition = Flashlight.MatchCosts.WinCondition.Accuracy;
        }
        else {
            options.winCondition = Flashlight.MatchCosts.WinCondition.Score;
        }

        if (interaction.options.getBoolean("set_1v1_mode")) {
            options.oneVS = true;
        }

        if (interaction.options.getInteger("remove_maps_from_start"))
            options.mapIndex.startIndex = interaction.options?.getInteger("remove_maps_from_start");

        if (interaction.options.getInteger("remove_maps_from_end"))
            options.mapIndex.endIndex = interaction.options?.getInteger("remove_maps_from_end");

        if (interaction.options.getString("remove_maps_arbitrary")) {
            let value = interaction.options.getString("remove_maps_arbitrary")!;

            if (value.includes(","))
                options.mapIndex.midIndex = value.split(",").map(el => el.trim() as unknown as number);
            else if (!value.includes(".") && typeof Number(value) === "number")
                options.mapIndex.midIndex = [Number(value)];
        }

        for (const multiplier of multiplierArr) {
            if (interaction.options.getNumber(multiplier.name)) {
                const modName = multiplier.name.slice(0, 2);
                if (Object.keys(Mod).includes(modName.toUpperCase()))
                    options.multipliers[modName.toUpperCase()] = interaction.options.getNumber(multiplier.name);
            }
        }
        let res: Flashlight.MatchCosts.Return;

        try {
            res = await client.fetchMultiplayer(matchRegex.id, options);
        }
        catch (e: any) {
            let err;
            if (e?.isFlashlightError)
                err = e as Flashlight.Err;
            if (err && err?.details) {
                switch (err.message) {
                    case Flashlight.MatchCosts.Error.OsuApiCallFail:
                        return sendInteraction({ embeds: [new EmbedBuilder().setColor(Colors.DarkRed).setDescription("Error: Unable to find a lobby that matches this ID")], ephemeral: true });
                    case Flashlight.MatchCosts.Error.InvalidMapSliceIndexStart:
                        return sendInteraction({ embeds: [new EmbedBuilder().setColor(Colors.DarkRed).setDescription(`Error: you are trying to remove more maps than were played in the lobby (trying to remove **${err.details.index}** maps from the start of a lobby lobby with **${err.details.gameLength}** games)`)], ephemeral: true });
                    case Flashlight.MatchCosts.Error.InvalidMapSliceIndexMid:
                        return sendInteraction({ embeds: [new EmbedBuilder().setColor(Colors.DarkRed).setDescription(`Error: you are trying to remove more maps than were played in the lobby (trying to remove **${err.details.index}** maps from a lobby with **${err.details.gameLength}** games)`)], ephemeral: true });
                    case Flashlight.MatchCosts.Error.InvalidMapSliceIndexEnd:
                        return sendInteraction({ embeds: [new EmbedBuilder().setColor(Colors.DarkRed).setDescription(`Error: you are trying to remove more maps than were played in the lobby (trying to remove **${err.details.index}** maps from the end of a lobby lobby with **${err.details.gameLength}** games)`)], ephemeral: true });
                    case Flashlight.MatchCosts.Error.InvalidMapSliceIndexSum:
                        return sendInteraction({ embeds: [new EmbedBuilder().setColor(Colors.DarkRed).setDescription(`Error: the amount of maps removed from the calculation must be smaller than the amount of maps that were played (trying to remove **${err.details.index}** maps from a lobby with **${err.details.gameLength}** games)`)], ephemeral: true });
                }
            }
            return sendInteraction({ embeds: [new EmbedBuilder().setColor(Colors.DarkRed).setDescription("An unknown error has occurred. Please try again.")], ephemeral: true });
        }

        let playerList: User[] = [];
        res.playerList.forEach(player => player.matchCost > 0 ? playerList.push(player) : undefined);
        playerList.sort((a, b) => b.matchCost - a.matchCost);

        let opts: Record<string, any> = {};
        if (options?.mapIndex)
            opts.warmups = options.mapIndex;

        if (options?.multipliers)
            opts.mods = options.multipliers;

        if (options?.winCondition)
            opts.winCondition = options.winCondition;
        
        try {
            switch (res.teamType) {
                case TeamType.HeadToHead: {
                    let finalStrArr: string[] = [];
                    for (const player of playerList)
                        finalStrArr
                            .push(`\`${player.mapAmount < 10 ? " " : ""}${player.mapAmount} • ${round(player.matchCost, 4)}\` • :flag_${player.country_code.toLowerCase()}: [${player.usernameMdSafe}](https://osu.ppy.sh/u/${player.id})`);

                    const halfPoint = Math.ceil(finalStrArr.length / 2);
                    const finalStr1 = finalStrArr.splice(0, halfPoint);
                    const finalStr2 = finalStrArr;

                    let embed = createMCEmbed(res, { red: finalStr1, blue: finalStr2 }, opts);
                    return sendInteraction(embed);
                }

                case TeamType.TeamVS: {
                    let playerListRed: string[] = [], playerListBlue: string[] = [];

                    for (const [i, player] of playerList.entries()) {
                        if (player.team === Team.Red)
                            playerListRed.push(`\`${player.mapAmount < 10 ? " " : ""}${player.mapAmount} • ${round(player.matchCost, 4)}\` • [${player.usernameMdSafe}](https://osu.ppy.sh/u/${player.id}) \`(#${i + 1})\``);

                        if (player.team === Team.Blue)
                            playerListBlue.push(`\`${player.mapAmount < 10 ? " " : ""}${player.mapAmount} • ${round(player.matchCost, 4)}\` • [${player.usernameMdSafe}](https://osu.ppy.sh/u/${player.id}) \`(#${i + 1})\``);
                    }

                    const finalStrRed = playerListRed;
                    const finalStrBlue = playerListBlue;

                    const embed = createMCEmbed(res, { red: finalStrRed, blue: finalStrBlue }, opts);
                    return sendInteraction(embed);
                }

                case TeamType.OneVS: {
                    let playerRed: string = "", playerBlue: string = "";
                    let firstPlayer = playerList[0]?.id;

                    if (!firstPlayer)
                        throw new Flashlight.Err(Flashlight.MatchCosts.Error.NoPlayersInLobby);

                    for (const [i, player] of playerList.entries()) {
                        if (player.id === firstPlayer)
                            playerRed = `\`${i + 1}.\`\u200B\`${round(player.matchCost, 4)}\` • :flag_${player.country_code.toLowerCase()}: [${player.usernameMdSafe}](https://osu.ppy.sh/users/${player.id})`;
                        else
                            playerBlue = `\`${i + 1}.\`\u200B\`${round(player.matchCost, 4)}\` • :flag_${player.country_code.toLowerCase()}: [${player.usernameMdSafe}](https://osu.ppy.sh/users/${player.id})`;
                    }

                    const embed = createMCEmbed(res, { red: [playerRed], blue: [playerBlue] }, opts);
                    return sendInteraction(embed);
                }
                default:
                    return sendInteraction({ embeds: [new EmbedBuilder().setColor(Colors.DarkRed).setDescription(`Error: no games found for this lobby`)], ephemeral: true });
            }
        } catch (e: any) {
            Logger.error(e?.stack);
            let err;
            if (e?.isFlashlightError)
                err = e as Flashlight.Err;
            if (err && err?.details) {
                switch (err.message) {
                    case Flashlight.MatchCosts.Error.NoPlayersInLobby:
                        return sendInteraction({ embeds: [new EmbedBuilder().setColor(Colors.DarkRed).setDescription("Error: no games found for this lobby")], ephemeral: true });
                    default:
                        return sendInteraction({ embeds: [new EmbedBuilder().setColor(Colors.DarkRed).setDescription("Error: too many players in the lobby to calculate.")], ephemeral: true });
                }
            }
        }
    }
}