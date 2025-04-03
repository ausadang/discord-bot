const fs = require('fs');
const path = require('path');

// Check event file structure
console.log('Starting event files check...');

const eventDir = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventDir).filter(file => file.endsWith('.js'));

console.log(`Found ${eventFiles.length} event files:`, eventFiles);

// Check each event file
eventFiles.forEach(file => {
  try {
    const eventPath = path.join(eventDir, file);
    const event = require(eventPath);
    
    console.log(`\nChecking file: ${file}`);
    console.log(`Event name: ${event.name}`);
    
    if (typeof event.execute !== 'function') {
      console.error(`❌ Error: execute function not found in ${file}`);
    } else {
      console.log(`✅ execute function found`);
    }
    
    // Additional checks for guildMemberAdd and guildMemberRemove
    if (event.name === 'guildMemberAdd' || event.name === 'guildMemberRemove') {
      console.log(`  Additional checks for ${event.name}:`);
      
      // Check for QuickDB import
      const content = fs.readFileSync(eventPath, 'utf-8');
      if (!content.includes('QuickDB')) {
        console.error(`  ❌ QuickDB import not found in ${file}`);
      } else {
        console.log(`  ✅ QuickDB import found`);
      }
      
      if (!content.includes('historyLogs')) {
        console.error(`  ❌ historyLogs usage not found in ${file}`);
      } else {
        console.log(`  ✅ historyLogs usage found`);
      }
      
      if (!content.includes('join-leave')) {
        console.error(`  ❌ join-leave usage not found in ${file}`);
      } else {
        console.log(`  ✅ join-leave usage found`);
      }
    }
  } catch (error) {
    console.error(`❌ Error loading file ${file}:`, error);
  }
});

// Check if correct intents are set in index.js
try {
  const indexContent = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf-8');
  console.log('\nChecking intents in index.js:');
  
  if (!indexContent.includes('GuildMembers')) {
    console.error('❌ GuildMembers intent not found in index.js');
  } else {
    console.log('✅ GuildMembers intent found');
  }
  
  if (!indexContent.includes('GuildMessages')) {
    console.error('❌ GuildMessages intent not found in index.js');
  } else {
    console.log('✅ GuildMessages intent found');
  }
} catch (error) {
  console.error('❌ Error checking index.js:', error);
}

console.log('\nCheck completed');
console.log('If any errors were found, please fix them according to the recommendations and restart the bot'); 