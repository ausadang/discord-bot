const { QuickDB } = require('quick.db');
const db = new QuickDB();

/**
 * Checks if a user has sudo permissions
 * @param {string} userId - Discord user ID to check
 * @returns {Promise<boolean>} - Whether the user has sudo permissions
 */
async function hasSudoPermission(userId) {
  try {
    // Get sudo users data
    const sudoData = await db.get('sudoUsers') || {};
    
    // Check if user exists in sudo data
    if (!sudoData[userId]) {
      return false;
    }
    
    // Check if sudo access has expired
    const userData = sudoData[userId];
    const now = Date.now();
    
    if (now > userData.expiresAt) {
      // Sudo access expired - clean up database entry
      delete sudoData[userId];
      await db.set('sudoUsers', sudoData);
      return false;
    }
    
    // User has valid sudo access
    return true;
  } catch (error) {
    console.error('[permissionCheck] Error checking sudo permission:', error);
    return false;
  }
}

/**
 * Checks if a user has permission to execute a command based on their roles or sudo access
 * @param {object} member - Discord.js GuildMember object
 * @param {string[]} requiredPermissions - Array of required permission flag names
 * @returns {Promise<boolean>} - Whether the user has permission
 */
async function hasPermission(member, requiredPermissions) {
  try {
    // If no permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }
    
    // First check if user has sudo access (overrides normal permissions)
    const hasSudo = await hasSudoPermission(member.id);
    if (hasSudo) {
      return true;
    }
    
    // If not sudo, check regular permissions
    for (const permission of requiredPermissions) {
      if (!member.permissions.has(permission)) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('[permissionCheck] Error checking permissions:', error);
    return false;
  }
}

module.exports = {
  hasSudoPermission,
  hasPermission
}; 