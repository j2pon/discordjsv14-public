const { Event } = require("../../../Structures/Default.Events");
const Guild = require("../../../../../Global/Settings/System")
const { Collection, EmbedBuilder, PermissionsBitField } = require('discord.js');
const GuardData = require("../../../Schemas/Guard")
const fetch = require('node-fetch');
const permissionStaff = [PermissionsBitField.Flags.Administrator, PermissionsBitField.Flags.ManageRoles, PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.ManageGuild, PermissionsBitField.Flags.BanMembers, PermissionsBitField.Flags.KickMembers, PermissionsBitField.Flags.ManageNicknames, PermissionsBitField.Flags.ManageEmojisAndStickers, PermissionsBitField.Flags.ManageWebhooks];
class roleCreate extends Event {
    constructor(client) {
        super(client, {
            name: "roleUpdate",
            enabled: true,
        });    
    }    

 async  onLoad(oldRole, newRole) {
    try {
    if(oldRole.guild.id != Guild.ServerID) return;
    const guild = client.guilds.cache.get(Guild.ServerID)
    const Guard = await GuardData.findOne({guildID: guild.id})
    const rolesGuardonly = Guard ? Guard.rolesGuard : false;
    if(rolesGuardonly == true){
    let entry = await guild.fetchAuditLogs({type: 31}).then(audit => audit.entries.first());
    if(!entry || !entry.executor) return;
    if(entry.executor.id == guild.ownerId) return;
    if(Date.now() - entry.createdTimestamp > 5000) return;

    // Üyeyi cache'ten al, yoksa fetch et
    let j2ponnew = guild.members.cache.get(entry.executor.id);
    if(!j2ponnew) {
        try {
            j2ponnew = await guild.members.fetch(entry.executor.id);
        } catch (e) {
            console.log(`[GUARD] RoleUpdate: Üye bulunamadı: ${entry.executor.id}`);
            return;
        }
    }
    
    var safetyJ2pon = Guard ? Guard.roleSafedMembers : ["852800814808694814"]
    const log = guild.channels.cache.find(x => x.name == "guard_log")
    const embed = new EmbedBuilder({
        title:"Server Roles Protection - Security I",
        footer:{text:`Server Security`, iconURL: client.user.avatarURL()}
    })
    
    // Bot kontrolü
    if(j2ponnew.user.bot) return;
    
    if (await guvenli(j2ponnew,"role") == true){
        if(log) return log.send({embeds:[embed.setAuthor({name:`Trustworthy ✅`, iconURL:guild.iconURL()}).setDescription(`${j2ponnew}, \`${new Date(Date.now()).toTurkishFormatDate()}\` tarihinde **${oldRole.name} - ${oldRole.id}**  isimli rolü güncelledi.`)]})
        return; // Whitelist'teyse işlemi durdur
    }
    
    console.log(`[GUARD] RoleUpdate: Whitelist'te olmayan kullanıcı tespit edildi: ${j2ponnew.user.tag}`);
    await ytkapa(Guild.ServerID)
    await ytçek(j2ponnew)
    if (permissionStaff.some(p => !oldRole.permissions.has(p) && newRole.permissions.has(p))) {
        newRole.setPermissions(PermissionsBitField.Flags.SendMessages).catch(e => console.error('[GUARD] Permission ayarlanamadı:', e));
      };
      await newRole.edit({
        name: oldRole ? oldRole.name : oldRole.name,
        color: oldRole ? oldRole.hexColor : oldRole.hexColor,
        hoist: oldRole ? oldRole.hoist : oldRole.hoist,
        permissions: oldRole ? oldRole.permissions : oldRole.permissions,
        mentionable: oldRole ? oldRole.mentionable : oldRole.mentionable
      }).catch(e => console.error('[GUARD] Rol düzenlenemedi:', e));
    if(log) return log.send({embeds:[embed.setAuthor({name:`Not safe ❎`, iconURL:guild.iconURL()}).setDescription(`${j2ponnew}, \`${new Date(Date.now()).toTurkishFormatDate()}\` tarihinde **${oldRole.name} - ${oldRole.id}**  isimli güncellediği için rolleri alındı ve rol eski haline getirildi.`)]})
    }
    } catch (error) {
        console.error('[GUARD] RoleUpdate hatası:', error);
    }
 }
}

module.exports = roleCreate;