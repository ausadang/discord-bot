# ChanomBot - Discord Utility Bot

A multipurpose Discord bot with logging, auto-roles, and administration features.

## Features

- **Logging System**: Log when users join or leave your server, and track voice channel activities
- **Auto-Roles**: Automatically assign roles to new members
- **Sudo Mode**: Grant full access to all bot commands with the `.sudo` command
- **Permission System**: Check bot and user permissions with detailed reports
- **Global Commands**: All commands work across every server the bot is in
- **Server Counters**: Display real-time server statistics in channel names or messages

## Setup

1. Clone this repository
2. Install dependencies with `npm install`
3. Create a `.env` file with your Discord bot token and other settings
4. Run the bot with `node index.js`

## Commands

### Sudo System
- `.sudo <password>` - Message command to gain full access to all bot commands for 30 minutes
- `.sudo-info` - Check your current sudo status
- `/check-perms` - Check your permissions and sudo status

### Logging System
- `/logs mode:join-leave status:set channel:#channel` - Set channel for join/leave logs
- `/logs mode:join-leave status:enable` - Enable join/leave logging
- `/logs mode:voice status:set channel:#channel` - Set channel for voice activity logs
- `/logs mode:voice status:enable` - Enable voice activity logging
- `/logs mode:[type] status:list` - Show current logging settings
- `/logs mode:[type] status:disable` - Disable specific logs

### Auto-Roles System
- `/auto-roles status:add roles:@Role1 @Role2` - Add roles to auto-assign
- `/auto-roles status:list` - Show currently assigned auto-roles
- `/auto-roles status:enable` - Enable auto-roles system
- `/auto-roles status:disable` - Disable auto-roles system
- `/auto-roles status:delete roles:@Role` - Remove role from auto-roles

### Counter System
- `/counter status:enable type:users method:text channel:#channel` - Create a counter for human users
- `/counter status:enable type:voice_channels method:title_voice channel:#voice-stats` - Create a voice channel counter
- `/counter status:list` - View all configured counters
- `/counter status:disable type:users` - Disable a specific counter

### Administration
- `/check-perms` - Check bot permissions and logging system status
- `/help-logs` - Display help for the logging system

## Environment Variables

Configure the following in your `.env` file:

```
TOKEN=your_discord_bot_token
CLIENT_ID=your_client_id
COLOR_SUCCESS=#51ff54
COLOR_FAIL=#ff5151
COLOR_WARN=#fdff51
SUDO_PASSWORD=your_secure_password
```

## Permissions

The bot requires the following permissions:
- View Channels
- Send Messages
- Manage Roles (for auto-roles)
- Read Message History
- Use External Emojis
- Manage Channels (for channel name counters)

## Security Note

The `.sudo` command is powerful and grants full access to all bot functions regardless of user permissions. Make sure to:
1. Set a strong password in your `.env` file
2. Only share the password with trusted administrators
3. Messages containing the sudo password are automatically deleted for security

## License

This project is licensed under the MIT License - see the LICENSE file for details.
