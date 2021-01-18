const { queryPlayer } = require('./functions');
const { median, cbrt, divide } = require('mathjs');

/**
 * Class representing a multiplayer lobby (match)
 * @class
 * @param {number|string} matchId - the ID of the lobby
 * @param {number=0} warmups - the amount of warmups to consider for the match
 */
const Match = class {
	constructor(matchId, obj) {
		this.matchId = matchId;
		this.name = obj.match.name;
		this.start_time = obj.match.start_time;
		this.end_time = obj.match.end_time;
		this.games = obj.games;
		this.team_type = obj.games[0].team_type;
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
	async calcMatchCosts(warmupsStartOffset, warmupsEndOffset) {
		let maps;
		let teamScore1 = 0;
		let teamScore2 = 0;

		if (warmupsStartOffset || warmupsEndOffset) {
			// no maps to calculate
			// can't simplify this further so it looks ugly
			if (warmupsStartOffset + -warmupsEndOffset >= this.getMaps.length) return;
			// if there's a start offset but not an end offset
			if (warmupsStartOffset && !warmupsEndOffset) maps = this.getMaps.slice(warmupsStartOffset);
			// if there's a end offset but not a start offset 
			else if (!warmupsStartOffset && warmupsEndOffset) maps = this.getMaps.slice(0, warmupsEndOffset);
			// if there's both a start and end offset
			else maps = this.getMaps.slice(warmupsStartOffset, warmupsEndOffset);
		} else {
			// no start or end offsets
			maps = this.getMaps;
		}
		for (const map of maps) {
			let playerScores1 = 0;
			let playerScores2 = 0;
			for (const player of map.scores) {
				if (player.team === '2') playerScores1 += parseInt(player.score);
				else if (player.team === '1') playerScores2 += parseInt(player.score);
			}
			if (playerScores1 > playerScores2) teamScore1 += 1;
			else if (playerScores2 > playerScores1) teamScore2 += 1;
		}
		// used to find the median of maps played
		const timesPlayedArr = [];
		const players = new Players();
		// map of map collection
		for (const map of maps) {
			const allScores = [];
			// get the median score for this map
			for (const scores of map.scores) {
				if(!scores) {
					allScores.push(0);
					continue;
				};
				const thisScore = parseInt(scores.score, 10);
				allScores.push(thisScore);
			}
			let medianScoreMap;
			let scoreTest = allScores.filter(r => r > 2000);
			if (scoreTest) {
				if (scoreTest === []) medianScoreMap = 0;
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
		return { lobbyName, players, result: { team1: teamScore1, team2: teamScore2 } };
	}
};
exports.Match = Match;

/**
 * A player in the lobby.
 * @class
 * @param {(number|string)} userId - the user's ID
 * @param {string} username - the user's name
 * @param {number} [mapsPlayed=1] - the amount of maps this player has played in the match.
 */
const Player = class {
	constructor(userId, username, scoreDivMedian, team) {
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
	summation(result) {
		this.scoreSum += result;
		// for chaining
		return this;
	}
	evalCost(medianLobby) {
		if (this.mapsPlayed === 0) this.cost = 0;
		else this.cost = this.scoreSum / this.mapsPlayed * cbrt(this.mapsPlayed / medianLobby);
		// for chaining
		return this;
	}
};
exports.Player = Player;

/**
 * Container for the Player class
 * @class
 */
const Players = class {
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
};
exports.Players = Players;