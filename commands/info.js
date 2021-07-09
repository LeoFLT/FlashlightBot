const { MessageEmbed, MessageAttachment } = require('discord.js');

module.exports = {
    name: 'info',
    description: 'General information about the bot',
    usage: '',
    aliases: [''],
    args: false,
    execute(message, args) {
        const creator = process.env.OWNER;
        const botImageEmbed = new MessageAttachment('./assets/flashlight.png');
        const messageToSend = new MessageEmbed()
            .attachFiles(botImageEmbed)
            .setColor('#b6268c')
            .setTitle('Yet another match costs bot')
            .setAuthor('Flashlight', message.client.user.displayAvatarURL(), 'https://flashlight.leoflt.com')
            .setDescription(`Flashlight is the result of [LeoFLT](https://osu.ppy.sh/users/3668779) losing a night's sleep just to code [D I O](https://osu.ppy.sh/users/3958619)'s match cost [formula](https://media.discordapp.net/attachments/811643995755249664/855984680045248532/mc_formula.png), nothing major.`)
            .setThumbnail('attachment://flashlight.png')
            .setFooter('Created by LeoFLT', message.client.users.cache.get(process.env.OWNER).displayAvatarURL());
        return message.channel.send(messageToSend);
    }
};