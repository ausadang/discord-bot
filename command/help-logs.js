const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help-logs')
    .setDescription('Shows how to use the join/leave and voice channels logging system'),
  
  async execute(interaction) {
    try {
      const embed = new EmbedBuilder()
        .setColor('#51ff54')
        .setTitle('📝 Logging System Help')
        .setDescription('Here\'s how to set up and use the logging system for join/leave events and voice channel tracking.')
        .addFields([
          { 
            name: '🚪 Setting up Join/Leave logs', 
            value:
              '1. Select a channel for logs: `/logs mode:join-leave status:set channel:#channel-name`\n' +
              '2. Enable the system: `/logs mode:join-leave status:enable`\n' +
              '3. Check current settings: `/logs mode:join-leave status:list`'
          },
          { 
            name: '🔊 Setting up Voice Channel logs', 
            value:
              '1. Select a channel for logs: `/logs mode:voice status:set channel:#channel-name`\n' +
              '2. Enable the system: `/logs mode:voice status:enable`\n' +
              '3. Check current settings: `/logs mode:voice status:list`'
          },
          {
            name: '📊 Server Counters',
            value:
              '1. Create a counter: `/counter status:enable type:users method:text channel:#channel-name`\n' +
              '2. View all counters: `/counter status:list`\n' +
              '3. Disable a counter: `/counter status:disable type:users`\n\n' +
              'Available counter types: Text Channels, Voice Channels, Users, Bots, All Members, All Channels\n' +
              'Display methods: Text embed, Text channel name, Voice channel name'
          },
          { 
            name: '🔍 Troubleshooting', 
            value:
              '- Make sure the bot has permission to view and send messages in the specified channel.\n' +
              '- Use `/check-perms` to verify bot permissions and logging status.\n' +
              '- If logs aren\'t working, try restarting the bot.\n' +
              '- For permission issues, use the message command `.sudo <password>` to temporarily bypass all permission checks.'
          },
          {
            name: '👥 Auto-Roles Setup',
            value:
              '1. Add roles to auto-assign: `/auto-roles status:add roles:@Role1 @Role2`\n' +
              '2. Enable the system: `/auto-roles status:enable`\n' +
              '3. Check current settings: `/auto-roles status:list`'
          },
          {
            name: '🔑 Administrator Commands',
            value:
              '- `.sudo <password>` - Grant full admin access to all bot commands for 30 minutes\n' +
              '- `.sudo-info` - Check your current sudo status\n' +
              '- `/check-perms` - View detailed permission status and bot configuration\n' +
              '- Only users with Manage Server permission or active sudo can use configuration commands'
          },
          {
            name: '⚠️ Important Security Note',
            value:
              'The `.sudo` command will grant you full access to all bot commands, bypassing all permission checks. ' +
              'For security reasons, your message containing the sudo password will be automatically deleted. ' +
              'The bot will respond via DM to confirm sudo access.'
          }
        ])
        .setFooter({ text: 'Need more help? Contact the bot owner.' });

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in help-logs command:', error);
      return interaction.reply({ 
        content: 'An error occurred while displaying the help information.', 
        ephemeral: true 
      });
    }
  }
}; 