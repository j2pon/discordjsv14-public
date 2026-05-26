const client = global.client;
const bannedTag = require("../../../../../../Global/Schemas/bannedTag");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const j2poncik = require("../../../../../../Global/Settings/System");
const { checkMemberBannedTag, sendBannedTagLog } = require("../../../../../../Global/Helpers/BannedTagHelper");

client.on("guildMemberUpdate", async (oldMember, newMember) => {
    try {
        if (oldMember.user.bot || newMember.user.bot) return;

        if (oldMember.user.username === newMember.user.username &&
            oldMember.user.displayName === newMember.user.displayName &&
            oldMember.nickname === newMember.nickname) return;

        const yasaklitag = await bannedTag.findOne({ guildID: j2poncik.ServerID });
        if (!yasaklitag || !yasaklitag.taglar || yasaklitag.taglar.length === 0) return;

        const config = j2ponm.ForbiddenTagConfig || {};
        const forbiddenTagRoleId = Array.isArray(j2ponm.ForbiddenTagRoles) ? j2ponm.ForbiddenTagRoles[0] : j2ponm.ForbiddenTagRoles;

        const oldCheck = await checkMemberBannedTag(client, oldMember, yasaklitag.taglar, config);
        const newCheck = await checkMemberBannedTag(client, newMember, yasaklitag.taglar, config);
        const newCheckTag = newCheck.found ? newCheck.found.value : null;
        
        if (!oldCheck.has && newCheck.has) {
            if (!newMember.roles.cache.has(j2ponm.BoosterRole)) {
                // Tüm rolleri kaldır (@everyone ve yasaklı tag rolü hariç)
                const kaldirilacakRoller = newMember.roles.cache
                    .filter(r => r.id !== newMember.guild.id && r.id !== forbiddenTagRoleId && r.editable)
                    .map(r => r);
                
                if (kaldirilacakRoller.length > 0) {
                    try {
                        await newMember.roles.remove(kaldirilacakRoller);
                        console.log(`🗑️ ${newMember.user.tag} kullanıcısından ${kaldirilacakRoller.length} rol kaldırıldı.`);
                    } catch (error) {
                        console.error(`Rol kaldırma hatası (${newMember.user.tag}):`, error.message);
                    }
                }
                
                // Yasaklı tag rolünü ver
                if (!newMember.roles.cache.has(forbiddenTagRoleId)) {
                    await newMember.roles.add(forbiddenTagRoleId).catch();
                }
                await newMember.setNickname('Yasaklı Tag').catch();
                sendBannedTagLog(newMember.client, newMember, newCheck.found || null, "guildMemberUpdate");
                console.log(`✅ ${newMember.user.tag} kullanıcısına yasaklı tag rolü verildi (Tag: ${newCheckTag}).`);
            }
        }
        else if (oldCheck.has && !newCheck.has) {
            if (!newMember.roles.cache.has(j2ponm.BoosterRole)) {
                // Yasaklı tag rolünü kaldır
                if (newMember.roles.cache.has(forbiddenTagRoleId)) {
                    await newMember.roles.remove(forbiddenTagRoleId).catch();
                    console.log(`✅ ${newMember.user.tag} kullanıcısından yasaklı tag rolü kaldırıldı.`);
                }
                
                // UnRegisteredRoles'u ekle (yoksa)
                const unRegisteredRoles = Array.isArray(j2ponm.UnRegisteredRoles) ? j2ponm.UnRegisteredRoles : [j2ponm.UnRegisteredRoles];
                for (const roleId of unRegisteredRoles) {
                    if (!newMember.roles.cache.has(roleId)) {
                        await newMember.roles.add(roleId).catch();
                    }
                }
            }
        }
    } catch (error) {
        console.error('GuildMemberUpdate hatası:', error);
    }
});

module.exports.config = {
    Event: "guildMemberUpdate"
};

