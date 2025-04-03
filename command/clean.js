const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clean')
    .setDescription('Clean messages in the channel based on type and limit')
    .addStringOption(option => 
      option.setName('type')
        .setDescription('Type of messages to delete')
        .setRequired(true)
        .addChoices(
          { name: 'All', value: 'all' },
          { name: 'Normal Messages', value: 'normal' },
          { name: 'Links', value: 'links' },
          { name: 'Files', value: 'files' }
        )
    )
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('Number of messages to delete (max 100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),
  
  async execute(interaction) {
    const type = interaction.options.getString('type');
    const limit = interaction.options.getInteger('limit');
    const channel = interaction.channel;

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({ content: 'You need `MANAGE_MESSAGES` permission to use this command.', ephemeral: true });
    }

    const messages = await channel.messages.fetch({ limit });

    let deletedMessages = [];
    switch (type) {
      case 'all':
        deletedMessages = messages;
        break;

      case 'normal':
        deletedMessages = messages.filter(msg => !msg.content.includes('http') && msg.attachments.size === 0);
        break;

      case 'links':
        deletedMessages = messages.filter(msg => msg.content.includes('http'));
        break;

      case 'files':
        deletedMessages = messages.filter(msg => msg.attachments.size > 0);
        break;

      default:
        return interaction.reply({ content: 'Invalid message type.', ephemeral: true });
    }

    try {
      await channel.bulkDelete(deletedMessages, true);

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Messages Cleaned')
        .setDescription(`Successfully deleted **${deletedMessages.size}** ${type} message(s).`)
        .setTimestamp();

      const reply = await interaction.reply({ embeds: [embed] });

      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (error) {
          console.error('Failed to delete reply:', error);
        }
      }, 4000);
    } catch (error) {
      console.error('Error deleting messages:', error);
      return interaction.reply({ 
        content: 'Failed to delete messages. Messages older than 14 days cannot be bulk deleted.', 
        ephemeral: true 
      });
    }
  },
};
