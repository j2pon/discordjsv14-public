const { Event } = require("../../../Structures/Default.Events");
const Guild = require("../../../../../Global/Settings/System")
const { Collection, EmbedBuilder, PermissionsBitField } = require('discord.js');
const GuardData = require("../../../Schemas/Guard")
const fetch = require('node-fetch');
const guardPenaltyDB = require("../../../Schemas/guardPenalty")

class GuildMemberBanAdd extends Event {
    constructor(client) {
        super(client, {
            name: "guildBanAdd",
            enabled: true,
        });    
    }    

 async   onLoad(ban) {
    try {
    if(ban.guild.id != Guild.ServerID) return;

    const guild = client.guilds.cache.get(Guild.ServerID)
    const Guard = await GuardData.findOne({guildID: guild.id})
    const banKickGuardonly = Guard ? Guard.banKickGuard : false;
    if(banKickGuardonly == true){
    let entry = await ban.guild.fetchAuditLogs({type: 22}).then(audit => audit.entries.first());
    if(!entry || !entry.executor) return;
    if(entry.executor.id == guild.ownerId) return;
    if(Date.now() - entry.createdTimestamp > 5000) return;
    
    // Üyeyi cache'ten al, yoksa fetch et
    let j2ponnew = guild.members.cache.get(entry.executor.id);
    if(!j2ponnew) {
        try {
            j2ponnew = await guild.members.fetch(entry.executor.id);
        } catch (e) {
            console.log(`[GUARD] GuildMemberBan: Üye bulunamadı: ${entry.executor.id}`);
            return;
        }
    }
    
    const log = guild.channels.cache.find(x => x.name == "guard_log")
    const embed = new EmbedBuilder({
        title:"Server Ban Protection - Security III",
        footer:{text:`Server Security`, iconURL: client.user.avatarURL()}
    })
    
    // Bot kontrolü
    if(j2ponnew.user.bot) return;
    
    if (await guvenli(j2ponnew,"bankick") == true){
        await guardPenaltyDB.findOneAndUpdate({guildID:guild.id,j2ponnew:j2ponnew.id},{$push:{işlemler:{Güvenilir:true,işlem:`Yasaklama! (${ban.user.tag})`,Tarih:Date.now()}}},{upsert:true})
        if(log) return log.send({embeds:[embed.setAuthor({name:`Trustworthy ✅`, iconURL:guild.iconURL()}).setDescription(`${j2ponnew}, \`${new Date(Date.now()).toTurkishFormatDate()}\` tarihinde **${ban.user.tag}** kullanıcısını "Sağ-Tık" kullanarak sunucudan yasakladı.`)]})
        return; // Whitelist'teyse işlemi durdur
    }
    
    console.log(`[GUARD] GuildMemberBan: Whitelist'te olmayan kullanıcı tespit edildi: ${j2ponnew.user.tag}`);
    await ytkapa(Guild.ServerID)
    await sik(guild,j2ponnew.id,"am")
    await guild.members.unban(ban.user.id).catch(e => console.error('[GUARD] Unban yapılamadı:', e));
    if(log) return log.send({embeds:[embed.setAuthor({name:`Not safe ❎`, iconURL:guild.iconURL()}).setDescription(`${j2ponnew}, \`${new Date(Date.now()).toTurkishFormatDate()}\` tarihinde **${ban.user.tag}** kullanıcısını "Sağ-Tık" kullanarak sunucudan yasakladığı için kendisini yasakladım, sunucuda ki üst düzey yetkileri kapattım ve yasakladığı kişinin yasağını kaldırdım.`)]})
    }
    } catch (error) {
        console.error('[GUARD] GuildMemberBan hatası:', error);
    }
 }
}
module.exports = GuildMemberBanAdd;