const { MessageEmbed, MessageAttachment } = require('discord.js');
module.exports = {
    name: 'formula',
    description: 'Information about the formula used in the `match_costs` command',
    usage: '',
    aliases: [''],
    args: false,
    execute(message, args) {
        const mcImageEmbed = new MessageAttachment('./assets/mc_formula.png');
        const messageToSend = new MessageEmbed()
            .attachFiles(mcImageEmbed)
            .setColor('#b6268c')
            .setTitle('Match Costs Formula:')
            .setImage('attachment://mc_formula.png')
            .setFooter('Original formula created by D I O', 'https://a.ppy.sh/3958619')
        return message.channel.send(messageToSend);
    }
};