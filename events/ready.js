const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { ChannelType, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'ready',
  execute(client) {
    console.log(`Logged in as ${client.user.tag}`);
    
    // Set up counter update interval 
    setupCounterUpdates(client);
  },
};

async function setupCounterUpdates(client) {
  // Update counters every 5 minutes
  setInterval(async () => {
    try {
      // Get all the guilds the bot is in
      for (const guild of client.guilds.cache.values()) {
        const guildId = guild.id;
        const countersKey = `counters_${guildId}`;
        
        // Get counters data for this guild
        const countersData = await db.get(countersKey) || {};
        
        for (const [type, counterInfo] of Object.entries(countersData)) {
          if (counterInfo.enabled) {
            try {
              // Update this counter
              await updateCounter(guild, type, counterInfo);
            } catch (error) {
              console.error(`Error updating counter ${type} for guild ${guildId}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in counter update interval:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes in milliseconds
  
  console.log('Counter update interval scheduled');
}

// Function to update a counter based on its configuration
async function updateCounter(guild, type, counterInfo) {
  try {
    if (!counterInfo.enabled) return;
    
    const COLORS = {
      SUCCESS: process.env.COLOR_SUCCESS || '#51ff54',
      FAIL: process.env.COLOR_FAIL || '#ff5151',
      WARN: process.env.COLOR_WARN || '#fdff51',
    };
    
    // Get the current count based on type
    let count = 0;
    switch (type) {
      case 'text_channels':
        count = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
        break;
      case 'voice_channels':
        count = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
        break;
      case 'users':
        count = guild.members.cache.filter(m => !m.user.bot).size;
        break;
      case 'bots':
        count = guild.members.cache.filter(m => m.user.bot).size;
        break;
      case 'all_members':
        count = guild.memberCount;
        break;
      case 'all_channels':
        count = guild.channels.cache.size;
        break;
    }
    
    // Update the counter based on method
    const channel = guild.channels.cache.get(counterInfo.channel);
    if (!channel) return;
    
    const typeLabel = getTypeName(type);
    
    switch (counterInfo.method) {
      case 'text':
        // Send an embed message
        const embed = new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setTitle('Count')
          .setDescription(`**Type:** ${typeLabel}\n**Count:** ${count}`)
          .setTimestamp();
        
        // Try to send as a new message, if fails try to update the last one
        try {
          // Fetch recent messages to see if we have a counter message
          const messages = await channel.messages.fetch({ limit: 10 });
          const botMessages = messages.filter(m => 
            m.author.id === guild.client.user.id && 
            m.embeds.length > 0 && 
            m.embeds[0].title === 'Count' &&
            m.embeds[0].description.includes(`Type: ${typeLabel}`)
          );
          
          if (botMessages.size > 0) {
            await botMessages.first().edit({ embeds: [embed] });
          } else {
            await channel.send({ embeds: [embed] });
          }
        } catch (error) {
          console.error(`Error updating text counter for ${type}:`, error);
        }
        break;
        
      case 'title_text':
      case 'title_voice':
        // Update channel name
        try {
          await channel.setName(`${typeLabel}: ${count}`);
        } catch (error) {
          console.error(`Error updating channel name counter for ${type}:`, error);
        }
        break;
    }
  } catch (error) {
    console.error(`Error updating counter for ${type}:`, error);
  }
}

// Helper function to get a friendly name for the counter type
function getTypeName(type) {
  const typeNames = {
    'text_channels': 'Text Channels',
    'voice_channels': 'Voice Channels',
    'users': 'Human Users',
    'bots': 'Bots',
    'all_members': 'All Members',
    'all_channels': 'All Channels'
  };
  return typeNames[type] || type;
}
