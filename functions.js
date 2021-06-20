require('dotenv').config();
const fetch = require('node-fetch');
const Discord = require('discord.js');
const osuApiKey = process.env.OSU_API_KEY;

/**
 * Queries a user ID using the osu! API
 * @function queryMatch
 * @param {(number|string)} matchId - The match ID object to query
 * @returns {Promise<object>} Promise that resolves to to an object representing the lobby
 */
const queryMatch = async (matchId) => {
	const url = new URL(`https://osu.ppy.sh/api/get_match?k=${osuApiKey}&mp=${matchId}`);
	const result = await fetch(url).then(response => response.json());
	return result;
};

/**
 * Queries a user ID using the osu! API
 * @function queryPlayer
 * @param {(number|string)} userId - The user ID to query
 * @returns {Promise<[object]>} Promise that resolves to to an object representing the user
 */
const queryPlayer = async (userId) => {
	const url = new URL(`https://osu.ppy.sh/api/get_user?k=${osuApiKey}&u=${userId}&type=id`);
	const result = await fetch(url).then(response => response.json());
	if (!result[0]) return { username: 'RESTRICTED PLAYER (User ID: ' + userId + ')' };
	return result[0];
};

const mcEmbed = (teamRed, teamBlue, scoreRed, scoreBlue, matchId, lobbyName, matchStartTime, warmupMessage, mode, is1v1) => {
	const matchDescResult = ((matchIs1v1) => {
		console.log(scoreRed, scoreBlue);
		let regexp = / • \[([\w\s-_\]\[]+)\]/;
		let result;
		if (matchIs1v1) {
			result = scoreRed > scoreBlue ?
				`**${regexp.exec(teamRed[0])[1]}: \`${scoreRed}\`**\n`
				+ `${regexp.exec(teamBlue[0])[1]}: \`${scoreBlue}\`` :
				scoreBlue > scoreRed ?
					`${regexp.exec(teamRed[0])[1]}: \`${scoreRed}\`\n**`
					+ `${regexp.exec(teamBlue[0])[1]}: \`${scoreBlue}\`**` :
					`${regexp.exec(teamRed[0])[1]}: \`${scoreRed}\`\n`
					+ `${regexp.exec(teamBlue[0])[1]}: \`${scoreBlue}\``;
		}
		else {
			result = scoreRed > scoreBlue ?
				`** :red_circle: Red Team: \`${scoreRed}\`**\n`
				+ `:blue_circle: Blue Team: \`${scoreBlue}\`` :
				scoreBlue > scoreRed ?
					`:red_circle: Red Team: \`${scoreRed}\`\n**`
					+ `:blue_circle: Blue Team: \`${scoreBlue}\`**` :
					`:red_circle: Red Team: \`${scoreRed}\`\n`
					+ `:blue_circle: Blue Team: \`${scoreBlue}\``;
		}
		return result;
	});
	let embed = new Discord.MessageEmbed()
		.setColor('#b6268c')
		.setTitle(`**${lobbyName}**`)
		.setURL(`https://osu.ppy.sh/community/matches/${matchId}`)
		.setFooter('Played at ' + new Date(matchStartTime).toUTCString().replace('GMT', 'UTC'));
	if (is1v1) {
		embed.setDescription(warmupMessage)
			.addFields(
				{ name: 'Final Score:', value: matchDescResult(), inline: false },
				{ name: `\u200b`, value: teamRed.length > 0 ? teamRed : '\u200b', inline: true },
				{ name: '\u200b', value: '\u200b', inline: true },
				{ name: `\u200b`, value: teamBlue.length > 0 ? teamBlue : '\u200b', inline: true }
			);
	}
	else if (mode === '0') {
		embed.setDescription(warmupMessage)
			.addFields(
				{ name: `\u200b`, value: teamRed.length > 0 ? teamRed : '\u200b', inline: true },
				{ name: '\u200b', value: '\u200b', inline: true },
				{ name: `\u200b`, value: teamBlue.length > 0 ? teamBlue : '\u200b', inline: true }
			);
	}
	else {
		console.log({ name: 'Final Score:', value: matchDescResult(), inline: false });
		embed.setDescription(warmupMessage)
			.addFields(
				{ name: 'Final Score:', value: matchDescResult(), inline: false },
				{ name: `:red_circle: Red Team (${teamRed.length})`, value: teamRed.length > 0 ? teamRed : '\u200b', inline: true },
				{ name: '\u200b', value: '\u200b', inline: true },
				{ name: `:blue_circle: Blue Team (${teamBlue.length})`, value: teamBlue.length > 0 ? teamBlue : '\u200b', inline: true }
			);
	}
	return embed;
};

exports.queryMatch = queryMatch;
exports.queryPlayer = queryPlayer;
exports.mcEmbed = mcEmbed;