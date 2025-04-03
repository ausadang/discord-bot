require('dotenv').config();
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { hasPermission } = require('../utils/permissionCheck');

const COLORS = {
  SUCCESS: process.env.COLOR_SUCCESS || '#51ff54',
  FAIL: process.env.COLOR_FAIL || '#ff5151',
  WARN: process.env.COLOR_WARN || '#fdff51',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('Configure logging channels for join/leave and voice events')
    .addStringOption(option =>
      option.setName('mode')
        .setDescription('Which logs to configure')
        .setRequired(true)
        .addChoices(
          { name: 'Join/Leave', value: 'join-leave' },
          { name: 'Voice Channels', value: 'voice' }
        )
    )
    .addStringOption(option =>
      option.setName('status')
        .setDescription('What to do with the logs')
        .setRequired(true)
        .addChoices(
          { name: 'Enable', value: 'enable' },
          { name: 'Disable', value: 'disable' },
          { name: 'Set Channel', value: 'set' },
          { name: 'List Settings', value: 'list' }
        )
    )
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to send logs to (required for "set" status)')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const mode = interaction.options.getString('mode');
      const status = interaction.options.getString('status');
      const channel = interaction.options.getChannel('channel');
      const member = interaction.guild.members.cache.get(interaction.user.id);
      const guildId = interaction.guild.id;

      // Check if user has the required permissions
      const requiredPermissions = [PermissionsBitField.Flags.ManageGuild];
      const hasRequiredPermission = await hasPermission(member, requiredPermissions);
      
      if (!hasRequiredPermission) {
        const embed = new EmbedBuilder()
          .setColor(COLORS.FAIL)
          .setTitle('Permission Denied')
          .setDescription('You need the "Manage Server" permission to use this command.');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Get existing data - now with server-specific key
      const logsKey = `historyLogs_${guildId}`;
      let historyData = await db.get(logsKey) || {};
      
      console.log(`[logs] Processing logs command for guild: ${guildId}, mode: ${mode}, status: ${status}`);
      console.log(`[logs] Current settings:`, JSON.stringify(historyData));
      
      // Initialize mode object if it doesn't exist
      if (!historyData[mode]) {
        historyData[mode] = {
          enabled: false,
          channel: 'None'
        };
      }

      let embed = new EmbedBuilder().setColor(COLORS.SUCCESS);

      switch (status) {
        case 'set':
          if (!channel) {
            embed.setColor(COLORS.WARN)
                 .setTitle('Missing Channel')
                 .setDescription('Please specify a channel when using the "set" status.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
          }

          if (!channel.isTextBased()) {
            embed.setColor(COLORS.FAIL)
                 .setTitle('Invalid Channel')
                 .setDescription('The channel must be a text channel.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
          }

          // Check if bot has permissions to send messages in the channel
          const permissions = channel.permissionsFor(interaction.guild.members.me);
          if (!permissions || !permissions.has(PermissionsBitField.Flags.SendMessages)) {
            embed.setColor(COLORS.WARN)
                 .setTitle('Permission Issue')
                 .setDescription(`I don't have permission to send messages in ${channel}. Please fix the channel permissions.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
          }

          // Update channel in database
          historyData[mode].channel = channel.id;
          await db.set(logsKey, historyData);
          
          console.log(`[logs] Updated ${mode} channel to ${channel.id} for guild ${guildId}`);
          
          embed.setTitle('Channel Set')
               .setDescription(`Logs for ${mode === 'join-leave' ? 'member joins/leaves' : 'voice channel activity'} will be sent to ${channel}.`)
               .setFooter({ text: `Current status: ${historyData[mode].enabled ? 'Enabled' : 'Disabled'}` });
          break;

        case 'enable':
          if (historyData[mode].channel === 'None') {
            embed.setColor(COLORS.WARN)
                 .setTitle('Channel Not Set')
                 .setDescription(`Please set a channel first using "/logs mode:${mode} status:set channel:#channel-name".`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
          }

          // Check if the channel still exists
          const targetChannel = interaction.guild.channels.cache.get(historyData[mode].channel);
          if (!targetChannel) {
            embed.setColor(COLORS.WARN)
                 .setTitle('Channel Not Found')
                 .setDescription(`The previously set channel no longer exists. Please set a new channel.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
          }

          historyData[mode].enabled = true;
          await db.set(logsKey, historyData);
          
          console.log(`[logs] Enabled ${mode} logs for guild ${guildId}`);
          
          embed.setTitle('Logs Enabled')
               .setDescription(`${mode === 'join-leave' ? 'Member join/leave' : 'Voice channel activity'} logs are now enabled in <#${historyData[mode].channel}>.`);
          break;

        case 'disable':
          historyData[mode].enabled = false;
          await db.set(logsKey, historyData);
          
          console.log(`[logs] Disabled ${mode} logs for guild ${guildId}`);
          
          embed.setColor(COLORS.FAIL)
               .setTitle('Logs Disabled')
               .setDescription(`${mode === 'join-leave' ? 'Member join/leave' : 'Voice channel activity'} logs are now disabled.`);
          break;

        case 'list':
          const channelText = historyData[mode].channel !== 'None' 
            ? `<#${historyData[mode].channel}>`
            : 'Not set';
            
          embed.setTitle('Log Settings')
               .setDescription(`**Mode:** ${mode === 'join-leave' ? 'Member Join/Leave' : 'Voice Channel Activity'}`)
               .addFields([
                 { name: 'Status', value: historyData[mode].enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
                 { name: 'Channel', value: channelText, inline: true },
               ]);
          break;

        default:
          embed.setColor(COLORS.WARN)
               .setTitle('Invalid Status')
               .setDescription('Please choose a valid status: enable, disable, set, or list.');
          break;
      }

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in logs command:', error);
      const embed = new EmbedBuilder()
        .setColor(COLORS.FAIL)
        .setTitle('Error')
        .setDescription('An error occurred while configuring logs.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
}; 