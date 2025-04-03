const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')  
    .setDescription('Check the bot\'s ping'),
  async execute(interaction) {
    const ping = interaction.client.ws.ping; 

  const embed = new EmbedBuilder()
    .setTitle("Pong")
    .setDescription(`🏓 **${ping}ms**`)
    .setColor(Math.floor(Math.random() * 16777215))
    .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
