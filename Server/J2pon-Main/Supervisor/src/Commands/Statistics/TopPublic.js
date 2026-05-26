const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const kanal = require("../../../../../../Global/Settings/AyarName");
const setup = require("../../../../../../Global/Settings/Setup.json");
const { VoiceUserChannel } = require("../../../../../../Global/Models");
const moment = require("moment");
require("moment-duration-format");
moment.duration("hh:mm:ss").format();

module.exports = {
    name: "toppublic",
    description: "Public odalarda en çok vakit geçirenleri gösterir.",
    category: "STAT",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["publictop", "top-public"],
        usage: ".toppublic",
    },

    onLoad: function (client) { },

    onCommand: async function (client, message, args, byj2ponembed) {
        const allowedChannels = kanal.KomutKullanımKanalİsim;
        if (
            !message.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
            !allowedChannels.includes(message.channel.name)
        ) {
            return message
                .reply({
                    content: `${allowedChannels
                        .map((x) => `${client.channels.cache.find((chan) => chan.name == x)}`)
                        } kanallarında kullanabilirsiniz.`,
                })
                .then((e) => setTimeout(() => { e.delete(); }, 10000));
        }

        const publicCategories = Array.isArray(setup.PublicRoomsCategory)
            ? setup.PublicRoomsCategory
            : [setup.PublicRoomsCategory].filter(Boolean);

        if (!publicCategories.length) {
            return message.reply({
                content: "Public kategori ayarı bulunamadı.",
            });
        }

        const voiceChannelDocs = await VoiceUserChannel.find({ guildID: message.guild.id });

        const userPublicMap = new Map();

        for (const doc of voiceChannelDocs) {
            const channel = message.guild.channels.cache.get(doc.ChannelID);
            if (!channel || !channel.parentId) continue;
            if (!publicCategories.includes(channel.parentId)) continue;

            const prev = userPublicMap.get(doc.userID) || 0;
            userPublicMap.set(doc.userID, prev + (doc.ChannelData || 0));
        }

        const sorted = [...userPublicMap.entries()]
            .filter(([userId]) => message.guild.members.cache.has(userId))
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20);

        if (!sorted.length) {
            return message.reply({ content: "Public istatistik verisi bulunamadı." });
        }

        const lines = sorted.map(([userId, ms], index) => {
            const member = message.guild.members.cache.get(userId);
            const isAuthor = userId === message.author.id;
            const duration = moment.duration(ms).format("D [gün], H [saat], m [dakika]");
            return `${client.sayıEmoji(index + 1)} ${member ? member.toString() : `<@${userId}>`}: \`${duration}\`${isAuthor ? " **(Siz)**" : ""}`;
        });

        const embed = new EmbedBuilder()
            .setAuthor({
                name: message.guild.name,
                iconURL: message.guild.iconURL({ dynamic: true, size: 2048 }),
            })
            .setDescription(
                [
                    `Aşağıda **${message.guild.name}** sunucusunda public odalarda en çok vakit geçiren üyelerin sıralaması bulunmaktadır.\n`,
                    `**Public Top Sıralaması**`,
                    lines.join("\n"),
                ].join("\n")
            );

        message.reply({ embeds: [embed] }).catch(() => { });
    },
};

