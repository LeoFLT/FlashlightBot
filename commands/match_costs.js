const { Match } = require('../classes.js');
const { queryMatch, mcEmbed } = require('../functions.js');
const { round } = require('mathjs');

module.exports = {
    name: 'match_cost',
    description: "Calculate the costs for a given match, using D I O's formula.",
    aliases: ['mc', 'match_costs'],
    usage: '```\n' +
        `<${process.env.PREFIX}mc | ${process.env.PREFIX}match_cost | ${process.env.PREFIX}match_costs> <url | match ID> <ignore maps from the start>* <ignore maps from the end>*\n` +
        '* = optional```\n' +
        `Example: ${process.env.PREFIX}mc https://osu.ppy.sh/community/matches/12345678 2 1\n` +
        'Ignores the first two maps **and** the last map',
    async execute(message, args, client, Discord) {
        // a matchId should have at least 5 digits but probably not more than 12
        const regExpMp = /(?:https:\/\/osu\/\.ppy\/\.sh\/)(?:mp|community\/matches)\/\d{5,12}?|(\d{5,12})(?:\/|)? ?(\d{0,2})? ?(\d{0,2})?/i;
        const test = args.slice().join(' ').match(regExpMp);

        // invalid matchId, ignore
        if (!test) return message.channel.send('Invalid MP link.');
        const matchId = test[1];

        // start index to slice maps array
        let warmupStart = 0;
        if (test[2]) warmupStart = parseInt(test[2]);

        // end index to slice maps array (negative)
        let warmupEnd = 0;
        if (test[3]) warmupEnd = -parseInt(test[3], 10);

        const result = await queryMatch(matchId);
        const match = new Match(matchId, result);
        message.channel.startTyping();
        match.calcMatchCosts(warmupStart, warmupEnd).then((r) => {
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
                    playerListRed.push(`\`1\` \`${round(playerArr[0].cost, 4)}\` • [${playerArr[0].username}](https://osu.ppy.sh/users/${playerArr[0].userId}) \`(#1)\``);
                    playerListBlue.push(`\`2\` \`${round(playerArr[1].cost, 4)}\` • [${playerArr[1].username}](https://osu.ppy.sh/users/${playerArr[1].userId}) \`(#2)\``);
                } else {
                    let isOdd = (playerArr.length % 2 !== 0);
                    let playerList = [];
                    for (let i = 0; i < playerArr.length; i++) {
                        if (playerArr[i].cost === 0) continue;
                        playerList.push(`\`${i + 1}\` \`${round(playerArr[i].cost, 4)}\` • [${playerArr[i].username}](https://osu.ppy.sh/users/${playerArr[i].userId})`);
                    }
                    playerListRed = isOdd ? playerList.slice(0, Math.floor(playerList.length / 2) + 1).filter(el => el) : playerList.slice(0, playerList.length / 2).filter(el => el);
                    playerListBlue = isOdd ? playerList.slice(Math.floor(playerList.length / 2) + 1).filter(el => el) : playerList.slice((playerList.length / 2)).filter(el => el);
                }
            } else if (match.team_type === '2') {
                // sort players into teams
                let indexRed = indexBlue = 1;
                for (let i = 0; i < playerArr.length; i++) {
                    if (playerArr[i].team === '2') {
                        playerListRed.push(`\`${indexRed}\` \`${round(playerArr[i].cost, 4)}\` • [${playerArr[i].username}](https://osu.ppy.sh/users/${playerArr[i].userId}) \`(#${i + 1})\``);
                        indexRed++;
                    }
                    else if (playerArr[i].team === '1') {
                        playerListBlue.push(`\`${indexBlue}\` \`${round(playerArr[i].cost, 4)}\` • [${playerArr[i].username}](https://osu.ppy.sh/users/${playerArr[i].userId}) \`(#${i + 1})\``);
                        indexBlue++;
                    }
                }
            }
            // create and send the embed for team mode
            message.channel.stopTyping();
            const embedTeam = mcEmbed(playerListRed, playerListBlue, teamScore1, teamScore2, matchId, r.lobbyName, match.start_time, warmupMessage, match.team_type, r.is1v1);
            return message.channel.send(embedTeam);
        });
    }
};