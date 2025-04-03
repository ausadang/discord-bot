const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bot-info')
    .setDescription('Get bot information'),
  async execute(interaction) {
    const botInfoEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Bot Information')
      .setDescription('Here is the information about this bot.')
      .addFields(
        { name: 'Bot Name', value: interaction.client.user.username, inline: true },
        { name: 'Bot ID', value: interaction.client.user.id, inline: true },
        { name: 'Created On', value: interaction.client.user.createdAt.toDateString(), inline: false },
        { name: 'Guild Count', value: interaction.client.guilds.cache.size.toString(), inline: true },
        { name: 'Ping', value: `${Math.round(interaction.client.ws.ping)}ms`, inline: true }
      )
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setFooter({ text: 'Bot Information', iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [botInfoEmbed] });
  },
};
