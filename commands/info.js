module.exports = {
    name: 'info',
    description: 'General information about the bot',
    usage: '',
    aliases: [''],
    execute(message) {
        const creator = process.env.OWNER;
        const botImageEmbed = new Discord.MessageAttachment('./assets/flashlight.png');
        const mcFormulaImg = new Discord.MessageAttachment('./assets/mc_formula.png');
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
};