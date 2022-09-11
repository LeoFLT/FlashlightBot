import { Flashlight } from "../classes/Flashlight";
import { Team, TeamType, GameMode } from "../definitions/Match";
import { MessageOptions, EmbedBuilder, EmbedField } from "discord.js";

function embedFieldsFromArr(arr: string[]): EmbedField[] {
    let newArrRightHalf = [...arr];
    let newArrLeftHalf = newArrRightHalf.splice(0, Math.ceil(arr.length / 2));
    let finalArrOps = [newArrLeftHalf, newArrRightHalf];
    let finalEmbed: EmbedField[] = [];

    for (const [index, arr] of finalArrOps.entries()) {
        if (index === 0)
            finalEmbed.push({ name: "**Player List**", value: arr.join("\n"), inline: true})
        else
            finalEmbed.push({ name: "\u200B", value: arr.join("\n"), inline: true });
    }
    return finalEmbed;
}

export function discordTimestamp(dateObj: Date, format?: string) {
    return `<t:${Math.floor(dateObj ? dateObj.getTime() / 1000 : Date.now() / 1000)}:${format ? format : "R"}>`;
}

export default function (lobby: Flashlight.MatchCosts.Return, playerList: { blue: string[], red: string[] }, options?: {
    mention?: boolean, warmups?: Flashlight.MatchCosts.mapIndex, mods?: Flashlight.MatchCosts.Mods[], winCondition?: Flashlight.MatchCosts.WinCondition
}): MessageOptions {
    let embed = new EmbedBuilder()
        .setColor("#b6268c");
    let gameModeImg;

    switch (lobby.gameMode) {
        case GameMode.Osu:
            gameModeImg = 'https://i.imgur.com/fnRPSk2.png';
            break;
        case GameMode.Taiko:
            gameModeImg = 'https://i.imgur.com/LMaVI8A.png';
            break;
        case GameMode.Catch:
            gameModeImg = 'https://i.imgur.com/kftQ0tR.png';
            break;
        case GameMode.Mania:
            gameModeImg = 'https://i.imgur.com/YHi4Mer.png';
            break;
        default:
            gameModeImg = 'https://i.imgur.com/t6zXMlG.png';
    }
    embed.setAuthor({ name: lobby.lobbyInfo.name, iconURL: gameModeImg, url: `https://osu.ppy.sh/community/matches/${lobby.lobbyInfo.id}` });

    let isTie = (lobby.teamScores?.red as number) === (lobby.teamScores?.blue as number);
    let redIsWinner = isTie ? false : (lobby.teamScores?.red as number) > (lobby.teamScores?.blue as number);
    let redFinalArr = [...playerList.red];
    let blueFinalArr = [...playerList.blue];

    if (lobby.teamType === TeamType.OneVS) {
        let firstPlayer, secondPlayer;
        for (const [_, player] of lobby.playerList.entries()) {
            if (player.team === Team.Red)
                firstPlayer = player;
            else
                secondPlayer = player;
        }
        embed.addFields({
            name: "Final Score",
            value: isTie ?
                `${firstPlayer?.username}: \`${lobby.teamScores?.red}\`\n${secondPlayer?.username}: \`${lobby.teamScores?.blue}\``
                : redIsWinner ?
                    `**${firstPlayer?.username}: \`${lobby.teamScores?.red}\`**\n${secondPlayer?.username}: **\`${lobby.teamScores?.blue}\`**`
                    : `${firstPlayer?.username}: \`${lobby.teamScores?.red}\`\n**${secondPlayer?.username}: \`${lobby.teamScores?.blue}\`**`
        })
    }

    if (lobby.teamType === TeamType.TeamVS) {
        embed.addFields({
            name: "Final Score",
            value: isTie ?
                `**:small_red_triangle: Red Team:** \u200B \u200B\`${lobby.teamScores?.red}\`\n**:small_blue_diamond: Blue Team:** \`${lobby.teamScores?.blue}\``
                : redIsWinner ?
                    `**:small_red_triangle: __Red Team:__** \u200B \u200B\`${lobby.teamScores?.red}\`\n**:small_blue_diamond: Blue Team:** \`${lobby.teamScores?.blue}\``
                    : `**:small_blue_diamond: __Blue Team:__** \`${lobby.teamScores?.blue}\`\n**:small_red_triangle: Red Team:** \u200B \u200B\`${lobby.teamScores?.red}\``
        })
    }

    if (lobby.teamType === TeamType.HeadToHead) {
        const finalArr = [...redFinalArr, ...blueFinalArr];
        embed.addFields(embedFieldsFromArr(finalArr));
    }
    else if (lobby.teamType === TeamType.OneVS || lobby.teamType === TeamType.TeamVS) {
        const embedHeaderRed = lobby.teamType === TeamType.TeamVS ? `:small_red_triangle: **Red Team** (${playerList.red.length})` : "\u200B";
        const embedHeaderBlue = lobby.teamType === TeamType.TeamVS ? `:small_blue_diamond: **Blue Team** (${playerList.blue.length})` : "\u200B";
        let embedIsTooBig = false;
        let embedRedSplit: string[] = [], embedBlueSplit: string[] = [];
        for (const team in playerList) {
            if (team === "blue" || team === "red") {
                if (playerList[team].join("\n").length > 1024) {
                    embedIsTooBig = true;
                    let newHalf = playerList[team].splice(0, Math.ceil(playerList[team].length / 2));
                    if (team === "red")
                        embedRedSplit = newHalf;
                    else
                        embedBlueSplit = newHalf;
                }
            }
        }
        if (embedIsTooBig) {
            embed.addFields(
                { name: embedHeaderRed, value: playerList.red.join("\n"), inline: true },
                { name: "\u200B", value: "\u200B", inline: true },
                { name: embedHeaderBlue, value: playerList.blue.join("\n"), inline: true },
                { name: "\u200B", value: embedRedSplit.join("\n"), inline: true },
                { name: "\u200B", value: "\u200B", inline: true },
                { name: "\u200B", value: embedBlueSplit.join("\n"), inline: true }
            )
        } else {
            embed.addFields(
                { name: embedHeaderRed, value: playerList.red.join("\n") || "\u200B", inline: true },
                { name: "\u200B", value: "\u200B", inline: true },
                { name: embedHeaderBlue, value: playerList.blue.join("\n") || "\u200B", inline: true }
            )
        }
    }

    embed.addFields({
        name: "\u200B",
        value: "Played " + discordTimestamp(lobby.lobbyInfo.start_time) + " • " + discordTimestamp(lobby.lobbyInfo.start_time, "D"),
        inline: false
    });
    let messageToSend = { content: `Lobby link: <https://osu.ppy.sh/community/matches/${lobby.lobbyInfo.id}>`, embeds: [embed], allowedMentions: { repliedUser: options?.mention ? true : false } };

    if (options?.winCondition && options.winCondition === Flashlight.MatchCosts.WinCondition.Accuracy) {
        messageToSend.embeds.push(
            new EmbedBuilder()
                .setDescription("Using Accuracy as the win condition")
        )
    }

    if (options?.warmups) {
        let start = options?.warmups?.startIndex;
        let middle = options?.warmups?.midIndex?.join(", ")
        let end = options?.warmups?.endIndex;

        if (start || (middle && middle.length > 0) || end) {
            messageToSend.embeds.push(
                new EmbedBuilder()
                    .setDescription("**Ignoring**\n" + (start ? `**${start}** ${start > 1 ? "maps" : "map"} from the start\n` : "")
                        + (end ? `**${end}** ${end > 1 ? "maps" : "map"} from the end\n` : "")
                        + (middle ? `${options?.warmups?.midIndex && options.warmups.midIndex.length > 1 ? "games" : "game"} **${middle}** from the calculations` : "")
                    )
            );
        }
    }

    if (options?.mods) {
        let finalStr = "**Multipliers**\n";
        let modsArr = [];
        for (const mod in options.mods)
            modsArr.push(`**${mod}**: ${options.mods[mod]}x`);
        if (modsArr.length > 0) {
            messageToSend.embeds.push(
                new EmbedBuilder()
                    .setDescription(finalStr + modsArr.join(" | "))
            )
        }
    }

    return messageToSend;
}