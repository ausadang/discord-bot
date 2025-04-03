require('dotenv').config();
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

const COLORS = {
  SUCCESS: process.env.COLOR_SUCCESS || '#51ff54',
  FAIL: process.env.COLOR_FAIL || '#ff5151',
  WARN: process.env.COLOR_WARN || '#fdff51',
};

// รหัสผ่านควรเก็บใน environment variable
const SUDO_PASSWORD = process.env.SUDO_PASSWORD || 'adminpassword123'; // จริงๆ ควรเปลี่ยนเป็นรหัสที่ซับซ้อนกว่านี้

// This command has been replaced by a message-based command in messageCreate.js
// It's kept here as a legacy/compatibility version that redirects users to the new command
module.exports = {
  data: new SlashCommandBuilder()
    .setName('sudo-info-legacy')  // Changed name to avoid registration & conflicts
    .setDescription('Redirects to the new .sudo-info command'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {      
      const embed = new EmbedBuilder()
        .setColor(COLORS.WARN)
        .setTitle('🔑 Command Changed')
        .setDescription('The slash command `/sudo-info` has been replaced with a message-based command.\n\nPlease use `.sudo-info` instead to check your sudo status.')
        .setFooter({ text: 'This change helps maintain a consistent format with the .sudo command.' });
      
      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('[SUDO] Error:', error);
      
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.FAIL)
            .setTitle('❌ Error')
            .setDescription('An unexpected error occurred. Please try again later.')
        ]
      });
    }
  },
}; 