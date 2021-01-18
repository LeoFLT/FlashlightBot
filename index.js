require('dotenv').config();
const { Match } = require('./classes.js');
const { queryMatch } = require('./functions.js');
const { round } = require('mathjs');
const Discord = require('discord.js');
const botImageEmbed = new Discord.MessageAttachment('./assets/flashlight.png');
const mcImageEmbed = new Discord.MessageAttachment('./assets/mc_formula.png');
const creator = process.env.OWNER;
const globalPrefix = process.env.PREFIX;

const mcFormulaImg = 'https://i.imgur.com/hmF9ucC.png';

// const Keyv = require('keyv');
// const prefixes = new Keyv();
// prefixes.on('error', e => console.error('Keyv connection error:', e));

const client = new Discord.Client();
client.login();

client.once('ready', () => {
	console.log(`Connected as an instance of '${client.user.tag}'`);
});


client.on('ready', () => {
	// Watching x guilds
	client.user.setPresence({ activity: { name: client.guilds.cache.size + ' guilds', type: 'WATCHING' }, status: 'online' })
});

client.on('message', async (message) => {
	if (message.author.bot || !message.content.startsWith(globalPrefix)) return;

	let prefix = globalPrefix;
	let args;
	/*	// handle messages in a guild
		if (message.guild) {
			if (message.content.startsWith(globalPrefix)) {
				prefix = globalPrefix;
			} else {
				// check the guild-level prefix
				const guildPrefix = await prefixes.get(message.guild.id);
				if (message.content.startsWith(guildPrefix)) prefix = guildPrefix;
			}
	
			// if we found a prefix, setup args; otherwise, this isn't a command
			if (!prefix) return;
			args = message.content.slice(prefix.length).trim().split(/\s+/);
		} else {
			// handle DMs
			const slice = message.content.startsWith(globalPrefix) ? globalPrefix.length : 0;
			args = message.content.slice(slice).split(/\s+/);
		}
	*/

	args = message.content.slice(prefix.length).trim().split(/\s+/);
	// get the first space-delimited argument after the prefix as the command
	const command = args.shift().toLowerCase();
	// help commands
	if (command === 'prefix') {
		// if there's at least one argument, set the prefix
		if (args.length) {
			await prefixes.set(message.guild.id, args[0]);
			return message.channel.send(`Successfully set prefix to \`${args[0]}\``);
		}

		return message.channel.send(`Prefix is \`${await prefixes.get(message.guild.id) || globalPrefix}\``);
	}

	if (message.content === prefix + 'mc' || message.content === prefix + 'match cost' || message.content === prefix + 'match costs' || command === 'help' || command === 'command' || command === 'commands' || command === 'cmd') {
		return message.channel.send(`\`\`\`css
<${prefix}mc | ${prefix}match_cost | ${prefix}match_costs> <url | match ID> <ignore maps from the start>* <ignore maps from the end>*
* = optional\`\`\`
Example: ${prefix}mc https://osu.ppy.sh/community/matches/12345678 2 1
Ignores the first two maps **and** the last map
	`);
	}
	if (command === 'info') {
		const messageToSend = new Discord.MessageEmbed()
			.attachFiles(botImageEmbed)
			.setColor('#b6268c')
			.setTitle('Yet another match costs bot')
			.setAuthor('Flashlight', client.user.displayAvatarURL(), 'https://flashlight.leoflt.com')
			.setDescription(`Flashlight is the result of [LeoFLT](https://osu.ppy.sh/users/3668779) losing a night's sleep just to code [D I O](https://osu.ppy.sh/users/3958619)'s match cost [formula](${mcFormulaImg}), nothing major.`)
			.setThumbnail('attachment://flashlight.png')
			.setFooter(`Created by ${(await client.users.fetch(creator)).username}`, (await client.users.fetch(creator)).displayAvatarURL());
		return message.channel.send(messageToSend);
	}
	if (command === 'formula') {
		const messageToSend = new Discord.MessageEmbed()
			.attachFiles(mcImageEmbed)
			.setColor('#b6268c')
			.setTitle('Match Costs Formula:')
			.setImage('attachment://mc_formula.png')
			.setFooter('Original formula created by D I O', 'https://a.ppy.sh/3958619')
		return message.channel.send(messageToSend);
	}

	if (command === 'invite') {
		const messageToSend = new Discord.MessageEmbed()
			.attachFiles(botImageEmbed)
			.setColor('#b6268c')
			.setTitle('Yet another match costs bot')
			.setAuthor('Flashlight', client.user.displayAvatarURL(), 'https://flashlight.leoflt.com')
			.setThumbnail('attachment://flashlight.png')
			.setDescription('Use [this link](https://discord.com/oauth2/authorize?client_id=792672311048011826&permissions=378944&scope=bot) to invite the bot to your server.')
		return message.channel.send(messageToSend);
	}


	if ((command === 'mc' || command === 'match_cost' || command === 'match_costs')) {
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
				.setFooter('Played at ' + new Date(match.start_time).toUTCString().replace('GMT', 'UTC'));
			if (match.team_type === '2') return message.channel.send(embedTeam);
		});
	}
});