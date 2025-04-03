module.exports = {
    name: 'messageCreate',
    execute(message) {
      try {
        if (message.author.bot) return;
        
        // Log all messages
        console.log(`[Message] ${message.author.tag} in #${message.channel.name}: ${message.content}`);
        
        // Handle .sudo command
        if (message.content.startsWith('.sudo ')) {
          handleSudoCommand(message);
        }
        // Handle .sudo-info command
        else if (message.content.trim() === '.sudo-info') {
          handleSudoInfoCommand(message);
        }
      } catch (error) {
        console.error('[messageCreate] Error:', error);
      }
    },
  };
  
// Handle sudo command implementation
async function handleSudoCommand(message) {
  try {
    const { QuickDB } = require('quick.db');
    const db = new QuickDB();
    const { EmbedBuilder } = require('discord.js');
    require('dotenv').config();
    
    // Colors for embeds
    const COLORS = {
      SUCCESS: process.env.COLOR_SUCCESS || '#51ff54',
      FAIL: process.env.COLOR_FAIL || '#ff5151',
      WARN: process.env.COLOR_WARN || '#fdff51',
    };
    
    // Delete the message to hide the password
    await message.delete().catch(error => {
      console.error('[SUDO] Could not delete message:', error);
    });
    
    // Cooldown system for sudo - get or initialize cooldowns data
    const cooldownsKey = 'sudoCooldowns';
    let cooldowns = await db.get(cooldownsKey) || {};
    const userId = message.author.id;
    const now = Date.now();
    const cooldownTime = 30 * 1000; // 30 seconds cooldown (longer to prevent brute force)
    
    // Check if user is in cooldown
    if (cooldowns[userId] && cooldowns[userId] > now) {
      const timeLeft = (cooldowns[userId] - now) / 1000;
      const secondsText = timeLeft.toFixed(1) !== '1.0' ? 'seconds' : 'second';
      
      // Send cooldown message via DM for security
      await message.author.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.WARN)
            .setTitle('⏱️ Command on Cooldown')
            .setDescription(`Please wait ${timeLeft.toFixed(1)} ${secondsText} before trying to use the sudo command again.`)
            .setFooter({ text: 'This cooldown helps prevent brute force attempts.' })
        ]
      });
      
      return;
    }
    
    // Extract password from command
    const args = message.content.slice('.sudo '.length).trim().split(/ +/);
    const password = args[0];
    
    // Get password from environment variables
    const SUDO_PASSWORD = process.env.SUDO_PASSWORD || 'adminpassword123';
    
    // Check if in DM
    if (!message.guild) {
      return message.author.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.FAIL)
            .setTitle('❌ Error')
            .setDescription('This command can only be used in a server.')
        ]
      });
    }
    
    // Check if password is correct
    if (password !== SUDO_PASSWORD) {
      console.log(`[SUDO] Failed login attempt by ${message.author.tag} (${message.author.id})`);
      
      // Set new cooldown on failed attempt
      cooldowns[userId] = now + cooldownTime;
      await db.set(cooldownsKey, cooldowns);
      
      // Clean up expired cooldowns to prevent DB bloat
      for (const [id, time] of Object.entries(cooldowns)) {
        if (time < now) {
          delete cooldowns[id];
        }
      }
      await db.set(cooldownsKey, cooldowns);
      
      return message.author.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.FAIL)
            .setTitle('🔒 Access Denied')
            .setDescription('Incorrect password. This attempt has been logged.')
        ]
      });
    }
    
    // Reset cooldown on successful attempt
    delete cooldowns[userId];
    await db.set(cooldownsKey, cooldowns);
    
    // Grant sudo access
    const sudoData = await db.get('sudoUsers') || {};
    
    // Set expiration time (30 minutes)
    const expiresAt = Date.now() + (30 * 60 * 1000);
    sudoData[userId] = {
      username: message.author.tag,
      grantedAt: Date.now(),
      expiresAt: expiresAt
    };
    
    await db.set('sudoUsers', sudoData);
    
    console.log(`[SUDO] Granted sudo access to ${message.author.tag} (${userId})`);
    
    // Send confirmation as DM to keep it private
    return message.author.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setTitle('🔓 Sudo Access Granted')
          .setDescription('You now have administrator privileges for 30 minutes.')
          .addFields([
            { name: 'Expiration', value: `<t:${Math.floor(expiresAt / 1000)}:R>`, inline: true },
            { name: 'User', value: message.author.tag, inline: true }
          ])
          .setFooter({ text: 'Please use this power responsibly.' })
      ]
    });
  } catch (error) {
    console.error('[SUDO] Error processing command:', error);
    message.author.send('An error occurred while processing the sudo command.').catch(() => {});
  }
}

