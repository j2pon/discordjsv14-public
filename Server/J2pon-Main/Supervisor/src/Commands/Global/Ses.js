const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const kanal = require("../../../../../../Global/Settings/AyarName");
const setup = require("../../../../../../Global/Settings/Setup.json");

module.exports = {
    name: "ses",
    description: "Sunucudaki ses istatistiklerini gösterir.",
    category: "STAT",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["voice"],
        usage: ".ses",
    },

    onLoad: function (client) { },

    onCommand: async function (client, message, args, byj2ponembed) {
        const allowedChannels = kanal.KomutKullanımKanalİsim;
        const isStaff =
            (setup.AuthRole && message.member.roles.cache.has(setup.AuthRole)) ||
            message.member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!isStaff || !allowedChannels.includes(message.channel.name)) {
            return message
                .reply({
                    content: `${client.emoji("server_carpi")} Bu komutu sadece yetkililer kullanabilir.`,
                })
                .then((e) => setTimeout(() => { e.delete(); }, 10000));
        }

        const allVoiceMembers = message.guild.members.cache.filter((m) => m.voice && m.voice.channel);

        const botMembers = allVoiceMembers.filter((m) => m.user.bot);
        const humanMembers = allVoiceMembers.filter((m) => !m.user.bot);

        const stageChannels = message.guild.channels.cache.filter(
            (c) => c.type === 13 && c.members.size > 0
        );
        const normalVoiceChannels = message.guild.channels.cache.filter(
            (c) => c.type === 2 && c.members.size > 0
        );

        const totalVoice = allVoiceMembers.size;
        const totalStage = stageChannels.reduce((acc, c) => acc + c.members.size, 0);
        const totalNormal = normalVoiceChannels.reduce((acc, c) => acc + c.members.size, 0);

        const onay = client.emoji("server_onay");
        const membersEmoji = client.emoji("server_members");
        const infoEmoji = client.emoji("server_info");

        const embed = new EmbedBuilder()
            .setColor("#2F3136")
            .setAuthor({
                name: message.guild.name,
                iconURL: message.guild.iconURL({ dynamic: true, size: 2048 }),
            })
            .setDescription(
                `${infoEmoji} **Sunucu Ses İstatistikleri**\n\n` +
                `${membersEmoji} Toplam seste üye: **${totalVoice}**\n` +
                `${onay} İnsan: **${humanMembers.size}** | Bot: **${botMembers.size}**\n` +
                `🔊 Normal ses kanalları: **${totalNormal}** kullanıcı\n` +
                `🎙️ Sahne kanalları: **${totalStage}** kullanıcı`
            )
            .setFooter({
                text: "J2pon was here ❤️",
            });

        message.reply({ embeds: [embed] }).catch(() => { });
    },
};

