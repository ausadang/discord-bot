const { QuickDB } = require('quick.db');
const db = new QuickDB();

async function checkAndFixLogsDatabase() {
  console.log('Starting logs database check and repair...');
  
  try {
    let historyData = await db.get('historyLogs');
    console.log('Current historyLogs data:', historyData);
    
    if (!historyData) {
      console.log('historyLogs not found in database, creating new...');
      historyData = {
        'voice': { enabled: false, channel: 'None' },
        'join-leave': { enabled: false, channel: 'None' }
      };
      await db.set('historyLogs', historyData);
      console.log('New historyLogs data created successfully');
    } else {
      if (!historyData.voice) {
        console.log('Voice data not found in database, creating new...');
        historyData.voice = { enabled: false, channel: 'None' };
      }
      if (!historyData['join-leave']) {
        console.log('Join-leave data not found in database, creating new...');
        historyData['join-leave'] = { enabled: false, channel: 'None' };
      }

      await db.set('historyLogs', historyData);
      console.log('historyLogs data repaired successfully');
    }
    console.log('historyLogs data after repair:', updatedData);
    console.log('\nTesting join-leave settings...');
    const joinLeave = updatedData['join-leave'];
    if (joinLeave) {
      console.log('Join-leave status:', joinLeave.enabled ? 'Enabled' : 'Disabled');
      console.log('Join-leave channel:', joinLeave.channel);
      
      if (joinLeave.channel === 'None' || !joinLeave.channel) {
        console.log('\nRecommendation: You have not set a channel for join-leave logs');
        console.log('Please use the command "/logs mode:join-leave status:set channel:#channel-name" to set the channel');
        console.log('Then use the command "/logs mode:join-leave status:enable" to enable it');
      } else if (!joinLeave.enabled) {
        console.log('\nRecommendation: Your join-leave has a channel but is not enabled');
        console.log('Please use the command "/logs mode:join-leave status:enable" to enable it');
      } else {
        console.log('\nRecommendation: Your join-leave is properly configured and enabled');
        console.log('If it still does not work, there might be issues with bot permissions or intents settings');
      }
    }
  } catch (error) {
    console.error('Error while checking and repairing database:', error);
  }
}

checkAndFixLogsDatabase(); 