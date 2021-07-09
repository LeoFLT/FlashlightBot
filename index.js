require('dotenv').config();
const fs = require('fs');
const Discord = require('discord.js');
const globalPrefix = process.env.PREFIX;
const client = new Discord.Client();
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

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

client.login();

client.once('ready', () => {
	console.log(`\n${new Date().toISOString().replace('T', ' ')} - INFO: Connected as '${client.user.tag}'`);
});

client.on('ready', () => {
	client.user.setPresence({ activity: { name: `for ${globalPrefix}help`, type: 'WATCHING' }, status: 'online' });
	console.log(`\n${new Date().toISOString().replace('T', ' ')} - INFO: Set presence status to '${globalPrefix}help', type: WATCHING`);
});

/*
client.ws.on('INTERACTION_CREATE', async interaction => {
	const command = interaction.data.name.toLowerCase();
	const args = interaction.data.options;

	if (!client.commands.has(command)) return;
	try {
		client.commands.get(command).execute(message, args);
	} catch (e) {
		console.error(`\n${new Date().toISOString().replace('T', ' ')} - ERROR: ${e.message}`);
		message.reply('there was an error trying to execute that command!');
	}
});
*/


client.on('message', async (message) => {
	if (message.author.bot || !message.content.startsWith(globalPrefix)) return;
	let prefix = globalPrefix;
	let args = message.content.slice(prefix.length).trim().split(/\s+/);

	// get the first space-delimited argument after the prefix as the command
	const commandName = args.shift().toLowerCase();
	if (!client.commands.has(commandName)) return;
	const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
	if (command.args && !args.length) {
		let msg = `Missing arguments for command: \`${prefix}${commandName}\``;
		if (command.usage) msg += '\n**Usage:**\n' + command.usage;
		return message.reply(msg);
	}
	try {
		command.execute(message, args);
	} catch (e) {
		console.error(`\n${new Date().toISOString().replace('T', ' ')} - ERROR: ${e.stack}`);
		message.reply('there was an error trying to execute that command!');
	}
});