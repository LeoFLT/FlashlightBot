module.exports = {
    name: 'invite',
    description: 'returns an invite to add flashlight to another guilds',
    usage: '',
    aliases: ['inv'],
    execute(message) {
        const botImageEmbed = new Discord.MessageAttachment('./assets/flashlight.png');
        const messageToSend = new Discord.MessageEmbed()
            .attachFiles(botImageEmbed)
            .setColor('#b6268c')
            .setTitle('Yet another match costs bot')
            .setAuthor('Flashlight', client.user.displayAvatarURL(), 'https://flashlight.leoflt.com')
            .setThumbnail('attachment://flashlight.png')
            .setDescription('Use [this link](https://flashlight.leoflt.com) to invite the bot to your server.')
        return message.channel.send(messageToSend);
    }
};