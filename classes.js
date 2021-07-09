const { queryPlayer } = require('./functions');
const { median, cbrt, divide } = require('mathjs');
/**
 * Class representing a multiplayer lobby (match)
 * @class
 */
class Match {
	/**
	 * @param {(number|string)} matchId - the ID of the lobby 
	 * @param {Object} obj - Object containing properties related to a match
	 * @param {Object} obj.match - Object containing information about the lobby
	 * @param {string} obj.match.name - Lobby name at the time of creation
	 * @param {string} obj.match.start_time - ISO timestamp indicating the lobby's creation time
	 * @param {string} obj.match.end_time - ISO timestamp indicating the lobby's closing time
	 * @param {Object[]} obj.games - Object containing the sets of games played on the lobby
	 * @param {(number|string)} obj.games[].team_type - Enum representation of the scoring type
	 */
	constructor(matchId, obj) {
		this.matchId = matchId;
		this.name = obj.match.name;
		this.start_time = obj.match.start_time;
		this.end_time = obj.match.end_time;
		this.games = obj.games;
		this.team_type = obj.games[0].team_type;
		this.uniqueGameModes = new Set(obj.games.map(game => game.play_mode));
	}
	get gameMode() {
		return this.isUniqueGameMode ? this.uniqueGameModes.values().next().value : '4';
	}
	get isUniqueGameMode() {
		return this.uniqueGameModes.size === 1;
	}
	// getter for the maps array
	get getMaps() {
		return this.games;
	}
	// return a specific map, zero-indexed
	getMap(index) {
		return this.games[index];
	}
	// return all scores for a certain map, zero-indexed
	getScores(index) {
		return this.getMap(index).scores;
	}
	async calcMatchCosts(warmupsStartOffset, warmupsEndOffset, multipliers) {
		let modEnum;
		if (multipliers) {
			modEnum = [
				{ name: 'None', abbr: 'NM', value: 0, multiplier: 1 },
				{ name: 'NoFail', abbr: 'NF', value: 1, multiplier: 1 },
				{ name: 'Easy', abbr: 'EZ', value: 2, multiplier: 1 },
				{ name: 'TouchDevice', abbr: 'TD', value: 4, multiplier: 1 },
				{ name: 'Hidden', abbr: 'HD', value: 8, multiplier: 1 },
				{ name: 'DoubleTime', abbr: 'DT', value: 64, multiplier: 1 },
				{ name: 'HardRock', abbr: 'HR', value: 16, multiplier: 1 },
				{ name: 'SuddenDeath', abbr: 'SD', value: 32, multiplier: 1 },
				{ name: 'Relax', abbr: 'RX', value: 128, multiplier: 1 },
				{ name: 'HalfTime', abbr: 'HT', value: 256, multiplier: 1 },
				{ name: 'Nightcore', abbr: 'NC', value: 512, multiplier: 1 },
				{ name: 'Flashlight', abbr: 'FL', value: 1024, multiplier: 1 },
				{ name: 'SpunOut', abbr: 'SO', value: 4096, multiplier: 1 },
				{ name: 'Perfect', abbr: 'PF', value: 16384, multiplier: 1 },
			];
		}
		const players = new Players();
		let maps;
		let teamScore1 = 0;
		let teamScore2 = 0;
		if (warmupsStartOffset || warmupsEndOffset) {
			// no maps to calculate
			// can't simplify this further so it looks ugly
			if (warmupsStartOffset + -warmupsEndOffset >= this.getMaps.length) return;
			// if there's a start offset but not an end offset
			if (warmupsStartOffset && !warmupsEndOffset) maps = this.getMaps.slice(warmupsStartOffset);
			// if there's am end offset but not a start offset 
			else if (!warmupsStartOffset && warmupsEndOffset) maps = this.getMaps.slice(0, warmupsEndOffset);
			// if there's both a start and end offsets
			else maps = this.getMaps.slice(warmupsStartOffset, warmupsEndOffset);
		} else {
			// no start or end offsets
			maps = this.getMaps;
		}
		const isOneVsOne = this.team_type === '0' && maps[0].scores.length === 2 && this.name.toLowerCase().includes('vs');
		let playerObj;
		if (isOneVsOne) {
			playerObj = {
				firstPlayer: {
					username: (await queryPlayer(maps[0].scores[0].user_id)).username,
					id: maps[0].scores[0].user_id,
					score: 0
				},
				secondPlayer: {
					username: (await queryPlayer(maps[0].scores[1].user_id)).username,
					id: maps[0].scores[1].user_id,
					score: 0
				}
			};
		}
		for (const [index, map] of maps.entries()) {
			let playerMapObj = {};
			let playerScores1 = 0;
			let playerScores2 = 0;
			for (const player of map.scores) {
				let playerMultiplier = 1;
				if (multipliers) {
					for (const multiplierObj of multipliers) {
						let playerMods;
						if (!map.mods && !player.enabled_mods) continue;
						if (!map.enabled_mods && player.enabled_mods) playerMods = parseFloat(player.enabled_mods);
						if (map.mods && !player.enabled_mods) playerMods = parseFloat(map.mods);
						let finalModArr = [];
						for (let mod of modEnum) {
							if ((playerMods & mod.value) > 0) {
								if (mod.value === 512 || mod.value === 16384) continue;
								finalModArr.push(mod.abbr);
								continue; // artificial limitation for now
							}
						}
						if (finalModArr.includes(multiplierObj.mod.toUpperCase())) {
							playerMultiplier *= multiplierObj.value;
							player.score *= playerMultiplier;
						}
					}
				}
				if (isOneVsOne && map.scores.length === 2) {
					if (player.user_id === playerObj.firstPlayer.id) {
						playerMapObj.firstPlayerScore = parseInt(player.score) * playerMultiplier;
					}
					else if (player.user_id === playerObj.secondPlayer.id) {
						playerMapObj.secondPlayerScore = parseInt(player.score) * playerMultiplier;
					}
				}
				else {
					if (player.team === '2') playerScores1 += (parseInt(player.score) * playerMultiplier);
					if (player.team === '1') playerScores2 += (parseInt(player.score) * playerMultiplier);
				}
			}
			if (isOneVsOne && map.scores.length === 2) {
				if (playerMapObj.firstPlayerScore > playerMapObj.secondPlayerScore) playerObj.firstPlayer.score++;
				else if (playerMapObj.secondPlayerScore > playerMapObj.firstPlayerScore) playerObj.secondPlayer.score++;
			}
			else {
				if (playerScores1 > playerScores2) teamScore1 += 1;
				if (playerScores2 > playerScores1) teamScore2 += 1;
			}
		}
		// used to find the median of maps played
		const timesPlayedArr = [];
		// map of map collection
		for (const map of maps) {
			const allScores = [];
			// get the median score for this map
			for (const scores of map.scores) {
				if (!scores) {
					allScores.push(0);
					continue;
				}
				const thisScore = parseInt(scores.score, 10);
				allScores.push(thisScore);
			}
			let medianScoreMap;
			let scoreTest = allScores.filter(r => r > 2000);
			if (scoreTest) {
				if (scoreTest.length === 0) medianScoreMap = 0;
				if (scoreTest.length === 1) medianScoreMap = scoreTest[0];
				if (scoreTest.length > 1) medianScoreMap = median(scoreTest);
			}
			else {
				medianScoreMap = 0;
			}
			// player of map
			for (const player of map.scores) {
				const userId = player.user_id;
				const score = parseInt(player.score, 10);
				let scoreDivMedian;
				if (score > 1000) allScores.push(score);
				// if the player doesn't have an username, search array
				if (userId && !player.username) {
					let score = parseInt(player.score, 10);
					// if the player doesn't have a stored username, queryPlayer()
					if (!players.findPlayer(userId)) {
						// divide player score on this map by the median score then add to the summation
						if (score === 0) scoreDivMedian = 0;
						else scoreDivMedian = divide(score, medianScoreMap);
						const query = await queryPlayer(userId);
						const currentPlayer = new Player(userId, query.username, scoreDivMedian, player.team);
						map.username = currentPlayer.username;
						if (score > 1000) currentPlayer.mapsIncrement();
						players.addPlayer(currentPlayer);
					}
					// else append username to the array
					else {
						if (score === 0) scoreDivMedian = 0;
						else if (!medianScoreMap) scoreDivMedian = 0;
						else scoreDivMedian = divide(score, medianScoreMap);
						const currentPlayer = players.findPlayer(userId);
						currentPlayer.summation(scoreDivMedian);
						if (score > 1000) currentPlayer.mapsIncrement();
						map.username = currentPlayer.username;
					}
				}
			}
		}
		for (const player of players.getPlayers()) {
			timesPlayedArr.push(player.mapsPlayed);
		}

		// median of the amount of maps played in the lobby
		let medianLobby;
		if (timesPlayedArr) medianLobby = await median(timesPlayedArr.filter(r => r !== 0));
		else medianLobby = 0;

		for (const player of players.getPlayers()) {
			player.evalCost(medianLobby);
		}
		const lobbyName = this.name;
		return {
			lobbyName,
			players,
			is1v1: this.team_type === '0' && maps[0].scores.length === 2,
			teamOrderOneVsOne: playerObj,
			result: {
				team1: teamScore1,
				team2: teamScore2
			}
		};
	}
}
module.exports.Match = Match;

