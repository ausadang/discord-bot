const { EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    try {
      console.log(`[Event] guildMemberAdd triggered for ${member.user.tag}`);
      
      // Get guild ID
      const guildId = member.guild.id;

      // Check logs database with guild-specific key
      const logsKey = `historyLogs_${guildId}`;
      const historyData = await db.get(logsKey) || {};
      console.log(`[guildMemberAdd] historyData for guild ${guildId}:`, JSON.stringify(historyData));
      
      const joinLeaveData = historyData['join-leave'] || { enabled: false, channel: 'None' };
      console.log('[guildMemberAdd] joinLeaveData:', JSON.stringify(joinLeaveData));

      // Check for auto-roles
      const autoRolesData = await db.get(`autoRoles_${guildId}`) || { enabled: false, roles: [] };
      if (autoRolesData.enabled && autoRolesData.roles.length > 0) {
        console.log(`[guildMemberAdd] Auto-roles enabled, attempting to add ${autoRolesData.roles.length} roles`);
        

        const bot = member.guild.members.me;
        if (!bot) {
          console.error('[guildMemberAdd] Could not get bot member object');
          return;
        }
        

        if (!bot.permissions.has('ManageRoles')) {
          console.error('[guildMemberAdd] Bot does not have Manage Roles permission');
          return;
        }
        
        const highestBotRole = bot.roles.highest.position;
        
        for (const roleId of autoRolesData.roles) {
          const role = member.guild.roles.cache.get(roleId);
          if (!role) {
            console.warn(`[guildMemberAdd] Role ${roleId} not found in guild`);
            continue;
          }
          

          if (role.position >= highestBotRole) {
            console.warn(`[guildMemberAdd] Cannot add role ${role.name} because it's higher than the bot's highest role`);
            continue;
          }
          
          try {
            await member.roles.add(role);
            console.log(`[guildMemberAdd] Added role ${role.name} to ${member.user.tag}`);
          } catch (error) {
            console.error(`[guildMemberAdd] Error adding role ${role.name}:`, error);
            
            if (error.code === 50013) { 
              console.error(`[guildMemberAdd] Missing permissions to add role ${role.name}. Role position: ${role.position}, Bot's highest role position: ${highestBotRole}`);
            }
          }
        }
      }

      if (joinLeaveData && joinLeaveData.enabled && joinLeaveData.channel && joinLeaveData.channel !== 'None') {
        const channelId = joinLeaveData.channel;
        console.log(`[guildMemberAdd] Using channel ID: ${channelId}`);
        
        const channel = member.guild.channels.cache.get(channelId);
        
        if (channel && channel.isTextBased()) {
          console.log(`[guildMemberAdd] Found channel: ${channel.name}`);

          const now = new Date();
          const dateString = now.toLocaleDateString('th-TH', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          const timeString = now.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit'
          });
          const dateTimeString = `${dateString}, ${timeString}`;
          const embed = new EmbedBuilder()
            .setDescription(`✅ **${member.user.tag}** joined the server.`)
            .setColor('#51ff54')
            .setFooter({ text: dateTimeString });
          
          await channel.send({ embeds: [embed] });
          console.log(`[guildMemberAdd] Successfully sent join message for ${member.user.tag}`);
        } else {
          console.log(`[guildMemberAdd] Channel is invalid or not found: ${channelId}`);
          const availableChannels = member.guild.channels.cache
            .filter(ch => ch.isTextBased())
            .map(ch => `${ch.name} (${ch.id})`)
            .join(', ');
            
          console.log(`[guildMemberAdd] Available text channels: ${availableChannels}`);
        }
      } else {
        console.log('[guildMemberAdd] Join/leave logging is not enabled or channel not set');
        console.log(`[guildMemberAdd] Enabled: ${joinLeaveData?.enabled}, Channel: ${joinLeaveData?.channel}`);
      }

      // Update counters if needed
      const countersKey = `counters_${member.guild.id}`;
      const countersData = await db.get(countersKey) || {};

      for (const [type, counterInfo] of Object.entries(countersData)) {
        if (counterInfo.enabled && (type === 'users' || type === 'bots' || type === 'all_members')) {
          try {
            // Update this counter
            const { updateCounter } = require('./ready');
            await updateCounter(member.guild, type, counterInfo);
          } catch (error) {
            console.error(`[guildMemberAdd] Error updating counter ${type}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('[guildMemberAdd] Error:', error);
    }
  },
}; 