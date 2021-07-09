const { Match } = require('../classes.js');
const { queryMatch, mcEmbed } = require('../functions.js');
const { round } = require('mathjs');

module.exports = {
    name: 'match_costs',
    description: "Calculate the costs for a given match (D I O's formula)",
    aliases: ['mc', 'match_cost'],
    usage: '```\n' +
        `<${process.env.PREFIX}mc | ${process.env.PREFIX}match_cost | ${process.env.PREFIX}match_costs> <url | match ID> <ignore maps from the start>¹ <ignore maps from the end>¹ <mod abbreviation>:² <mod multiplier>²\n`
        + '¹: optional\n'
        + '²: optional (must be used together)\n'
        + '```'
        + `Example: ${process.env.PREFIX}mc https://osu.ppy.sh/community/matches/12345678 2 1 EZ: 0.1\n`
        + 'Ignores the first two **and** the last map, multiplies scores that include EZ as a mod by 0.1',
    args: true,
    async execute(message, args) {
        // a matchId should have at least 5 digits but probably not more than 12
        const regExpMp = /(?:https:\/\/osu\/\.ppy\/\.sh\/)(?:mp|community\/matches)\/\d{5,12}?|(\d{5,12})(?:\/|)? ?(\d{0,2})? ?(\d{0,2})? ?(\w{2}(?: |:))? ?(\d{0,2}\.?\d{0,5})?/i;
        const test = args.join(' ').trim().match(regExpMp);

        // invalid matchId, ignore
        if (!test) return message.channel.send('Invalid MP link.');
        const matchId = test[1];

        // start index to slice maps array
        let warmupStart = 0;
        if (test[2]) warmupStart = parseInt(test[2]);

        // end index to slice maps array (negative)
        let warmupEnd = 0;
        if (test[3]) warmupEnd = -parseInt(test[3], 10);

        let multiplierChange = [];
        let multiplierChangeArr;
        if (test[4]) multiplierChangeArr = [test[4].trim(), test[5]];
        if (multiplierChangeArr) {
            if (multiplierChangeArr.length !== 2) return message.channel.send('Invalid mod combination');
            try {
            let mult = parseFloat(multiplierChangeArr[1]);
            multiplierChange.push({ mod: multiplierChangeArr[0], value: mult });
            if (!mult) return message.channel.send(`Error: \`${multiplierChangeArr[1]}\` is not a valid number`);
            }
            catch (e) {
            console.log(e);
            return message.channel.send(`Error while trying to parse mods`);
            }
        }

        const result = await queryMatch(matchId);
        const match = new Match(matchId, result);
        message.channel.startTyping();
        match.calcMatchCosts(warmupStart, warmupEnd, multiplierChange).then((r) => {
            // no maps to calculate
            if (!r) {
                message.channel.stopTyping();
                return message.channel.send('Warmup count can\'t be equal or superior to the amount of maps played.');
            }
            // sorting array of objects by descending match cost property
            const playerArr = r.players.players.sort((a, b) => (a.cost < b.cost) ? 1 : ((b.cost < a.cost) ? -1 : 0));
            let playerListRed = [];
            let playerListBlue = [];
            let warmupMessage = '';
            let teamScore1 = r.result.team1;
            let teamScore2 = r.result.team2;
            const warmupCountTest = (w, start) => w === 1 ? 'Ignoring the ' + (start ? 'first' : 'last') + ' map\n' : w === 2 ?
                'Ignoring the ' + (start ? 'first' : 'last') + ' two maps\n' : 'Ignoring the ' + (start ? 'first ' : 'last ') + w + ' maps\n';

            if (warmupStart && !warmupEnd) warmupMessage += warmupCountTest(warmupStart, true) + '\n';
            else if (!warmupStart && warmupEnd) warmupMessage += warmupCountTest(-warmupEnd, false) + '\n';
            else if (warmupStart && warmupEnd) warmupMessage += warmupCountTest(warmupStart, true) + warmupCountTest(-warmupEnd, false) + '\n';


            // concatenate the player costs
            if (match.team_type === '0') {
                if (r.is1v1) {
                    playerListRed.push(`[${playerArr[0].username}](https://osu.ppy.sh/users/${playerArr[0].userId})\t•\t\`${playerArr[0].cost.toFixed(4)}\``);
                    playerListBlue.push(`[${playerArr[1].username}](https://osu.ppy.sh/users/${playerArr[1].userId})\t•\t\`${playerArr[1].cost.toFixed(4)}\``);
                } else {
                    let isOdd = (playerArr.length % 2 !== 0);
                    let playerList = [];
                    let inc = 1;
                    for (const player of playerArr) {
                        if (player.cost === 0) continue;
                        const rank = `**\`${inc++}\`**`;
                        const cost = `\`${player.cost.toFixed(4)}\``;
                        playerList.push(`${rank}\t${cost}\t•\t[${player.username}](https://osu.ppy.sh/users/${player.userId})`);
                    }
                    const half = Math.ceil(playerArr.length / 2);
                    playerListRed = playerList.slice(0, half);
                    playerListBlue = playerList.slice(half);
                }
            } else if (match.team_type === '2') {
                // sort players into teams
                let indexRed = 1;
                let indexBlue = 1;
                for (let [index, player] of playerArr.entries()) {
                    index++;
                    if (player.team === '2') {
                        playerListRed.push(`\`${indexRed}\`\t\`${player.cost.toFixed(4)}\`\t•\t[${player.username}](https://osu.ppy.sh/users/${player.userId})\t\`(#${index})\``);
                        indexRed++;
                    }
                    else if (player.team === '1') {
                        playerListBlue.push(`\`${indexBlue}\`\t\`${player.cost.toFixed(4)}\`\t•\t[${player.username}](https://osu.ppy.sh/users/${player.userId})\t\`(#${index})\``);
                        indexBlue++;
                    }
                }
            }
            // create and send the embed for team mode
            message.channel.stopTyping();
            const embedTeam = mcEmbed(playerListRed, playerListBlue, teamScore1, teamScore2, matchId, r.lobbyName, match.start_time, warmupMessage, match.team_type, r.is1v1, r.teamOrderOneVsOne, match.gameMode);
            return message.channel.send(embedTeam);
        });
    }
};