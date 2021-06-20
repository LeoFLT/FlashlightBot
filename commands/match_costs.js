const { Match } = require('./classes.js');
const { queryMatch } = require('./functions.js');
const { round } = require('mathjs');

module.exports = {
    name: 'match_cost',
    description: "Calculate the costs for a given match, using D I O's formula.",
    aliases: ['mc', 'match_costs'],
    usage: '```\n' +
    `<${prefix}mc | ${prefix}match_cost | ${prefix}match_costs> <url | match ID> <ignore maps from the start>* <ignore maps from the end>*\n` +
        '* = optional```\n' +
        `Example: ${prefix}mc https://osu.ppy.sh/community/matches/12345678 2 1\n` +
        'Ignores the first two maps **and** the last map',
    execute(message, args) {
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

        match.calcMatchCosts(warmupStart, warmupEnd).then((r) => {
            // no maps to calculate
            if (!r) return message.channel.send('Warmup count can\'t be equal or superior to the amount of maps played.');
            // sorting array of objects by descending match cost property
            const playerArr = r.players.players.sort((a, b) => (a.cost < b.cost) ? 1 : ((b.cost < a.cost) ? -1 : 0));
            let playerList = '';
            let playerList2 = '';
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
                for (let i = 0; i < playerArr.length; i++) {
                    if (playerArr[i].cost === 0) continue;
                    playerList += i + 1 + ': [' + playerArr[i].username + '](https://osu.ppy.sh/users/'
                        + playerArr[i].userId + ') - **'
                        + round(playerArr[i].cost, 4) + '**\n';
                }
            } else if (match.team_type === '2') {
                const playerArr1 = [];
                const playerArr2 = [];
                // red team
                playerList += ':red_circle: __Red Team__\n';
                // blue team
                playerList2 = ':blue_circle: __Blue Team__\n';
                // sort players into teams
                for (let i = 0; i < playerArr.length; i++) {
                    if (playerArr[i].team === '2') playerArr1.push(playerArr[i]);
                    else if (playerArr[i].team === '1') playerArr2.push(playerArr[i]);
                }
                // team 1 (red)
                for (let i = 0; i < playerArr1.length; i++) {
                    if (playerArr1[i].cost === 0) continue;
                    playerList += i + 1 + ': [' + playerArr1[i].username + '](https://osu.ppy.sh/users/'
                        + playerArr1[i].userId + ') - **'
                        + round(playerArr1[i].cost, 4) + '**\n';
                }
                // team 2 (blue)
                for (let i = 0; i < playerArr2.length; i++) {
                    if (playerArr2[i].cost === 0) continue;
                    playerList2 += i + 1 + ': [' + playerArr2[i].username + '](https://osu.ppy.sh/users/'
                        + playerArr2[i].userId + ') - **'
                        + round(playerArr2[i].cost, 4) + '**\n';
                }
            }
            // create and send the embed for solo mode
            const embedSolo = new Discord.MessageEmbed()
                .setColor('#b6268c')
                .setTitle(`**${r.lobbyName}**`)
                .setURL(`https://osu.ppy.sh/community/matches/${matchId}`)
                .setDescription(warmupMessage + playerList)
                .setThumbnail('http://s.ppy.sh/a/' + playerArr[0].userId)
                .setFooter('Match date')
                .setFooter('Played at ' + new Date(match.start_time).toUTCString().replace('GMT', 'UTC'))
            if (match.team_type === '0') return message.channel.send(embedSolo);
            // create and send the embed for team mode
            const matchDescResult = (() => {
                const result = teamScore1 > teamScore2 ?
                    warmupMessage +
                    '**Final Score:**\n**' + ':red_circle: Red Team: ' + teamScore1 + '**\n'
                    + ':blue_circle: Blue Team: ' + teamScore2 + '\n\n'
                    + playerList + '\n' + playerList2 + '\n' :
                    teamScore2 > teamScore1 ?
                        warmupMessage +
                        '**Final Score:**\n' + ':red_circle: Red Team: ' + teamScore1 + '\n**'
                        + ':blue_circle: Blue Team: ' + teamScore2 + '**\n\n'
                        + playerList + '\n' + playerList2 + '\n' : '';
                return result;
            });
            const embedTeam = new Discord.MessageEmbed()
                .setColor('#b6268c')
                .setTitle(`**${r.lobbyName}**`)
                .setURL(`https://osu.ppy.sh/community/matches/${matchId}`)
                .setDescription(matchDescResult())
                .setThumbnail('http://s.ppy.sh/a/' + playerArr[0].userId)
                .setFooter('Played at ' + new Date(match.start_time).toUTCString().replace('GMT', 'UTC'))
            if (match.team_type === '2') return message.channel.send(embedTeam);
        });
    }
};