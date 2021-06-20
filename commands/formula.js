module.exports = {
    name: 'formula',
    description: 'Information about the formula used to calculate with `match_cost`',
    usage: '',
    aliases: [''],
    execute(message, args, client, Discord) {
        const mcImageEmbed = new Discord.MessageAttachment('./assets/mc_formula.png');
        const messageToSend = new Discord.MessageEmbed()
            .attachFiles(mcImageEmbed)
            .setColor('#b6268c')
            .setTitle('Match Costs Formula:')
            .setImage('attachment://mc_formula.png')
            .setFooter('Original formula created by D I O', 'https://a.ppy.sh/3958619')
        return message.channel.send(messageToSend);
    }
};