/**
 * A player in the lobby.
 * @class
 * @param {(number|string)} userId - the user's ID
 * @param {string} username - the user's name
 * @param {Object} modsMult - Object containing different multipliers for each mod listed
 */
class Player {
	constructor(userId, username, scoreDivMedian, team, modsMult) {
		this.userId = userId;
		this.username = username;
		this.scoreSum = scoreDivMedian;
		this.mapsPlayed = 0;
		this.cost = 0;
		this.team = team;
	}
	mapsIncrement() {
		this.mapsPlayed++;
		// for chaining
		return this;
	}
	summation(result, mods) {

		this.scoreSum += result;
		return this;
	}
	evalCost(medianLobby) {
		if (this.mapsPlayed === 0) this.cost = 0;
		else this.cost = this.scoreSum / this.mapsPlayed * cbrt(this.mapsPlayed / medianLobby);
		return this;
	}
}
module.exports.Player = Player;

/**
 * Container for the Player class
 * @class
 */
class Players {
	constructor() {
		this.players = [];
	}
	getPlayers() {
		return this.players;
	}
	addPlayer(player) {
		if (!player) return;
		this.players.push(player);
	}
	findPlayer(player) {
		// find userId in our array
		const result = this.players.find(el => el.userId === player);
		if (result) return result;
	}
}
module.exports.Players = Players;