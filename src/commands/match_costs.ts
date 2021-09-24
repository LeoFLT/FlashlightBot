import { Flashlight } from "../classes/Flashlight";
import { round } from "../utils/math"
import { Mod, Team, TeamType, User } from "../definitions/Match";
import { Message as DiscordMessage } from "discord.js";
import createErrorMessage from "../utils/createErrorMessage";

export const command: Flashlight.Command = {
    name: "match_costs",
    description: "Calculate match costs for a match",
    aliases: ["mc"],
    hasArgs: false,
    async execute(client, args, message: DiscordMessage) {
        if (!args)
            return message.reply("No arguments provided");
        const matchRegex = message
            .content
            .match(/(?<id>(?:https?:\/\/osu\.ppy\.sh\/(?:community\/matches|mp)\/)?\d+(?:\/?))(?:\s(?<startIndex>\d+)(?:\s(?<endIndex>\d+))?)?/)
            ?.groups;

        if (!matchRegex?.id)
            return message.reply("Invalid MP link format");

        let options: Record<string, any> = { mapIndex: {}, multipliers: {}};

        if (args?.im || args?.ignore_middle) {
            if (Array.isArray(args?.im))
                options.mapIndex.midIndex = args.im;
            else if (Array.isArray(args?.ignore_middle))
                options.mapIndex.midIndex = args.ignore_middle;
            else if (typeof args?.im === "number")
                options.mapIndex.midIndeX = [args.im];
            else if (typeof args?.ignore_middle === "number")
                options.mapIndex.midIndex = [args.ignore_middle];
        }

        if (typeof matchRegex?.startIndex === "string") {
            options.mapIndex.startIndex = parseInt(matchRegex.startIndex) || 0;

            if (matchRegex?.endIndex)
               options.mapIndex.endIndex = parseInt(matchRegex.endIndex) || 0;
        }
        else {
            if (args?.i || args?.ignore) {
                if (Array.isArray(args?.i)) {
                    options.mapIndex.startIndex = args.i[0];
                    options.mapIndex.endIndex = args.i[1];
                }
                else if (Array.isArray(args?.ignore)) {
                    options.mapIndex.startIndex = args.ignore[0];
                    options.mapIndex.endIndex = args.ignore[1];
                }
                else if (typeof args?.i === "number" || typeof args?.ignore === "number")
                    options.mapIndex.startIndex = args.i || args?.ignore;
            }
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
            console.log(e.message);
            switch (e.message) {
                case "api-call-fail-not-200":
                    return message.reply("Unable to find a lobby that matches this ID");
                case "invalid-map-index-start":
                    return message.reply("Error: you are trying to remove more maps than were played in the lobby (start index)");
                case "invalid-map-index-mid":
                    return message.reply("Error: you are trying to remove more maps than were played in the lobby (mid index)")
                case "invalid-map-index-end":
                    return message.reply("Error: you are trying to remove more maps than were played in the lobby (end index)");
                case "invalid-map-index-sum":
                    return message.reply("Error: the amount of maps removed from the calculation must be smaller than the amount of maps that were played");
                default:
                    return message.reply("An unknown error has occurred. Please try again.");
            }
        }

        const warmupCountTest = (w: number, start: boolean) => w === 1 ? 'Ignoring the ' + (start ? 'first' : 'last') + ' map\n' : w === 2 ?
        'Ignoring the ' + (start ? 'first' : 'last') + ' two maps\n' : 'Ignoring the ' + (start ? 'first ' : 'last ') + w + ' maps\n';

        let playerList: User[] = [];
        res.playerList.forEach(player => player.matchCost ? playerList.push(player) : undefined);
        playerList.sort((a, b) => b.matchCost - a.matchCost);


        // TODO: implement all cases (use a helper function, maybe?)
        switch (res.teamType) {
            case TeamType.HeadToHead: {
                let finalStrArr: string[] = [];
                for (const [i, player] of playerList.entries())
                    finalStrArr.push(`\`${i + 1 < 10 ? " " : ""}${i + 1}.\`\u200B\`${round(player.matchCost, 4)}\` • [${player.username}](https://osu.ppy.sh/users/${player.id})`);
                
                const halfPoint = Math.ceil(finalStrArr.length / 2);
                let finalStr1 = finalStrArr.slice(0, halfPoint);
                let finalStr2 = finalStrArr.slice(-(halfPoint + finalStrArr.length % 2 === 0 ? 1 : 0));

                return message.reply(finalStr1.join("\n")), message.reply(finalStr2.join("\n"));
            }

            case TeamType.TeamVS: {
                let indexRed = 0, indexBlue = 0, playerListRed: string[] = [], playerListBlue: string[] = []; 
                
                for (const [i, player] of playerList.entries()) {
                    console.log(player.team);
                    if (player.team === Team.Red) {
                        indexRed++;
                        playerListRed.push(`\`${indexRed < 10 ? " " : ""}${indexRed}.\`\u200B\`${round(player.matchCost, 4)}\` • [${player.username}](https://osu.ppy.sh/users/${player.id}) (#${i + 1})`);
                    }

                    if (player.team === Team.Blue) {
                        indexBlue++;
                        playerListBlue.push(`\`${indexBlue < 10 ? " " : ""}${indexBlue}.\`\u200B\`${round(player.matchCost, 4)}\` • [${player.username}](https://osu.ppy.sh/users/${player.id}) (#${i + 1})`);
                    }
                }

                let finalStrRed = playerListRed.join("\n");
                let finalStrBlue = playerListBlue.join("\n");
                return message.reply(finalStrRed), message.reply(finalStrBlue);
            }

            case TeamType.OneVS: {
                let playerListRed: string[] = [], playerListBlue: string[] = []; 
                
                for (const [i, player] of playerList.entries()) {
                    if (player.team === Team.Red) 
                        playerListRed.push(`\`${i + 1}.\`\u200B\`${round(player.matchCost, 4)}\` • [${player.username}](https://osu.ppy.sh/users/${player.id})`);

                    if (player.team === Team.Blue)
                        playerListBlue.push(`\`${i + 1}.\`\u200B\`${round(player.matchCost, 4)}\` • [${player.username}](https://osu.ppy.sh/users/${player.id})`);
                
                }
            }
        }
    }
}
