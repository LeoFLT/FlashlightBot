require('dotenv').config();
const fetch = require('node-fetch');
const { MessageEmbed } = require('discord.js');
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

const mcEmbed = (teamRed, teamBlue, scoreRed, scoreBlue, matchId, lobbyName, matchStartTime, warmupMessage, mode, is1v1, is1v1PlayerObj, gameMode) => {
	let gameModeImg;
	switch (gameMode) {
		case '0':
			gameModeImg = 'https://i.imgur.com/fnRPSk2.png';
			break;
		case '1':
			gameModeImg = 'https://i.imgur.com/LMaVI8A.png';
			break;
		case '2':
			gameModeImg = 'https://i.imgur.com/kftQ0tR.png';
			break;

		case '3':
			gameModeImg = 'https://i.imgur.com/YHi4Mer.png';
			break;
		case '4':
			gameModeImg = 'https://i.imgur.com/t6zXMlG.png';
			break;
	}
	const matchDescResult = (() => {
		let result;
		if (is1v1) {
			if (is1v1PlayerObj.firstPlayer.score > is1v1PlayerObj.secondPlayer.score) {
				result = `**•**\t\`${is1v1PlayerObj.firstPlayer.score}\`\t**[${is1v1PlayerObj.firstPlayer.username}](https://osu.ppy.sh/users/${is1v1PlayerObj.firstPlayer.id})**\n`
				+ `•\t\`${is1v1PlayerObj.secondPlayer.score}\`\t[${is1v1PlayerObj.secondPlayer.username}](https://osu.ppy.sh/users/${is1v1PlayerObj.secondPlayer.id})`;
			}
			else if (is1v1PlayerObj.secondPlayer.score > is1v1PlayerObj.firstPlayer.score){
				result = `**•**\t\`${is1v1PlayerObj.secondPlayer.score}\`\t**[${is1v1PlayerObj.secondPlayer.username}](https://osu.ppy.sh/users/${is1v1PlayerObj.secondPlayer.id})**\n`
				+ `•\t\`${is1v1PlayerObj.firstPlayer.score}\`\t[${is1v1PlayerObj.firstPlayer.username}](https://osu.ppy.sh/users/${is1v1PlayerObj.firstPlayer.id})`;
			
			} else {
				result = `•\t\`${is1v1PlayerObj.firstPlayer.score}\`\t[${is1v1PlayerObj.firstPlayer.username}](https://osu.ppy.sh/users/${is1v1PlayerObj.firstPlayer.id})\n`
				+ `•\t\`${is1v1PlayerObj.secondPlayer.score}\`\t[${is1v1PlayerObj.secondPlayer.username}](https://osu.ppy.sh/users/${is1v1PlayerObj.secondPlayer.id})`;
			}
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
	let embed = new MessageEmbed()
		.setColor('#b6268c')
		.setAuthor(lobbyName, gameModeImg, `https://osu.ppy.sh/community/matches/${matchId}`)
		.setTimestamp(new Date(matchStartTime))
	if (is1v1) {
		let finalArr = teamRed.concat(teamBlue);
		embed.setDescription(warmupMessage)
			.addFields(
				{ name: 'Final Score:', value: matchDescResult(), inline: false },
				{ name: 'Match Costs', value: finalArr.length > 0 ? finalArr : '\u200b', inline: true },
			);
	}
	else if (mode === '0') {
		embed.setDescription(warmupMessage)
			.addFields(
				{ name: `\u200b`, value: teamRed.length > 0 ? teamRed : '\u200b', inline: true },
				{ name: `\u200b`, value: teamBlue.length > 0 ? teamBlue : '\u200b', inline: true }
			);
	}
	else {
		embed.setDescription(warmupMessage)
			.addFields(
				{ name: 'Final Score:', value: matchDescResult(), inline: false },
				{ name: `:red_circle: Red Team (${teamRed.length})`, value: teamRed.length > 0 ? teamRed : '\u200b', inline: true },
				{ name: `:blue_circle: Blue Team (${teamBlue.length})`, value: teamBlue.length > 0 ? teamBlue : '\u200b', inline: true }
			);
	}
	return embed;
};
exports.queryMatch = queryMatch;
exports.queryPlayer = queryPlayer;
exports.mcEmbed = mcEmbed;
