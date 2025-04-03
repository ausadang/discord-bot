const { EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    try {
      // Get guild ID
      const guildId = newState.guild.id || oldState.guild.id;
      
      // Check logs database with guild-specific key
      const logsKey = `historyLogs_${guildId}`;
      const historyData = await db.get(logsKey) || {};
      const voiceData = historyData['voice'] || { enabled: false, channel: 'None' };
      
      // If voice logging is not enabled, return
      if (!voiceData.enabled || voiceData.channel === 'None') {
        return;
      }
      
      const logsChannel = newState.guild.channels.cache.get(voiceData.channel);
      
      // If the logs channel doesn't exist or is not a text channel, return
      if (!logsChannel || !logsChannel.isTextBased()) {
        return;
      }
      
      const member = newState.member;
      const oldChannel = oldState.channel;
      const newChannel = newState.channel;
      
      // Get current date and time
      const now = new Date();
      const dateTimeString = now.toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // User joined a voice channel
      if (!oldChannel && newChannel) {
        const embed = new EmbedBuilder()
          .setColor('#51ff54')
          .setDescription(`🔊 **${member.user.tag}** joined **${newChannel.name}**`)
          .setFooter({ text: dateTimeString });
          
        await logsChannel.send({ embeds: [embed] });
      }
      
      // User left a voice channel
      else if (oldChannel && !newChannel) {
        const embed = new EmbedBuilder()
          .setColor('#ff5151')
          .setDescription(`🔇 **${member.user.tag}** left **${oldChannel.name}**`)
          .setFooter({ text: dateTimeString });
          
        await logsChannel.send({ embeds: [embed] });
      }
      
      // User switched voice channels
      else if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
        const embed = new EmbedBuilder()
          .setColor('#00e1ff')
          .setDescription(`🔄 **${member.user.tag}** moved from **${oldChannel.name}** to **${newChannel.name}**`)
          .setFooter({ text: dateTimeString });
          
        await logsChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('[voiceStateUpdate] Error:', error);
    }
  },
};
