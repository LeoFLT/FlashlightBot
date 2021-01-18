const { osuApiKey } = require('./config.json');
const fetch = require('node-fetch');

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
exports.queryMatch = queryMatch;

/**
 * Queries a user ID using the osu! API
 * @function queryPlayer
 * @param {(number|string)} userId - The user ID to query
 * @returns {Promise<[object]>} Promise that resolves to to an object representing the user
 */
const queryPlayer = async (userId) => {
	const url = new URL(`https://osu.ppy.sh/api/get_user?k=${osuApiKey}&u=${userId}&type=id`);
	const result = await fetch(url).then(response => response.json());
	if (!result[0]) return {username: 'RESTRICTED PLAYER (User ID: ' + userId + ')'};
	return result[0];
};
exports.queryPlayer = queryPlayer;