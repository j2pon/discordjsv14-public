const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const { CronJob } = require("cron");
const j2ponm = require("../../../../../../Global/Settings/System");
const moment = require('moment');
require('moment-duration-format');
const { MessageStat, VoiceStat, StreamerStat, CameraStat } = require("../../../../../../Global/Models");
const leaderboard = require('../../../../../../Global/Schemas/mainleaderboard');
const emojis = require("../../../../../../Global/Settings/Emojis.json");

module.exports = {
    name: "leaderboard",
    description: "Top 50 Haftalık Liderlik Tablolarını gönderir (Ses, Mesaj, Yayın, Kamera).",
    category: "OWNER",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["lb", "liderlik"],
        usage: ".leaderboard",
    },

    onLoad: function (client) {
        // weekly cron: every Monday at 00:05 Istanbul time
        try {
            const job = new CronJob("5 0 * * 1", async () => {
                client.guilds.cache.forEach(async (guild) => {
                    try {
                        const doc = await leaderboard.findOne({ guildID: guild.id }).lean();
                        const channelId = doc?.messageChannel || null;
                        const channel = channelId ? guild.channels.cache.get(channelId) : guild.systemChannel || guild.channels.cache.find(c => c.isTextBased && c.permissionsFor(guild.members.me).has('SendMessages'));
                        if (channel) await module.exports.generateAndPost(client, channel);
                    } catch (e) {
                        console.error("[Leaderboard Cron] error:", e?.message);
                    }
                });
            }, null, true, "Europe/Istanbul");
            job.start();
        } catch (e) {
            console.error("[Leaderboard] Cron setup failed:", e?.message);
        }
    },

    onCommand: async function (client, message, args) {
        await module.exports.generateAndPost(client, message.channel);
    },

    onSlash: async function (client, interaction) { },

    // Builds and posts/edits four categories of embeds; returns saved IDs
    generateAndPost: async function (client, channel) {
        if (!channel || !channel.guild) return;
        const guildId = channel.guild.id;

        const [voiceUsersData, messageUsersData, streamUsersData, cameraUsersData] = await Promise.all([
            VoiceStat.find({ guildID: guildId }).sort({ TotalStat: -1 }).limit(200).lean(),
            MessageStat.find({ guildID: guildId }).sort({ TotalStat: -1 }).limit(200).lean(),
            StreamerStat.find({ guildID: guildId }).sort({ TotalStat: -1 }).limit(200).lean(),
            CameraStat.find({ guildID: guildId }).sort({ TotalStat: -1 }).limit(200).lean(),
        ]);

        // .top komutundaki gibi TOTAL veriye göre sıralama yapıyoruz
        const takeTop = (arr, isTime) => {
            return arr
                .filter(x => {
                    const raw = (x.TotalStat ?? 0);
                    const value = isTime ? (Number(raw) || 0) : (Number(raw) || 0);
                    return value > 0 && channel.guild.members.resolve(x.userID);
                })
                .slice(0, 50);
        };
        const voiceUsers = takeTop(voiceUsersData, true);
        const messageUsers = takeTop(messageUsersData, false);
        const streamUsers = takeTop(streamUsersData, true);
        const cameraUsers = takeTop(cameraUsersData, true);

        const formatTime = (seconds) => {
            seconds = Number(seconds) || 0;
            if (seconds < 0) seconds = 0;

            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);

            // Saniye göstermiyoruz, sadece saat ve dakika.
            return `${hours} Saat, ${minutes} Dakika`;
        };

        // Voice/stream/camera süreleri sistemde milisaniye olarak tutuluyor.
        // Liderlik tablosunda okunabilir görünmesi için her zaman saniyeye çeviriyoruz.
        const msToSeconds = (ms) => {
            const n = Number(ms) || 0;
            return Math.floor(n / 1000);
        };

        const buildLines = async (list, isTime) => {
            const out = [];
            for (let i = 0; i < list.length; i++) {
                const x = list[i];
                const statRaw = (x.TotalStat ?? x.WeeklyStat ?? 0);
                const stat = isTime ? msToSeconds(statRaw) : (Number(statRaw) || 0);
                // try cache first then fetch to ensure correct display name
                let member = channel.guild.members.cache.get(x.userID);
                if (!member) {
                    try {
                        member = await channel.guild.members.fetch(x.userID).catch(() => null);
                    } catch {
                        member = null;
                    }
                }
                const mention = `<@${x.userID}>`;
                const value = isTime ? formatTime(stat) : (Number(stat).toLocaleString());
                let prefix = `${i + 1} -`;
                if (i === 0 && emojis.sayiEmoji_bir) prefix = `${emojis.sayiEmoji_bir}`;
                else if (i === 1 && emojis.sayiEmoji_iki) prefix = `${emojis.sayiEmoji_iki}`;
                else if (i === 2 && emojis.sayiEmoji_uc) prefix = `${emojis.sayiEmoji_uc}`;
                out.push(`${prefix} ${mention} : \`${value}\``);
            }
            return out;
        };

        const voiceLines = await buildLines(voiceUsers, true);
        const messageLines = await buildLines(messageUsers, false);
        const streamLines = await buildLines(streamUsers, true);
        const cameraLines = await buildLines(cameraUsers, true);

        // build single-embed per category (user requested no pagination/part 2)
        const makeEmbedSingle = (title, lines) => {
            let desc = lines.length ? lines.join("\n") : "Henüz veri yok.";
            if (desc.length > 4096) {
                desc = desc.slice(0, 4090) + "\n… (truncated)";
            }
            return new EmbedBuilder()
                .setTitle(title)
                .setColor(0x2F3136)
                .setDescription(desc)
                .setFooter({ text: `Güncellendi: ${new Date().toLocaleString()}` })
                .setTimestamp();
        };

        const embedsVoice = [makeEmbedSingle(`${emojis.server_star} **Ses Kanalı İstatistikleri (Top 50)**`, voiceLines)];
        const embedsMessage = [makeEmbedSingle(`${emojis.server_star} **Mesaj İstatistikleri (Top 50)**`, messageLines)];
        const embedsStream = [makeEmbedSingle(`${emojis.server_star} **Yayın İstatistikleri (Top 50)**`, streamLines)];
        const embedsCamera = [makeEmbedSingle(`${emojis.server_star} **Kamera İstatistikleri (Top 50)**`, cameraLines)];

        const doc = await leaderboard.findOne({ guildID: guildId }).lean();
        const resultIds = { messageListID: "", voiceListID: "", streamListID: "", cameraListID: "", messageChannel: channel.id };

        const sendOrEdit = async (existingId, embedArray) => {
            if (!embedArray || embedArray.length === 0) return "";
            const embed = embedArray[0];
            if (existingId) {
                try {
                    const msg = await channel.messages.fetch(existingId).catch(() => null);
                    if (msg) {
                        await msg.edit({ embeds: [embed] }).catch(() => {});
                        return msg.id;
                    }
                } catch {}
            }
            const sent = await channel.send({ embeds: [embed] }).catch(() => null);
            return sent ? sent.id : "";
        };

        resultIds.voiceListID = await sendOrEdit(doc?.voiceListID, embedsVoice);
        resultIds.messageListID = await sendOrEdit(doc?.messageListID, embedsMessage);
        resultIds.streamListID = await sendOrEdit(doc?.streamListID, embedsStream);
        resultIds.cameraListID = await sendOrEdit(doc?.cameraListID, embedsCamera);

        await leaderboard.findOneAndUpdate({ guildID: guildId }, { $set: resultIds }, { upsert: true });
        return resultIds;
    },
};
