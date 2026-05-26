const { Events, AuditLogEvent } = require('discord.js');
const guard = require('../../../../../J2pon-Guard/Schemas/Guard');
const system = require('../../../../../../Global/Settings/System');
const setup = require('../../../../../../Global/Settings/Setup.json');
const emojis = require('../../../../../../Global/Settings/Emojis.json');
const client = global.client;

// Limit aşıldığında kullanıcıyı jail'e düşür
async function jailUserForLimitExceeded(guild, userId, actionType) {
    try {
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member || !member.manageable) return false;
        
        // Eğer zaten jail'deyse işlem yapma
        if (setup.JailedRoles.some(x => member.roles.cache.has(x))) return false;
        
        // Tüm rollerini çek, booster varsa koru
        if (member.roles.cache.has(setup.BoosterRole)) {
            await member.roles.set([setup.BoosterRole, setup.JailedRoles[0]]).catch(() => {});
        } else {
            await member.roles.set(setup.JailedRoles).catch(() => {});
        }
        
        // Ceza kaydı oluştur (1 hafta jail)
        const reason = `Limitli whitelist limiti aşıldı (${actionType})`;
        const duration = 7 * 24 * 60 * 60 * 1000; // 1 hafta
        await client.penalize(
            guild.id, 
            member.id, 
            'Jail', 
            true, 
            client.user.id, 
            reason, 
            true, 
            Math.floor(Date.now() + duration)
        ).catch(() => {});
        
        // Log kanalına bildir
        const logChannel = guild.channels.cache.find(x => x.name === "jail_log");
        if (logChannel) {
            const { EmbedBuilder } = require('discord.js');
            const moment = require('moment');
            moment.locale("tr");
            
            const log = new EmbedBuilder()
                .setDescription(`**${member.user.tag}** adlı kullanıcı limitli whitelist limitini aştığı için otomatik olarak jail'e düşürüldü.`)
                .addFields(
                    { name: "Cezalandırılan", value: `${member.toString()}`, inline: true },
                    { name: "Sebep", value: `Limitli whitelist limiti aşıldı (${actionType})`, inline: true },
                    { name: "Ceza Bitiş", value: `<t:${Math.floor((Date.now() + duration) / 1000)}:R>`, inline: true }
                )
                .setFooter({ text: `${moment(Date.now()).format("LLL")}` });
            
            await logChannel.send({ embeds: [log] }).catch(() => {});
        }
        
        return true;
    } catch (error) {
        console.error('Jail user for limit exceeded error:', error);
        return false;
    }
}

// Limitli Whitelist Kontrol Fonksiyonu
async function checkLimitedWhitelist(guild, executorId, actionType) {
    try {
        if (!executorId || executorId === guild.ownerId) return false;
        
        const guardData = await guard.findOne({guildID: guild.id});
        if (!guardData) return false;

        // Tam yetki kontrolü - system.BotsOwners kontrolü de yapılmalı
        const fullWhitelist = guardData.SafedMembers || [];
        const banKickWhitelist = guardData.banKickSafedMembers || [];
        const roleWhitelist = guardData.roleSafedMembers || [];
        
        // Bot owner kontrolü
        const isBotOwner = system.BotsOwners && system.BotsOwners.includes(executorId);
        if (isBotOwner) return false; // Bot owner ise limit kontrolü yapma

        // Action tipine göre yetki kontrolü
        let hasFullPermission = false;
        
        if (['ban', 'kick', 'timeout'].includes(actionType)) {
            hasFullPermission = fullWhitelist.includes(executorId) || banKickWhitelist.includes(executorId);
        } else if (['role_add', 'role_remove'].includes(actionType)) {
            hasFullPermission = fullWhitelist.includes(executorId) || roleWhitelist.includes(executorId);
        } else {
            hasFullPermission = fullWhitelist.includes(executorId);
        }

        if (hasFullPermission) return false; // Tam yetki var, limit kontrolü yapma

        // Limitli whitelist kontrolü
        if (guardData.limitedWhitelistMembers && guardData.limitedWhitelistMembers.length > 0) {
            const limitedUser = guardData.limitedWhitelistMembers.find(x => x.userId === executorId);
            
            if (limitedUser) {
                // Yeni yapı kontrolü (limits objesi var mı?)
                if (limitedUser.limits) {
                    const actionLimits = limitedUser.limits[actionType];
                    if (actionLimits) {
                        const now = Date.now();
                        
                        // Süre bazlı reset kontrolü
                        // Ban ve Kick: 3 saat, diğerleri: 1 saat
                        const resetDuration = (actionType === 'ban' || actionType === 'kick') 
                            ? 3 * 60 * 60 * 1000  // 3 saat
                            : 1 * 60 * 60 * 1000; // 1 saat
                        
                        // Eğer reset zamanı geçmişse veya hiç ayarlanmamışsa, kullanımı sıfırla
                        if (!actionLimits.resetAt || now >= actionLimits.resetAt) {
                            actionLimits.used = 0;
                            actionLimits.resetAt = now + resetDuration;
                        }
                        
                        // Limit kontrolü
                        if (actionLimits.used >= actionLimits.limit) {
                            // Limit aşıldı, listeden çıkarma (sadece jail'e düşür)
                            return true; // Limit aşıldı
                        }
                        
                        // Limit artır ve reset zamanını güncelle
                        actionLimits.used += 1;
                        // İlk kullanımda reset zamanını ayarla
                        if (!actionLimits.resetAt || actionLimits.resetAt <= now) {
                            actionLimits.resetAt = now + resetDuration;
                        }
                        await guardData.save();
                    }
                } else {
                    // Eski yapı desteği (geriye dönük uyumluluk)
                    if (limitedUser.used >= limitedUser.limit) {
                        // Limit aşıldı, listeden çıkarma (sadece jail'e düşür)
                        return true;
                    }
                    limitedUser.used += 1;
                    await guardData.save();
                }
            }
        }
        
        return false;
    } catch (error) {
        console.error('Limited whitelist check error:', error);
        return false;
    }
}

