require('dotenv').config();
const fs = require('fs');
const Discord = require('discord.js');
const globalPrefix = process.env.PREFIX;
const client = new Discord.Client();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
client.commands - new Discord.Collection();

for (const file of commandFiles) {
	process.stdout.write(`${new Date().toISOString().replace('T', ' ')} - INFO: Loading ${file}...`);
	try {
		const command = require(`./commands/${file}`);
		client.commands.set(command.name, command);
		if ('aliases' in command) {
			for (const alias of command.aliases) {
				client.commands.set(alias, command);
			}
		}
		process.stdout.write(' OK!\n');
	} catch (e) {
		process.stdout.write(` Error: ${e.message}\n`);
	}
}


// const Keyv = require('keyv');
// const prefixes = new Keyv();
// prefixes.on('error', e => console.error('Keyv connection error:', e));

client.login();

client.once('ready', () => {
	console.log(`\n${new Date().toISOString().replace('T', ' ')} - INFO: Connected as '${client.user.tag}'`);
});

client.on('ready', () => {
	client.user.setPresence({ activity: { name: `${globalPrefix}help`, type: 'WATCHING' }, status: 'online' });
	console.log(`\n${new Date().toISOString().replace('T', ' ')} - INFO: Set presence status to '${globalPrefix}help', type: WATCHING`);
});

client.ws.on('INTERACTION_CREATE', async interaction => {
	const command = interaction.data.name.toLowerCase();
	const args = interaction.data.options;

	if (!client.commands.has(command)) return;
	try {
		client.commands.get(command).execute(message, args, client, Discord);
	} catch (e) {
		console.error(`\n${new Date().toISOString().replace('T', ' ')} - ERROR: ${e.message}`);
		message.reply('there was an error trying to execute that command!');
	}
});

client.on('message', async (message) => {
	if (message.author.bot || !message.content.startsWith(globalPrefix)) return;
	let prefix = globalPrefix;
	let args = message.content.slice(prefix.length).trim().split(/\s+/);
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

	// get the first space-delimited argument after the prefix as the command
	const command = args.shift().toLowerCase();
	if (!client.commands.has(command)) return;
	try {
		client.commands.get(command).execute(message, args, client, Discord);
	} catch (e) {
		console.error(`\n${new Date().toISOString().replace('T', ' ')} - ERROR: ${e.stack}`);
		message.reply('there was an error trying to execute that command!');
	}
});