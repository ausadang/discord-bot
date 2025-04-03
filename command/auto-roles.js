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
const WARN_MESSAGES = {
  TAG_NOT_FOUND: process.env.WARN_TAG_NOT_FOUND || '⚠️ Please tag a role.',
  USER_INVALID: process.env.WARN_USER_INVALID || '⚠️ The specified user is invalid.',
  NOT_NUMBER: process.env.WARN_NOT_NUMBER || '⚠️ Please enter a valid number.',
  TAG_YOURSELF: process.env.WARN_TAG_YOURSELF || '⚠️ Do not tag yourself.',
  TAG_OTHER: process.env.WARN_TAG_OTHER || '⚠️ Do not tag other users.',
  NO_PERMISSION: process.env.ERR_NO_PERMISSION || '❌ You do not have permission to use this command.',
  WAIT_TIME: process.env.ERR_WAIT_TIME || '🕐 Please wait before using this command again.',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('auto-roles')
    .setDescription('Manage automatic roles for new members')
    .addStringOption(option =>
      option.setName('status')
        .setDescription('Action to perform (add, delete, list, enable, disable)')
        .setRequired(true)
        .addChoices(
          { name: 'add', value: 'add' },
          { name: 'delete', value: 'delete' },
          { name: 'list', value: 'list' },
          { name: 'enable', value: 'enable' },
          { name: 'disable', value: 'disable' }
        )
    )
    .addStringOption(option =>
      option.setName('roles')
        .setDescription('Roles to add/delete (mention roles with @role)')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const status = interaction.options.getString('status');
      const rolesInput = interaction.options.getString('roles');
      const member = interaction.guild.members.cache.get(interaction.user.id);
      const bot = interaction.guild.members.me;

      // ตรวจสอบว่าผู้ใช้มีสิทธิ์ ManageRoles หรือเป็น sudo user
      const hasRequiredPermission = await hasPermission(member, [PermissionsBitField.Flags.ManageRoles]);
      
      if (!hasRequiredPermission) {
        const embed = new EmbedBuilder()
          .setColor(COLORS.FAIL)
          .setTitle('🚫 Permission Denied')
          .setDescription(WARN_MESSAGES.NO_PERMISSION);
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Check if bot has Manage Roles permission
      if (!bot.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        const embed = new EmbedBuilder()
          .setColor(COLORS.FAIL)
          .setTitle('❌ Bot Permission Error')
          .setDescription('I do not have the "Manage Roles" permission in this server. Please give me this permission to use auto-roles.');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Make sure to use the guild ID consistently
      const guildId = interaction.guild.id;
      console.log(`Processing auto-roles for guild: ${guildId}`);
      
      let autoRolesData = await db.get(`autoRoles_${guildId}`) || { enabled: false, roles: [] };
      console.log(`Current auto-roles data: ${JSON.stringify(autoRolesData)}`);
      
      // Extract role IDs from mentions
      let roleIds = [];
      if (rolesInput) {
        const roleMatches = rolesInput.match(/<@&(\d+)>/g);
        if (roleMatches) {
          roleIds = roleMatches.map(match => match.replace(/<@&|>/g, ''));
        }
      }

      let embed = new EmbedBuilder().setColor(COLORS.WARN);

      switch (status) {
        case 'add':
          if (roleIds.length === 0) {
            embed.setColor(COLORS.WARN)
                .setTitle('⚠️ Missing Role')
                .setDescription('Please mention one or more roles using @role');
            return interaction.reply({ embeds: [embed], ephemeral: true });
          }

          // Check if roles exist and bot has permission to assign them
          const invalidRoles = [];
          const highRoles = [];
          for (const roleId of roleIds) {
            const role = interaction.guild.roles.cache.get(roleId);
            if (!role) {
              invalidRoles.push(roleId);
              continue;
            }
            
            if (role.position >= bot.roles.highest.position) {
              highRoles.push(role.name);
              continue;
            }
          }
          
          if (invalidRoles.length > 0) {
            embed.setColor(COLORS.WARN)
                .setTitle('⚠️ Invalid Roles')
                .setDescription(`The following roles could not be found: ${invalidRoles.join(', ')}`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
          }

          if (highRoles.length > 0) {
            embed.setColor(COLORS.WARN)
                .setTitle('⚠️ Permission Error')
                .setDescription(`The following roles cannot be added because they are higher than my highest role: ${highRoles.join(', ')}.\n\nPlease move my role above these roles in the server settings.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
          }

          let addedRoles = [];
          roleIds.forEach(roleId => {
            const role = interaction.guild.roles.cache.get(roleId);
            if (role && role.position < bot.roles.highest.position && !autoRolesData.roles.includes(roleId)) {
              autoRolesData.roles.push(roleId);
              addedRoles.push(`<@&${roleId}>`);
            }
          });

          if (addedRoles.length === 0) {
            embed.setColor(COLORS.WARN)
                .setTitle('⚠️ No New Roles Added')
                .setDescription('All the roles you specified are already in the auto-roles list.')
                .setFooter({ text: `Auto-roles is currently ${autoRolesData.enabled ? 'enabled' : 'disabled'}` });
            return interaction.reply({ embeds: [embed], ephemeral: true });
          }

          await db.set(`autoRoles_${guildId}`, autoRolesData);
          console.log(`Updated auto-roles: ${JSON.stringify(autoRolesData)}`);
          
          embed.setColor(COLORS.SUCCESS)
              .setTitle('✅ Role(s) Added')
              .setDescription(`Added roles: ${addedRoles.join(', ')}`)
              .setFooter({ text: `Auto-roles is currently ${autoRolesData.enabled ? 'enabled' : 'disabled'}` });
          return interaction.reply({ embeds: [embed] });

        case 'delete':
          if (roleIds.length === 0) {
            embed.setColor(COLORS.WARN)
                .setTitle('⚠️ Missing Role')
                .setDescription('Please mention one or more roles using @role');
            return interaction.reply({ embeds: [embed], ephemeral: true });
          }

          const removedRoles = [];
          roleIds.forEach(roleId => {
            if (autoRolesData.roles.includes(roleId)) {
              autoRolesData.roles = autoRolesData.roles.filter(id => id !== roleId);
              const role = interaction.guild.roles.cache.get(roleId);
              removedRoles.push(role ? `<@&${roleId}>` : `Unknown Role (${roleId})`);
            }
          });

          await db.set(`autoRoles_${guildId}`, autoRolesData);
          console.log(`Updated auto-roles after deletion: ${JSON.stringify(autoRolesData)}`);
          
          embed.setColor(COLORS.FAIL)
              .setTitle('🗑️ Role(s) Removed')
              .setDescription(`Removed roles: ${removedRoles.length > 0 ? removedRoles.join(', ') : 'None of the specified roles were in the auto-roles list'}`)
              .setFooter({ text: `Auto-roles is currently ${autoRolesData.enabled ? 'enabled' : 'disabled'}` });
          return interaction.reply({ embeds: [embed] });

        case 'list':
          if (autoRolesData.roles.length === 0) {
            embed.setColor(COLORS.WARN)
                .setTitle('📋 Auto Roles List')
                .setDescription(`No roles are set for auto-assignment.`)
                .setFooter({ text: `Auto-roles is currently ${autoRolesData.enabled ? 'enabled' : 'disabled'}` });
          } else {
            const rolesList = [];
            const inaccessibleRoles = [];
            
            for (const roleId of autoRolesData.roles) {
              const role = interaction.guild.roles.cache.get(roleId);
              if (!role) {
                rolesList.push(`Unknown Role (${roleId})`);
              } else if (role.position >= bot.roles.highest.position) {
                inaccessibleRoles.push(`<@&${roleId}> (Too high for bot to assign)`);
              } else {
                rolesList.push(`<@&${roleId}>`);
              }
            }
            
            let description = `Roles that will be automatically assigned to new members:\n${rolesList.join(', ')}`;
            
            if (inaccessibleRoles.length > 0) {
              description += `\n\n⚠️ **Cannot assign these roles** (move bot's role higher in server settings):\n${inaccessibleRoles.join(', ')}`;
            }
            
            embed.setColor(COLORS.SUCCESS)
                .setTitle('📋 Auto Roles List')
                .setDescription(description)
                .setFooter({ text: `Auto-roles is currently ${autoRolesData.enabled ? 'enabled' : 'disabled'}` });
          }
          return interaction.reply({ embeds: [embed] });

        case 'enable':
          if (autoRolesData.roles.length === 0) {
            embed.setColor(COLORS.WARN)
                .setTitle('⚠️ No Roles Set')
                .setDescription('You need to add roles first using `/auto-roles add @role`');
            return interaction.reply({ embeds: [embed], ephemeral: true });
          }
          
          // Check for roles that are too high
          const unassignableRoles = [];
          for (const roleId of autoRolesData.roles) {
            const role = interaction.guild.roles.cache.get(roleId);
            if (role && role.position >= bot.roles.highest.position) {
              unassignableRoles.push(role.name);
            }
          }
          
          autoRolesData.enabled = true;
          await db.set(`autoRoles_${guildId}`, autoRolesData);
          console.log(`Auto-roles enabled: ${JSON.stringify(autoRolesData)}`);
          
          const roleNames = autoRolesData.roles.map(roleId => {
            const role = interaction.guild.roles.cache.get(roleId);
            return role ? `<@&${roleId}>` : `Unknown Role (${roleId})`;
          }).join(', ');
          
          let description = `Auto-roles have been **enabled**. New members will automatically receive these roles:\n${roleNames}`;
          
          if (unassignableRoles.length > 0) {
            description += `\n\n⚠️ **Warning**: The following roles may not be assignable because they are positioned above my highest role: ${unassignableRoles.join(', ')}.\n\nPlease move my role higher in the server settings to fix this issue.`;
            embed.setColor(COLORS.WARN);
          } else {
            embed.setColor(COLORS.SUCCESS);
          }
          
          embed.setTitle('✅ Auto-Roles Enabled')
               .setDescription(description);
          return interaction.reply({ embeds: [embed] });

        case 'disable':
          autoRolesData.enabled = false;
          await db.set(`autoRoles_${guildId}`, autoRolesData);
          console.log(`Auto-roles disabled: ${JSON.stringify(autoRolesData)}`);
          
          embed.setColor(COLORS.FAIL)
              .setTitle('❌ Auto-Roles Disabled')
              .setDescription('Auto-roles have been **disabled**. New members will not receive roles automatically.');
          return interaction.reply({ embeds: [embed] });

        default:
          embed.setColor(COLORS.WARN)
              .setTitle('⚠️ Invalid Command')
              .setDescription('Please choose from `add`, `delete`, `list`, `enable`, or `disable`.');
          return interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      console.error('Error in auto-roles command:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor(COLORS.FAIL)
        .setTitle('❌ Error')
        .setDescription('An error occurred while processing the command. Please try again later.');
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};

// Add this to events/guildMemberAdd.js to make auto-roles work:
/*
// Check for auto-roles
const autoRolesData = await db.get(`autoRoles_${member.guild.id}`) || { enabled: false, roles: [] };
if (autoRolesData.enabled && autoRolesData.roles.length > 0) {
  console.log(`[guildMemberAdd] Auto-roles enabled, attempting to add ${autoRolesData.roles.length} roles`);
  
  for (const roleId of autoRolesData.roles) {
    const role = member.guild.roles.cache.get(roleId);
    if (role) {
      try {
        await member.roles.add(role);
        console.log(`[guildMemberAdd] Added role ${role.name} to ${member.user.tag}`);
      } catch (error) {
        console.error(`[guildMemberAdd] Error adding role ${role.name}:`, error);
      }
    } else {
      console.warn(`[guildMemberAdd] Role ${roleId} not found in guild`);
    }
  }
}
*/