// Ban İşlemi Kontrolü
client.on(Events.GuildBanAdd, async (ban) => {
    try {
        const guild = ban.guild;
        const entry = await guild.fetchAuditLogs({type: AuditLogEvent.MemberBan, limit: 1}).then(audit => audit.entries.first());
        
        if (!entry || !entry.executor || entry.executor.bot) return;
        if (Date.now() - entry.createdTimestamp > 5000) return; // 5 saniyeden eski işlemleri görmezden gel
        
        const executorId = entry.executor.id;
        const limitExceeded = await checkLimitedWhitelist(guild, executorId, 'ban');
        
        if (limitExceeded) {
            // Limit aşıldı, ban işlemini geri al ve jail'e düşür
            try {
                const guardData = await guard.findOne({guildID: guild.id});
                const limitedUser = guardData?.limitedWhitelistMembers?.find(x => x.userId === executorId);
                const banInfo = limitedUser?.limits?.ban;
                
                await guild.members.unban(ban.user.id, 'Limitli whitelist limiti aşıldı');
                
                // Kullanıcıyı jail'e düşür
                await jailUserForLimitExceeded(guild, executorId, 'ban');
                
                const executor = await guild.members.fetch(executorId).catch(() => null);
                if (executor) {
                    await executor.send({
                        content: `${emojis.server_carpi} **Ban limitinizi aştınız!**\n\n${emojis.server_info} **Limit:** \`${banInfo?.used || 0}/${banInfo?.limit || 0}\`\n${emojis.server_carpi} Ban işlemi geri alındı, yetkiniz kaldırıldı ve jail'e düşürüldünüz.`
                    }).catch(() => {});
                }
            } catch (error) {
                console.error('Ban geri alma hatası:', error);
            }
        }
    } catch (error) {
        console.error('GuildBanAdd limit check error:', error);
    }
});

// Kick İşlemi Kontrolü (guildMemberRemove + audit log)
client.on(Events.GuildMemberRemove, async (member) => {
    try {
        const guild = member.guild;
        const entry = await guild.fetchAuditLogs({type: AuditLogEvent.MemberKick, limit: 1}).then(audit => audit.entries.first());
        
        if (!entry || !entry.executor || entry.executor.bot) return;
        if (Date.now() - entry.createdTimestamp > 5000) return;
        if (entry.target.id !== member.user.id) return; // Aynı kullanıcı mı kontrol et
        
        const executorId = entry.executor.id;
        const limitExceeded = await checkLimitedWhitelist(guild, executorId, 'kick');
        
        if (limitExceeded) {
            // Limit aşıldı, kullanıcıyı jail'e düşür (kick geri alınamaz)
            const guardData = await guard.findOne({guildID: guild.id});
            const limitedUser = guardData?.limitedWhitelistMembers?.find(x => x.userId === executorId);
            const kickInfo = limitedUser?.limits?.kick;
            
            // Kullanıcıyı jail'e düşür
            await jailUserForLimitExceeded(guild, executorId, 'kick');
            
            const executor = await guild.members.fetch(executorId).catch(() => null);
            if (executor) {
                await executor.send({
                    content: `${emojis.server_carpi} **Kick limitinizi aştınız!**\n\n${emojis.server_info} **Limit:** \`${kickInfo?.used || 0}/${kickInfo?.limit || 0}\`\n${emojis.server_carpi} Kick işlemi gerçekleşti, yetkiniz kaldırıldı ve jail'e düşürüldünüz.`
                }).catch(() => {});
            }
        }
    } catch (error) {
        console.error('GuildMemberRemove limit check error:', error);
    }
});

