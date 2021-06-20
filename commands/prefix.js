module.exports = {
    name: 'prefix',
    description: 'Change the prefix for a specific guild. (the max length for a prefix is 2 characters)',
    usage: '<new prefix>',
    execute(message, args) {
        // if there's at least one argument, set the prefix
        if (args.length) {
            await prefixes.set(message.guild.id, args[0]);
            return message.channel.send(`Successfully set prefix to \`${args[0]}\``);
        }

        return message.channel.send(`My prefix is \`${await prefixes.get(message.guild.id) || globalPrefix}\``);
    }
};