const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Get detailed information about a user\'s profile')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user you want to check the profile for')
                .setRequired(false)),
    async execute(interaction) {

        const user = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id);
        const username = user.username;
        const userId = user.id;
        const roles = member.roles.cache
            .filter(role => role.name !== '@everyone')
            .map(role => role.name)
            .slice(0, 10)
            .join(', ') || 'No roles';
        const nickname = member.nickname || 'No nickname';
        const isBoosting = member.premiumSince ? 'Yes' : 'No';
        let userPermissions = 'Member';

        if (member.id === interaction.guild.ownerId) {
            userPermissions = 'Owner';
        } else if (member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            userPermissions = 'Administrator';
        }

        const joinedServer = moment(member.joinedAt).format('ddd MMM DD YYYY') + ` | ${moment(member.joinedAt).fromNow()}`;
        const accountCreated = moment(user.createdAt).format('ddd MMM DD YYYY') + ` | ${moment(user.createdAt).fromNow()}`;

        const embed = new EmbedBuilder()
            .setTitle(`${username}'s Profile`)
            .setDescription(`Here is the detailed information for ${username}.`)
            .setColor('#0099ff')
            .setThumbnail(user.avatarURL())
            .addFields(
                { name: 'Username', value: username, inline: true },
                { name: 'User ID', value: userId, inline: true },
                { name: `Roles [${member.roles.cache.size - 1}]`, value: `${roles}`, inline: false },
                { name: 'Nickname', value: nickname, inline: true },
                { name: 'Boosting', value: isBoosting, inline: true },
                { name: 'Global Permissions', value: userPermissions, inline: true },
                { name: 'Joined Server', value: joinedServer, inline: false },
                { name: 'Account Created', value: accountCreated, inline: false }
            )
            .setFooter({ text: 'User Information', iconURL: interaction.client.user.avatarURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