// Timeout ve Rol Değişiklikleri Kontrolü
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    try {
        const guild = newMember.guild;
        
        // Timeout kontrolü
        if (oldMember.communicationDisabledUntil !== newMember.communicationDisabledUntil) {
            // Timeout eklendi veya kaldırıldı
            if (newMember.communicationDisabledUntil && newMember.communicationDisabledUntil > Date.now()) {
                // Timeout eklendi
                const entry = await guild.fetchAuditLogs({type: AuditLogEvent.MemberUpdate, limit: 5}).then(audit => {
                    return audit.entries.find(e => 
                        e.target.id === newMember.id && 
                        e.changes && 
                        e.changes.some(c => c.key === 'communication_disabled_until') &&
                        Date.now() - e.createdTimestamp < 5000
                    );
                });
                
                if (entry && entry.executor && !entry.executor.bot) {
                    const executorId = entry.executor.id;
                    const limitExceeded = await checkLimitedWhitelist(guild, executorId, 'timeout');
                    
                    if (limitExceeded) {
                        // Limit aşıldı, timeout'u kaldır ve jail'e düşür
                        try {
                            const guardData = await guard.findOne({guildID: guild.id});
                            const limitedUser = guardData?.limitedWhitelistMembers?.find(x => x.userId === executorId);
                            const timeoutInfo = limitedUser?.limits?.timeout;
                            
                            await newMember.timeout(null, 'Limitli whitelist limiti aşıldı');
                            
                            // Kullanıcıyı jail'e düşür
                            await jailUserForLimitExceeded(guild, executorId, 'timeout');
                            
                            const executor = await guild.members.fetch(executorId).catch(() => null);
                            if (executor) {
                                await executor.send({
                                    content: `${emojis.server_carpi} **Timeout limitinizi aştınız!**\n\n${emojis.server_info} **Limit:** \`${timeoutInfo?.used || 0}/${timeoutInfo?.limit || 0}\`\n${emojis.server_carpi} Timeout işlemi geri alındı, yetkiniz kaldırıldı ve jail'e düşürüldünüz.`
                                }).catch(() => {});
                            }
                        } catch (error) {
                            console.error('Timeout geri alma hatası:', error);
                        }
                    }
                }
            }
        }
        
        // Rol ekleme/çıkarma kontrolü
        const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
        const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
        
        if (addedRoles.size > 0 || removedRoles.size > 0) {
            const entry = await guild.fetchAuditLogs({type: AuditLogEvent.MemberRoleUpdate, limit: 1}).then(audit => audit.entries.first());
            
            if (entry && entry.executor && !entry.executor.bot && Date.now() - entry.createdTimestamp < 5000) {
                const executorId = entry.executor.id;
                
                // Önce tam yetki kontrolü yap (guvenli fonksiyonu gibi)
                const executorMember = await guild.members.fetch(executorId).catch(() => null);
                if (executorMember && global.guvenli && await global.guvenli(executorMember, "role") === true) {
                    return; // Tam yetki var, limit kontrolü yapma
                }
                
                const actionType = addedRoles.size > 0 ? 'role_add' : 'role_remove';
                const limitExceeded = await checkLimitedWhitelist(guild, executorId, actionType);
                
                if (limitExceeded) {
                    // Limit aşıldı, rol değişikliklerini geri al ve jail'e düşür
                    try {
                        const guardData = await guard.findOne({guildID: guild.id});
                        const limitedUser = guardData?.limitedWhitelistMembers?.find(x => x.userId === executorId);
                        const roleInfo = actionType === 'role_add' ? limitedUser?.limits?.role_add : limitedUser?.limits?.role_remove;
                        
                        if (addedRoles.size > 0) {
                            await newMember.roles.remove(addedRoles, 'Limitli whitelist limiti aşıldı');
                        }
                        if (removedRoles.size > 0) {
                            await newMember.roles.add(removedRoles, 'Limitli whitelist limiti aşıldı');
                        }
                        
                        // Kullanıcıyı jail'e düşür
                        await jailUserForLimitExceeded(guild, executorId, actionType);
                        
                        const executor = await guild.members.fetch(executorId).catch(() => null);
                        if (executor) {
                            const actionName = actionType === 'role_add' ? 'Rol verme' : 'Rol alma';
                            await executor.send({
                                content: `${emojis.server_carpi} **${actionName} limitinizi aştınız!**\n\n${emojis.server_info} **Limit:** \`${roleInfo?.used || 0}/${roleInfo?.limit || 0}\`\n${emojis.server_carpi} Rol işlemi geri alındı, yetkiniz kaldırıldı ve jail'e düşürüldünüz.`
                            }).catch(() => {});
                        }
                    } catch (error) {
                        console.error('Rol geri alma hatası:', error);
                    }
                }
            }
        }
    } catch (error) {
        console.error('GuildMemberUpdate limit check error:', error);
    }
});

// Not: Voice mute/deafen için Discord audit log'u yoktur, bu yüzden bu işlemler kontrol edilemez
// Ancak sunucuda susturma (mute) rol bazlı yapılıyorsa, rol ekleme/çıkarma kontrolü zaten yukarıda yapılıyor

module.exports.conf = {
    name: 'LimitedWhitelistGuard',
};

