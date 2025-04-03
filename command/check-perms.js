const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { QuickDB } = require('quick.db');
const { hasSudoPermission } = require('../utils/permissionCheck');
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('check-perms')
    .setDescription('Check bot permissions and logging system status'),

  async execute(interaction) {
    try {
      await interaction.deferReply();
      
      const embed = new EmbedBuilder()
        .setColor('#51ff54')
        .setTitle('Bot Permission Check')
        .setDescription('Checking permissions and system status...');

      // Get guild ID
      const guildId = interaction.guild.id;
      
      // Check if user has sudo permissions
      const userId = interaction.user.id;
      const hasSudo = await hasSudoPermission(userId);
      
      // Check bot's basic permissions
      const permissions = interaction.guild.members.me.permissions;
      const channel = interaction.channel;
      
      const hasViewChannel = permissions.has(PermissionsBitField.Flags.ViewChannel);
      const hasSendMessages = permissions.has(PermissionsBitField.Flags.SendMessages);
      const hasManageRoles = permissions.has(PermissionsBitField.Flags.ManageRoles);
      
      // Check channel permissions
      const channelPermissions = channel.permissionsFor(interaction.guild.members.me);
      const canSendInChannel = channelPermissions.has(PermissionsBitField.Flags.SendMessages);
      
      // Check intents
      const client = interaction.client;
      const hasGuildMembersIntent = client.options.intents.has('GuildMembers');
      const hasGuildMessagesIntent = client.options.intents.has('GuildMessages');
      
      // Get logging settings
      const logsKey = `historyLogs_${guildId}`;
      const historyLogs = await db.get(logsKey) || {};
      const joinLeaveStatus = historyLogs['join-leave'] || { enabled: false, channel: 'None' };
      const voiceStatus = historyLogs['voice'] || { enabled: false, channel: 'None' };
      
      // Get auto-roles settings
      const autoRolesData = await db.get(`autoRoles_${guildId}`) || { enabled: false, roles: [] };
      
      // Construct embed
      embed.setColor('#51ff54')
        .setTitle('Bot Status & Permission Check')
        .addFields([
          { name: '🔐 General Permissions', value: 
            `View Channels: ${hasViewChannel ? '✅' : '❌'}\n` +
            `Send Messages: ${hasSendMessages ? '✅' : '❌'}\n` +
            `Manage Roles: ${hasManageRoles ? '✅' : '❌'}\n` +
            `Can Send in Current Channel: ${canSendInChannel ? '✅' : '❌'}`, inline: false
          },
          { name: '🔄 Intents', value: 
            `Guild Members: ${hasGuildMembersIntent ? '✅' : '❌'}\n` +
            `Guild Messages: ${hasGuildMessagesIntent ? '✅' : '❌'}`, inline: false
          },
          { name: '📝 Join/Leave Logs', value: 
            `Status: ${joinLeaveStatus.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
            `Channel: ${joinLeaveStatus.channel !== 'None' ? `<#${joinLeaveStatus.channel}>` : 'Not set'}`, inline: true
          },
          { name: '🔊 Voice Logs', value: 
            `Status: ${voiceStatus.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
            `Channel: ${voiceStatus.channel !== 'None' ? `<#${voiceStatus.channel}>` : 'Not set'}`, inline: true
          },
          { name: '👥 Auto-Roles', value: 
            `Status: ${autoRolesData.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
            `Roles: ${autoRolesData.roles.length > 0 ? autoRolesData.roles.length + ' role(s) set' : 'None set'}`, inline: true
          }
        ]);
        
      // Add sudo information
      embed.addFields([
        { name: '🔑 Sudo Access', value: hasSudo ? 
        '✅ You have sudo access - full admin privileges!' : 
        '❌ Not active for you. Use `.sudo <password>` to gain full access.', inline: false }
      ]);
      
      // Add server-specific info
      embed.addFields([
        { name: '📊 Server Info', value: 
          `Server ID: ${guildId}\n` +
          `Your ID: ${userId}`, inline: false
        }
      ]);
      
      // Add sudo command info
      if (!hasSudo) {
        embed.addFields([
          { name: '🔐 Sudo Command Help', value: 
            'To bypass permission checks completely, use the message command:\n`.sudo <password>`\n\n' +
            'This will grant you full admin access to all bot commands for 30 minutes.\n\n' +
            'To check your sudo status, use the `.sudo-info` command.', inline: false
          }
        ]);
      }
      
      // Check for issues with join/leave channels
      if (joinLeaveStatus.enabled && joinLeaveStatus.channel !== 'None') {
        const joinLeaveChannel = interaction.guild.channels.cache.get(joinLeaveStatus.channel);
        if (!joinLeaveChannel) {
          embed.addFields([{ name: '⚠️ Warning', value: 'The specified join/leave channel does not exist!', inline: false }]);
        } else {
          const joinLeavePerms = joinLeaveChannel.permissionsFor(interaction.guild.members.me);
          if (!joinLeavePerms.has(PermissionsBitField.Flags.SendMessages)) {
            embed.addFields([{ name: '⚠️ Warning', value: `Bot cannot send messages in the join/leave channel <#${joinLeaveStatus.channel}>!`, inline: false }]);
          }
        }
      }
      
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in check-perms command:', error);
      await interaction.editReply({ content: 'An error occurred while checking permissions.' });
    }
  },
}; 