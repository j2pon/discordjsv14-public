const { Event } = require("../../../Structures/Default.Events");
const Guild = require("../../../../../Global/Settings/System")
const { Collection, EmbedBuilder, PermissionsBitField } = require('discord.js');
const GuardData = require("../../../Schemas/Guard")
const guardPenaltyDB = require("../../../Schemas/guardPenalty")

class GuildMemberKick extends Event {
    constructor(client) {
        super(client, {
            name: "guildMemberRemove",
            enabled: true,
        });    
    }    

 async   onLoad(member) {
    try {
    if(member.guild.id != Guild.ServerID) return;

    const guild = client.guilds.cache.get(Guild.ServerID)
    const Guard = await GuardData.findOne({guildID: guild.id})
    const banKickGuardonly = Guard ? Guard.banKickGuard : false;
    
    if(banKickGuardonly == true){
    // Audit log type 20 = MEMBER_KICK
    let entry = await member.guild.fetchAuditLogs({type: 20, limit: 1}).then(audit => audit.entries.first());
    
    // Entry yoksa veya bu üye için değilse (normal ayrılma)
    if(!entry || !entry.executor) return;
    if(entry.target.id !== member.id) return; // Bu kick bu üye için değil
    if(Date.now() - entry.createdTimestamp > 5000) return; // Eski entry
    if(entry.executor.id == guild.ownerId) return;
    
    // Üyeyi cache'ten al, yoksa fetch et
    let j2ponnew = guild.members.cache.get(entry.executor.id);
    if(!j2ponnew) {
        try {
            j2ponnew = await guild.members.fetch(entry.executor.id);
        } catch (e) {
            console.log(`[GUARD] GuildMemberKick: Üye bulunamadı: ${entry.executor.id}`);
            return;
        }
    }
    
    const log = guild.channels.cache.find(x => x.name == "guard_log")
    const embed = new EmbedBuilder({
        title:"Server Kick Protection - Security III",
        footer:{text:`Server Security`, iconURL: client.user.avatarURL()}
    })
    
    // Bot kontrolü
    if(j2ponnew.user.bot) return;
    
    if (await guvenli(j2ponnew,"bankick") == true){
        await guardPenaltyDB.findOneAndUpdate({guildID:guild.id,j2ponnew:j2ponnew.id},{$push:{işlemler:{Güvenilir:true,işlem:`Kick! (${member.user.tag})`,Tarih:Date.now()}}},{upsert:true})
        if(log) return log.send({embeds:[embed.setAuthor({name:`Trustworthy ✅`, iconURL:guild.iconURL()}).setDescription(`${j2ponnew}, \`${new Date(Date.now()).toTurkishFormatDate()}\` tarihinde **${member.user.tag}** kullanıcısını sunucudan attı.`)]})
        return; // Whitelist'teyse işlemi durdur
    }
    
    console.log(`[GUARD] GuildMemberKick: Whitelist'te olmayan kullanıcı tespit edildi: ${j2ponnew.user.tag}`);
    await ytkapa(Guild.ServerID)
    await sik(guild,j2ponnew.id,"am")
    await guardPenaltyDB.findOneAndUpdate({guildID:guild.id,j2ponnew:j2ponnew.id},{$push:{işlemler:{Güvenilir:false,işlem:`Kick! (${member.user.tag})`,Tarih:Date.now()}}},{upsert:true})
    if(log) return log.send({embeds:[embed.setAuthor({name:`Not safe ❎`, iconURL:guild.iconURL()}).setDescription(`${j2ponnew}, \`${new Date(Date.now()).toTurkishFormatDate()}\` tarihinde **${member.user.tag}** kullanıcısını sunucudan attığı için kendisini yasakladım ve sunucuda ki üst düzey yetkileri kapattım.`)]})
    }
    } catch (error) {
        console.error('[GUARD] GuildMemberKick hatası:', error);
    }
 }
}
module.exports = GuildMemberKick;

