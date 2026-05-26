const moment = require("moment");
moment.locale("tr");
const { Events, PermissionsBitField, AuditLogEvent } = require("discord.js");
const client = global.client;
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const j2poncik = require("../../../../../../Global/Settings/System");
const Penal = require("../../../../../../Global/Schemas/penals");
const ms = require("ms");
const ceza = require("../../../../../../Global/Schemas/ceza");
const cezapuan = require("../../../../../../Global/Schemas/cezapuan");
const { EmbedBuilder } = require("discord.js");

// Limit takibi için Map
const voiceMuteGuardLimit = new Map();

// Limit kontrolü ve jail işlemi için ortak fonksiyon
async function checkLimitAndJail(guild, executor, actionType) {
    if (!executor || executor.id === client.user.id) return;
    
    const executorMember = await guild.members.fetch(executor.id).catch(() => null);
    if (!executorMember) return;
    
    // Executor'ın istisna olup olmadığını kontrol et
    const executorIsException = 
        executorMember.permissions.has(PermissionsBitField.Flags.Administrator) ||
        j2ponm.RolePanelRoles.some(x => executorMember.roles.cache.has(x)) ||
        j2ponm.SponsorRoles.some(x => executorMember.roles.cache.has(x)) ||
        executorMember.roles.cache.has(j2ponm.TaggedRole);

    if (executorIsException) return;

    // Limit kontrolü
    const currentCount = voiceMuteGuardLimit.get(executor.id) || 0;
    const limit = j2poncik.Mainframe.voicemuteguardlimit || 10;

    if (currentCount >= limit) {
        // Limiti aştı, jaille
        try {
            const jailRoles = j2ponm.JailedRoles;
            const jailDuration = ms("3h"); // 3 saat
            const reason = "Manuel ses susturma/sağırlaştırma işlemi limiti aşımı";

            // Jail rollerini ver
            executorMember.roles.cache.has(j2ponm.BoosterRole) 
                ? executorMember.roles.set([j2ponm.BoosterRole, jailRoles[0]])
                : executorMember.roles.set(jailRoles);

            // Ceza kaydı oluştur
            const penal = await client.penalize(
                guild.id, 
                executor.id, 
                'Jail', 
                true, 
                client.user.id, 
                reason, 
                true, 
                Math.floor(Date.now() + jailDuration)
            );

            // Ceza puanı ekle
            await ceza.findOneAndUpdate(
                { guildID: guild.id, userID: executor.id }, 
                { $push: { ceza: 1 } }, 
                { upsert: true }
            );
            await ceza.findOneAndUpdate(
                { guildID: guild.id, userID: executor.id }, 
                { $inc: { top: 1 } }, 
                { upsert: true }
            );
            await cezapuan.findOneAndUpdate(
                { guildID: guild.id, userID: executor.id }, 
                { $inc: { cezapuan: 15 } }, 
                { upsert: true }
            );

            // Log kanalı
            const logChannel = guild.channels.cache.find(x => x.name === "jail_log");
            if (logChannel) {
                const executorTag = executor.tag || executor.username || executor.id || "Bilinmeyen";
                const executorMemberTag = executorMember ? executorMember.toString() : executorTag;
                const log = new EmbedBuilder()
                    .setDescription(`
                    **${executorTag}** adlı kullanıcı **Voice Mute Guard Sistemi** tarafından Jail atıldı.        
                    `)
                    .addFields(
                        { name: "Cezalandırılan", value: executorMemberTag, inline: true },
                        { name: "Cezalandıran", value: `${client.user}`, inline: true },
                        { name: "Ceza Bitiş", value: `<t:${Math.floor((Date.now() + jailDuration) / 1000)}:R>`, inline: true },
                        { name: "Ceza Sebebi", value: `\`\`\`fix\n${reason}\n\`\`\``, inline: false },
                        { name: "Ceza Numarası", value: `\`#${penal.id}\``, inline: true },
                        { name: "İşlem Tipi", value: `${actionType}`, inline: true }
                    )
                    .setFooter({ text: `${moment(Date.now()).format("LLL")}` })
                    .setColor("#ff0000");

                await logChannel.send({ embeds: [log] });
            }

            // DM gönder
            if (j2poncik.Mainframe.dmMessages) {
                executor.send({
                    content: `**${guild.name}** sunucusunda, Voice Mute Guard sistemi tarafından, **${reason}** sebebiyle, <t:${Math.floor((Date.now() + jailDuration) / 1000)}:R>'ya kadar jaillendiniz.`
                }).catch(() => {});
            }

            // Limit'i sıfırla
            voiceMuteGuardLimit.delete(executor.id);
        } catch (err) {
            console.error('Voice mute guard jail hatası:', err);
        }
    } else {
        // Limit'i artır
        voiceMuteGuardLimit.set(executor.id, currentCount + 1);
        
        // Yarım saat sonra limit'i sıfırla
        setTimeout(() => {
            if (voiceMuteGuardLimit.has(executor.id)) {
                voiceMuteGuardLimit.delete(executor.id);
            }
        }, 1000 * 60 * 15);
    }
}

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    try {
        if (!newState.member) return;
        
        const guild = newState.guild;
        let executor = null;
        let actionType = "";

        // Audit log'dan kim yaptı öğren
        let logs;
        try {
            logs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberUpdate });
        } catch (err) {
            logs = null;
        }

        if (logs && logs.entries.first()) {
            const entry = logs.entries.first();
            // Son 5 saniye içinde yapılmış mı ve bot tarafından yapılmamış mı kontrol et
            if (entry && entry.executor && 
                entry.executor.id !== client.user.id &&
                Date.now() - entry.createdTimestamp < 5000) {
                executor = entry.executor;
            }
        }

        if (!executor) return;

        // Streamer kategorisi kontrolü - Streamer kategorisindeki kanallarda guard devreye girmesin
        const streamerCategories = Array.isArray(j2ponm.StreamerCategory) ? j2ponm.StreamerCategory : [j2ponm.StreamerCategory];
        const currentChannel = newState.channel || oldState.channel;
        const isStreamerCategory = currentChannel && streamerCategories.includes(currentChannel.parentId);
        
        // Streamer kategorisindeyse ve StreamerController veya StreamerResponsible rolü varsa guard devreye girmesin
        if (isStreamerCategory) {
            const executorMember = await guild.members.fetch(executor.id).catch(() => null);
            if (executorMember && (
                executorMember.roles.cache.has(j2ponm.StreamerController) ||
                executorMember.roles.cache.has(j2ponm.StreamerResponsible) ||
                executorMember.roles.cache.has(j2ponm.StreamerRole)
            )) {
                return; // Streamer kategorisinde ve yetkili, guard devreye girmesin
            }
        }

        // Mute ATMA kontrolü (manuel mute atıldıysa)
        if (!oldState.serverMute && newState.serverMute) {
            actionType = "Manuel Mute Atma";
            await checkLimitAndJail(guild, executor, actionType);
        }

        // Mute KALDIRMA kontrolü (manuel mute kaldırıldıysa)
        if (oldState.serverMute && !newState.serverMute) {
            actionType = "Manuel Mute Kaldırma";
            await checkLimitAndJail(guild, executor, actionType);
        }

        // Deafen ATMA kontrolü (manuel deafen atıldıysa)
        if (!oldState.serverDeaf && newState.serverDeaf) {
            actionType = "Manuel Deafen Atma";
            await checkLimitAndJail(guild, executor, actionType);
        }

        // Deafen KALDIRMA kontrolü (manuel deafen kaldırıldıysa)
        if (oldState.serverDeaf && !newState.serverDeaf) {
            actionType = "Manuel Deafen Kaldırma";
            await checkLimitAndJail(guild, executor, actionType);
        }
    } catch (error) {
        console.error('Voice Mute Guard hatası:', error);
    }
});

module.exports.config = {
    name: "voiceStateUpdate",
};