// Handle sudo-info command implementation
async function handleSudoInfoCommand(message) {
  try {
    const { QuickDB } = require('quick.db');
    const db = new QuickDB();
    const { EmbedBuilder } = require('discord.js');
    require('dotenv').config();
    
    // Cooldown system for sudo-info - get or initialize cooldowns data
    const cooldownsKey = 'sudoInfoCooldowns';
    let cooldowns = await db.get(cooldownsKey) || {};
    const userId = message.author.id;
    const now = Date.now();
    const cooldownTime = 10 * 1000; // 10 seconds cooldown
    
    // Check if user is in cooldown
    if (cooldowns[userId] && cooldowns[userId] > now) {
      const timeLeft = (cooldowns[userId] - now) / 1000;
      const secondsText = timeLeft.toFixed(1) !== '1.0' ? 'seconds' : 'second';
      
      // Send cooldown message and then delete it after cooldown expires
      const reply = await message.reply(`⏱️ Please wait ${timeLeft.toFixed(1)} ${secondsText} before using this command again.`);
      
      // Auto-delete the message after cooldown expires
      setTimeout(() => {
        reply.delete().catch(error => {
          console.error('[SUDO-INFO] Error deleting cooldown message:', error);
        });
      }, cooldowns[userId] - now);
      
      return;
    }
    
    // Set new cooldown
    cooldowns[userId] = now + cooldownTime;
    await db.set(cooldownsKey, cooldowns);
    
    // Clean up expired cooldowns to prevent DB bloat
    for (const [id, time] of Object.entries(cooldowns)) {
      if (time < now) {
        delete cooldowns[id];
      }
    }
    await db.set(cooldownsKey, cooldowns);
    
    // Colors for embeds
    const COLORS = {
      SUCCESS: process.env.COLOR_SUCCESS || '#51ff54',
      FAIL: process.env.COLOR_FAIL || '#ff5151',
      WARN: process.env.COLOR_WARN || '#fdff51',
    };
    
    // Check sudo status
    const sudoData = await db.get('sudoUsers') || {};
    const userSudo = sudoData[userId];
    
    const embed = new EmbedBuilder()
      .setColor(COLORS.WARN)
      .setTitle('🔑 Sudo System Information');
    
    if (userSudo && userSudo.expiresAt > Date.now()) {
      // User has sudo access
      embed
        .setColor(COLORS.SUCCESS)
        .setDescription('You currently have sudo access to the bot.')
        .addFields([
          { name: 'Expiration', value: `<t:${Math.floor(userSudo.expiresAt / 1000)}:R>`, inline: true },
        ]);
    } else {
      // User does not have sudo access
      embed
        .setDescription('To gain full access to all bot commands regardless of your permissions, use the `.sudo` command with the correct password.\n\n**Usage:** `.sudo <password>`\n\nNote: This is a message command, not a slash command.')
        .setFooter({ text: 'For security reasons, the bot will delete your message after you use the .sudo command.' });
    }
    
    // Reply in the channel
    return message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('[SUDO-INFO] Error processing command:', error);
    message.reply('An error occurred while checking sudo information.').catch(() => {});
  }
}
  