const { Event } = require("../../../Structures/Default.Events");
const Guild = require("../../../../../Global/Settings/System")
const { Collection, EmbedBuilder, PermissionsBitField } = require('discord.js');
const GuardData = require("../../../Schemas/Guard")
const fetch = require('node-fetch');

class roleCreate extends Event {
    constructor(client) {
        super(client, {
            name: "roleCreate",
            enabled: true,
        });    
    }    

 async  onLoad(role) {
    try {
    if(role.guild.id != Guild.ServerID) return;
    const guild = client.guilds.cache.get(Guild.ServerID)
    const Guard = await GuardData.findOne({guildID: guild.id})
    const rolesGuardonly = Guard ? Guard.rolesGuard : false;
    if(rolesGuardonly == true){
    let entry = await guild.fetchAuditLogs({type: 30}).then(audit => audit.entries.first());
    if(!entry || !entry.executor) return;
    if(entry.executor.id == guild.ownerId) return;
    if(Date.now() - entry.createdTimestamp > 5000) return;
    
    // Üyeyi cache'ten al, yoksa fetch et
    let j2ponnew = guild.members.cache.get(entry.executor.id);
    if(!j2ponnew) {
        try {
            j2ponnew = await guild.members.fetch(entry.executor.id);
        } catch (e) {
            console.log(`[GUARD] RoleCreate: Üye bulunamadı: ${entry.executor.id}`);
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
        if(log) return log.send({embeds:[embed.setAuthor({name:`Trustworthy ✅`, iconURL:guild.iconURL()}).setDescription(`${j2ponnew}, \`${new Date(Date.now()).toTurkishFormatDate()}\` tarihinde **${role.name} - ${role.id}** isimli rolü oluşturdu.`)]})
        return; // Whitelist'teyse işlemi durdur
    }
    
    console.log(`[GUARD] RoleCreate: Whitelist'te olmayan kullanıcı tespit edildi: ${j2ponnew.user.tag}`);
    await ytkapa(Guild.ServerID)
    await ytçek(j2ponnew)
    await role.delete().catch(e => console.error('[GUARD] Rol silinemedi:', e));
    if(log) return log.send({embeds:[embed.setAuthor({name:`Not safe ❎`, iconURL:guild.iconURL()}).setDescription(`${j2ponnew}, \`${new Date(Date.now()).toTurkishFormatDate()}\` tarihinde **${role.name} - ${role.id}** isimli rolü oluşturdu için rolleri alındı ve rol sunucudan silindi.`)]})
    }
    } catch (error) {
        console.error('[GUARD] RoleCreate hatası:', error);
    }
 }
}

module.exports = roleCreate;