import Logger from "../utils/logger";
import { Flashlight } from "../classes/Flashlight";
import { round } from "../utils/math"
import createMCEmbed from "../utils/createMCEmbed";
import { Mod, Team, TeamType, User } from "../definitions/Match";
import { Message as DiscordMessage, MessageEmbed, MessagePayload, ReplyMessageOptions, Permissions } from "discord.js";
const bitFieldReply = new Permissions([Permissions.FLAGS.READ_MESSAGE_HISTORY]);

export const command: Flashlight.Command = {
    name: "match_costs",
    description: "Calculate match costs for a match",
    aliases: ["mc", "matchcosts", "match_cost", "matchcost"],
    usage:
        "`[<remove from start> [remove from end]]` (`-` | `--`)(`i` | `ignore`)=`[<maps>,[to],[ignore]]` (`-` | `--`)`[nm | nf | ez | hd | hr | (dt | nc) | ht | fl | sd | rx | so | pf]`=`<number>`\n\n"
        + "`[option/parameter]`: optional\n"
        + "`<parameter>`: required\n" 
        + "`[<parameter>, [parameter]]`: optional, at least one parameter is required\n"
        + "(`o` | `option`): one of `o` or `option`\n"
        + "all options to this command are case-insensitive"
        + "(`i` | `ignore`): ignore games using a beatmap id or position relative to the first map of the match",
    example: "1 2 -i=3,4 --dt=0.83 -HD=0.94 --HR=0.91 -rx=0",
    hasArgs: true,
    async execute(client, args, _, message: DiscordMessage, sendMsg: Function) {
        if (!args)
            return message.reply("No arguments provided");
        const matchRegex = message
            .content
            .match(/(?<id>(?:https?:\/\/osu\.ppy\.sh\/(?:community\/matches|mp)\/)?\d+(?:\/?))(?:\s(?<startIndex>\d+)(?:\s(?<endIndex>\d+))?)?/)
            ?.groups;

        if (!matchRegex?.id)
            return message.reply("Invalid MP link format");

        let options: Record<string, any> = { mapIndex: {}, multipliers: {} };

        if (args?.i || args?.ignore) {
            if (Array.isArray(args?.i))
                options.mapIndex.midIndex = args.i;
            else if (Array.isArray(args?.ignore))
                options.mapIndex.midIndex = args.ignore;
            else if (typeof args?.i === "number")
                options.mapIndex.midIndex = [args.i];
            else if (typeof args?.ignore === "number")
                options.mapIndex.midIndex = [args.ignore];
        }

        if (typeof matchRegex?.startIndex === "string") {
            options.mapIndex.startIndex = parseInt(matchRegex.startIndex) || 0;

            if (matchRegex?.endIndex)
                options.mapIndex.endIndex = parseInt(matchRegex.endIndex) || 0;
        }

        for (const arg in args)
            if (Object.keys(Mod).includes(arg.toUpperCase()))
                if (typeof args[arg] === "number")
                    options.multipliers[arg.toUpperCase()] = args[arg];

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
                        return sendMsg({ embeds: [new MessageEmbed().setColor("DARK_RED").setDescription("Error: Unable to find a lobby that matches this ID")] });
                    case Flashlight.MatchCosts.Error.InvalidMapSliceIndexStart:
                        return sendMsg({ embeds: [new MessageEmbed().setColor("DARK_RED").setDescription(`Error: you are trying to remove more maps than were played in the lobby (trying to remove **${err.details.index}** maps from the start of a lobby lobby with **${err.details.gameLength}** games)`)] });
                    case Flashlight.MatchCosts.Error.InvalidMapSliceIndexMid:
                        return sendMsg({ embeds: [new MessageEmbed().setColor("DARK_RED").setDescription(`Error: you are trying to remove more maps than were played in the lobby (trying to remove **${err.details.index}** maps from a lobby with **${err.details.gameLength}** games)`)] });
                    case Flashlight.MatchCosts.Error.InvalidMapSliceIndexEnd:
                        return sendMsg({ embeds: [new MessageEmbed().setColor("DARK_RED").setDescription(`Error: you are trying to remove more maps than were played in the lobby (trying to remove **${err.details.index}** maps from the end of a lobby lobby with **${err.details.gameLength}** games)`)] });
                    case Flashlight.MatchCosts.Error.InvalidMapSliceIndexSum:
                        return sendMsg({ embeds: [new MessageEmbed().setColor("DARK_RED").setDescription(`Error: the amount of maps removed from the calculation must be smaller than the amount of maps that were played (trying to remove **${err.details.index}** maps from a lobby with **${err.details.gameLength}** games)`)] });
                }
            }
            return sendMsg({ embeds: [new MessageEmbed().setColor("DARK_RED").setDescription("An unknown error has occurred. Please try again.")] });
        }

        let playerList: User[] = [];
        res.playerList.forEach(player => player.matchCost > 0 ? playerList.push(player) : undefined);
        playerList.sort((a, b) => b.matchCost - a.matchCost);

        let opts: Record<string, any> = {};
        if (options?.mapIndex)
            opts.warmups = options.mapIndex;

        if (options?.multipliers)
            opts.mods = options.multipliers;

        try {
            switch (res.teamType) {
                case TeamType.HeadToHead: {
                    let finalStrArr: string[] = [];
                    for (const player of playerList) {
                        finalStrArr.push(`\`${player.mapAmount < 10 ? " " : ""}${player.mapAmount} • ${round(player.matchCost, 4)}\` • :flag_${player.country_code.toLowerCase()}: [${player.usernameMdSafe}](https://osu.ppy.sh/u/${player.id})`);
                    }

                    const halfPoint = Math.ceil(finalStrArr.length / 2);
                    const finalStr1 = finalStrArr.splice(0, halfPoint);
                    const finalStr2 = finalStrArr;

                    const embed = createMCEmbed(res, { red: finalStr1, blue: finalStr2 }, opts);

                    return sendMsg(embed);
                }

                case TeamType.TeamVS: {
                    let indexRed = 0, indexBlue = 0, playerListRed: string[] = [], playerListBlue: string[] = [];

                    for (const [i, player] of playerList.entries()) {
                        if (player.team === Team.Red) {
                            indexRed++;
                            playerListRed.push(`\`${player.mapAmount < 10 ? " " : ""}${player.mapAmount} • ${round(player.matchCost, 4)}\` • [${player.usernameMdSafe}](https://osu.ppy.sh/u/${player.id}) \`(#${i + 1})\``);
                        }

                        if (player.team === Team.Blue) {
                            indexBlue++;
                            playerListBlue.push(`\`${player.mapAmount < 10 ? " " : ""}${player.mapAmount} • ${round(player.matchCost, 4)}\` • [${player.usernameMdSafe}](https://osu.ppy.sh/u/${player.id}) \`(#${i + 1})\``);
                        }
                    }

                    const finalStrRed = playerListRed;
                    const finalStrBlue = playerListBlue;

                    const embed = createMCEmbed(res, { red: finalStrRed, blue: finalStrBlue }, opts);

                    return sendMsg(embed);
                }

                case TeamType.OneVS: {
                    let playerRed: string = "", playerBlue: string = "";
                    let firstPlayer = playerList[0].id;

                    for (const [i, player] of playerList.entries()) {
                        if (player.id === firstPlayer)
                            playerRed = `\`${i + 1}.\`\u200B\`${round(player.matchCost, 4)}\` • :flag_${player.country_code.toLowerCase()}: [${player.usernameMdSafe}](https://osu.ppy.sh/users/${player.id})`;
                        else
                            playerBlue = `\`${i + 1}.\`\u200B\`${round(player.matchCost, 4)}\` • :flag_${player.country_code.toLowerCase()}: [${player.usernameMdSafe}](https://osu.ppy.sh/users/${player.id})`;
                    }

                    const embed = createMCEmbed(res, { red: [playerRed], blue: [playerBlue] }, opts);

                    return sendMsg(embed);
                }
            }
        } catch (e: any) {
            Logger.error(e?.stack);
            return sendMsg({ embeds: [new MessageEmbed().setColor("DARK_RED").setDescription("Error: too many players in the lobby to calculate.")] });
        }
    }
}
