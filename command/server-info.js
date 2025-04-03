const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server-info')
        .setDescription('Get information about the server'),

    async execute(interaction) {
        const guild = interaction.guild;

        const embed = new EmbedBuilder()
            .setColor('#EE9923')
            .setTitle(`Server Information: ${guild.name}`)
            .setDescription('Here is the information about this server:')
            .addFields(
                { name: 'Server Name', value: guild.name, inline: true },
                { name: 'Server ID', value: guild.id, inline: true },
                { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
                { name: 'Total Members', value: guild.memberCount.toString(), inline: true },
                { name: 'Total Channels', value: guild.channels.cache.size.toString(), inline: true },
                { name: 'Created On', value: guild.createdAt.toDateString(), inline: false },
                { name: 'Region', value: guild.preferredLocale, inline: true },
                { name: 'Boost Level', value: guild.premiumTier.toString(), inline: true },
            )
            .setThumbnail(interaction.guild.iconURL())
            .setFooter({ text: 'Server Information', iconURL: interaction.client.user.avatarURL() })
            .setTimestamp();


        await interaction.reply({ embeds: [embed] });
    },
};
