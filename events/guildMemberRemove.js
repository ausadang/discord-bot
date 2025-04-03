const { EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    try {
      console.log(`[Event] guildMemberRemove triggered for ${member.user.tag}`);
      
      // Get guild ID
      const guildId = member.guild.id;
      
      // Check logs database with guild-specific key
      const logsKey = `historyLogs_${guildId}`;
      const historyData = await db.get(logsKey) || {};
      console.log(`[guildMemberRemove] historyData for guild ${guildId}:`, JSON.stringify(historyData));
      
      const joinLeaveData = historyData['join-leave'] || { enabled: false, channel: 'None' };
      console.log('[guildMemberRemove] joinLeaveData:', JSON.stringify(joinLeaveData));
      
      if (joinLeaveData && joinLeaveData.enabled && joinLeaveData.channel && joinLeaveData.channel !== 'None') {
        const channelId = joinLeaveData.channel;
        console.log(`[guildMemberRemove] Using channel ID: ${channelId}`);
        
        const channel = member.guild.channels.cache.get(channelId);
        
        if (channel && channel.isTextBased()) {
          console.log(`[guildMemberRemove] Found channel: ${channel.name}`);
          
          // Get current date and time
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
          
          // Create embed message
          const embed = new EmbedBuilder()
            .setDescription(`❌ **${member.user.tag}** left the server.`)
            .setColor('#ff5151')
            .setFooter({ text: dateTimeString });
          
          await channel.send({ embeds: [embed] });
          console.log(`[guildMemberRemove] Successfully sent leave message for ${member.user.tag}`);
        } else {
          console.log(`[guildMemberRemove] Channel is invalid or not found: ${channelId}`);
          
          // Check if this channel exists in the server
          const availableChannels = member.guild.channels.cache
            .filter(ch => ch.isTextBased())
            .map(ch => `${ch.name} (${ch.id})`)
            .join(', ');
            
          console.log(`[guildMemberRemove] Available text channels: ${availableChannels}`);
        }
      } else {
        console.log('[guildMemberRemove] Join/leave logging is not enabled or channel not set');
        console.log(`[guildMemberRemove] Enabled: ${joinLeaveData?.enabled}, Channel: ${joinLeaveData?.channel}`);
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
            console.error(`[guildMemberRemove] Error updating counter ${type}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('[guildMemberRemove] Error:', error);
    }
  },
}; 