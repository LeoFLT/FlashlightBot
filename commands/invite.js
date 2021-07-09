const { MessageEmbed, MessageAttachment } = require('discord.js');

module.exports = {
    name: 'invite',
    description: 'returns an invite to add flashlight to another guilds',
    usage: '',
    aliases: ['inv'],
    args: false,
    execute(message) {
        const botImageEmbed = new MessageAttachment('./assets/flashlight.png');
        const messageToSend = new MessageEmbed()
            .attachFiles(botImageEmbed)
            .setColor('#b6268c')
            .setTitle('Yet another match costs bot')
            .setAuthor('Flashlight', message.client.user.displayAvatarURL(), 'https://flashlight.leoflt.com')
            .setThumbnail('attachment://flashlight.png')
            .setDescription('Use [this link](https://flashlight.leoflt.com) to invite the bot to your server.')
        return message.channel.send(messageToSend);
    }
};