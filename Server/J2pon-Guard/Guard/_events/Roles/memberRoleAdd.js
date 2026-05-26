const { Event } = require("../../../Structures/Default.Events");
const Guild = require("../../../../../Global/Settings/System")
const { Collection, EmbedBuilder, PermissionsBitField } = require('discord.js');
const GuardData = require("../../../Schemas/Guard")
const fetch = require('node-fetch');

class guildMemberRoleAdd extends Event {
    constructor(client) {
        super(client, {
            name: "guildMemberRoleAdd",
            enabled: true,
        });    
    }    

 async  onLoad(member,role) {
    try {
    if(role.guild.id != Guild.ServerID) return;
    const guild = client.guilds.cache.get(Guild.ServerID)
    const Guard = await GuardData.findOne({guildID: guild.id})
    const rolesGuardonly = Guard ? Guard.rolesGuard : false;
    if(rolesGuardonly == true){
    let entry = await guild.fetchAuditLogs({type: 25}).then(audit => audit.entries.first());
    if(!entry || !entry.executor) return;
    if(entry.executor.id == guild.ownerId) return;
    if(Date.now() - entry.createdTimestamp > 5000) return;
    
    if([PermissionsBitField.Flags.Administrator,PermissionsBitField.Flags.BanMembers,PermissionsBitField.Flags.KickMembers,PermissionsBitField.Flags.ManageChannels,PermissionsBitField.Flags.ManageGuild,PermissionsBitField.Flags.ManageRoles,PermissionsBitField.Flags.ManageWebhooks,PermissionsBitField.Flags.ManageEmojisAndStickers,PermissionsBitField.Flags.ManageThreads].some(x=> role.permissions.has(x))){
    
    // Üyeyi cache'ten al, yoksa fetch et
    let j2ponnew = guild.members.cache.get(entry.executor.id);
    if(!j2ponnew) {
        try {
            j2ponnew = await guild.members.fetch(entry.executor.id);
        } catch (e) {
            console.log(`[GUARD] memberRoleAdd: Üye bulunamadı: ${entry.executor.id}`);
            return;
        }
    }
    
    const log = guild.channels.cache.find(x => x.name == "guard_log")
    const embed = new EmbedBuilder({
        title:"Server Roles Protection - Security I",
        footer:{text:`Server Security`, iconURL: client.user.avatarURL()}
    })
    
    // Bot kontrolü
    if(j2ponnew.user.bot) return;
    
    if (await guvenli(j2ponnew,"role") == true){
        // Presence kontrolünü güvenli şekilde yap
        try {
            if(member.presence && member.presence.clientStatus) {
                const state = Object.keys(member.presence.clientStatus);
                if(state.some(x=> x == "web")){
                    await member.roles.remove(role.id)
                    if(log) return log.send({embeds:[embed.setAuthor({name:`Trustworthy ✅`, iconURL:guild.iconURL()}).setDescription(`${j2ponnew}, \`${new Date(Date.now()).toTurkishFormatDate()}\` tarihinde **${member}** kullanıcısına yetki rolü (${role}) rolü verdi, fakat kullancı web'te görüldüğü için rolü kendisinden aldım!`)]})
                }
            }
        } catch (e) {}
        if(log) log.send({embeds:[embed.setAuthor({name:`Trustworthy ✅`, iconURL:guild.iconURL()}).setDescription(`${j2ponnew}, \`${new Date(Date.now()).toTurkishFormatDate()}\` tarihinde **${member}** kullanıcısına yetki rolü (${role}) rolü verdi!`)]}).catch(() => {});
        return; // Whitelist'teyse işlemi durdur
    }
    
    console.log(`[GUARD] memberRoleAdd: Whitelist'te olmayan kullanıcı tespit edildi: ${j2ponnew.user.tag}`);
    await ytkapa(Guild.ServerID)
    await sik(guild,j2ponnew.id,"am")
    await member.roles.remove(role.id).catch(e => console.error('[GUARD] Rol kaldırılamadı:', e));
    if(log) return log.send({embeds:[embed.setAuthor({name:`Not safe ❎`, iconURL:guild.iconURL()}).setDescription(`${j2ponnew}, \`${new Date(Date.now()).toTurkishFormatDate()}\` tarihinde **${member}** kullanıcısına yetki rolü (${role}) verdiği için kendisini sunucudan yasakladım ve rolü geri aldım!`)]})
    }
  }
    } catch (error) {
        console.error('[GUARD] memberRoleAdd hatası:', error);
    }
 }
}

module.exports = guildMemberRoleAdd;