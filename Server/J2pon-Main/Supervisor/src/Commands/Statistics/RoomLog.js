const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const voiceLogs = require("../../../../../../Global/Schemas/voiceLogs");
const moment = require("moment");
require("moment-duration-format");

module.exports = {
    name: "roomlog",
    description: "Kullanıcının ses kanalı geçmişini gösterir.",
    category: "ADMIN",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["ses-log", "seslog"],
        usage: ".roomlog <@user>",
    },

    onLoad: function (client) { },

    onCommand: async function (client, message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply({ content: "Bu komutu kullanmak için yetkiniz olmalı." });
        }

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        
        const logs = await voiceLogs.find({ guildID: message.guild.id, userID: member.id }).sort({ date: -1 }).limit(15);

        if (logs.length === 0) {
            return message.reply({ content: `${member} kullanıcısı için ses kaydı bulunamadı.` });
        }

        const typeLabels = {
            "JOIN": "Giriş Yaptı",
            "LEAVE": "Ayrıldı",
            "MOVE": "Taşındı",
            "MUTE": "Susturdu",
            "UNMUTE": "Susturma Kaldırdı",
            "DEAF": "Sağırlaştırdı",
            "UNDEAF": "Sağırlaştırma Kaldırdı",
            "STREAM-START": "Yayın Açtı",
            "STREAM-STOP": "Yayın Kapattı",
            "CAMERA-START": "Kamera Açtı",
            "CAMERA-STOP": "Kamera Kapattı"
        };

        const embed = new EmbedBuilder()
            .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
            .setTitle("Ses Kanal Geçmişi (Son 15 Kayıt)")
            .setColor("Random")
            .setDescription(logs.map(log => {
                const date = `<t:${Math.floor(log.date / 1000)}:R>`;
                const channel = `<#${log.channelID}>`;
                const oldChannel = log.oldChannelID ? `<#${log.oldChannelID}>` : "";
                
                let text = `**[${typeLabels[log.type] || log.type}]** ${channel} ${date}`;
                if (log.type === "MOVE") {
                    text = `**[${typeLabels[log.type]}]** ${oldChannel} ➡ ${channel} ${date}`;
                }
                return text;
            }).join("\n"))
            .setFooter({ text: `${message.author.tag} tarafından istendi.`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
}
