const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const kanal = require("../../../../../../Global/Settings/AyarName");
const setup = require("../../../../../../Global/Settings/Setup.json");

module.exports = {
    name: "sesdetay",
    description: "Sesteki üyeleri detaylı bir şekilde listeler.",
    category: "STAT",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["ses-detay", "voicedetay"],
        usage: ".sesdetay",
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

        const allVoiceMembers = message.guild.members.cache.filter(
            (m) => m.voice && m.voice.channel
        );

        if (!allVoiceMembers.size) {
            return message.reply({
                content: `${client.emoji("server_carpi")} Şu anda seste kimse yok.`,
            });
        }

        const onay = client.emoji("server_onay");
        const membersEmoji = client.emoji("server_members");
        const infoEmoji = client.emoji("server_info");

        // Kanala göre grupla
        const channelMap = new Map();
        for (const member of allVoiceMembers.values()) {
            const ch = member.voice.channel;
            if (!channelMap.has(ch.id)) {
                channelMap.set(ch.id, {
                    channel: ch,
                    members: [],
                });
            }
            channelMap.get(ch.id).members.push(member);
        }

        const lines = [];
        for (const { channel, members } of channelMap.values()) {
            const humanCount = members.filter((m) => !m.user.bot).length;
            const botCount = members.filter((m) => m.user.bot).length;

            lines.push(
                `🔊 ${channel} — **${members.length}** kişi (**${humanCount}** insan, **${botCount}** bot)`
            );
            lines.push(
                members
                    .map((m) => {
                        const flags = [];
                        if (m.voice.selfMute || m.voice.serverMute) flags.push("🔇");
                        if (m.voice.selfDeaf || m.voice.serverDeaf) flags.push("🔈");
                        if (!flags.length) flags.push("✅");
                        return `${flags.join("")} ${m}`;
                    })
                    .join(", ")
            );
            lines.push(""); // boş satır
        }

        const description = [
            `${infoEmoji} **Sunucu Ses Detayları**`,
            ``,
            `${membersEmoji} Toplam seste üye: **${allVoiceMembers.size}**`,
            ``,
            lines.join("\n"),
        ].join("\n");

        // Discord embed limitine göre kes
        const maxDesc = 4000;
        const finalDesc =
            description.length > maxDesc
                ? description.slice(0, maxDesc - 50) + "\n...\nListe kısaltıldı."
                : description;

        const embed = new EmbedBuilder()
            .setColor("#2F3136")
            .setAuthor({
                name: message.guild.name,
                iconURL: message.guild.iconURL({ dynamic: true, size: 2048 }),
            })
            .setDescription(finalDesc)
            .setFooter({
                text: "J2pon was here ❤️",
            });

        message.reply({ embeds: [embed] }).catch(() => { });
    },
};

