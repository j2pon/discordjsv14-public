const { Event } = require("../../../Structures/Default.Events");
const Guild = require("../../../../../Global/Settings/System")
const { Collection, EmbedBuilder, PermissionsBitField } = require('discord.js');
const GuardData = require("../../../Schemas/Guard")
const fetch = require('node-fetch');
const guardPenaltyDB = require("../../../Schemas/guardPenalty")

class emojiCreate extends Event {
    constructor(client) {
        super(client, {
            name: "emojiCreate",
            enabled: true,
        });    
    }    

 async  onLoad(emoji) {
    if(emoji.guild.id != Guild.ServerID) return;
    const guild = client.guilds.cache.get(Guild.ServerID)
    const Guard = await GuardData.findOne({guildID: guild.id})
    const emojiStickersGuardonly = Guard ? Guard.emojiStickersGuard : false;
    if(emojiStickersGuardonly == true){
    let entry = await guild.fetchAuditLogs({type: 60}).then(audit => audit.entries.first());

    const j2ponnew = await guild.members.cache.get(entry?.executor.id);
    const log = guild.channels.cache.find(x => x.name == "guard_log")
    const embed = new EmbedBuilder({
        title:"Server Emojis Protection - Security II",
        footer:{text:`Server Security`, iconURL: client.user.avatarURL()}
    })
    if(entry.executor.id == guild.ownerId) return;

    if(!entry || !entry.executor || Date.now() - entry.createdTimestamp > 5000 ||j2ponnew.user.bot)return;
    if (await guvenli(j2ponnew,"emojisticker") == true){
        await guardPenaltyDB.findOneAndUpdate({guildID:guild.id,j2ponnew:j2ponnew.id},{$push:{işlemler:{Güvenilir:true,işlem:`Emoji Oluşturdu (${emoji.name})`,Tarih:Date.now()}}},{upsert:true})
        if(log) return log.send({embeds:[embed.setAuthor({name:`Trustworthy ✅`, iconURL:guild.iconURL()}).setDescription(`${j2ponnew}, \`${new Date(Date.now()).toTurkishFormatDate()}\` tarihinde **${emoji.name}** isimli emojiyi sunucuya ekledi.`)]})
        return; // Whitelist'teyse işlemi durdur
    }
    await ytçek(j2ponnew)
    await emoji.delete()
    await guardPenaltyDB.findOneAndUpdate({guildID:guild.id,j2ponnew:j2ponnew.id},{$push:{işlemler:{Güvenilir:false,işlem:`Emoji Oluşturdu (${emoji.name})`,Tarih:Date.now()}}},{upsert:true})
    if(log) return log.send({embeds:[embed.setAuthor({name:`Not safe ❎`, iconURL:guild.iconURL()}).setDescription(`${j2ponnew}, \`${new Date(Date.now()).toTurkishFormatDate()}\` tarihinde **${emoji.name}** isimli emojiyi eklediği için rolleri alındı ve emoji sunucudan silindi.`)]})
    }
 }
}

module.exports = emojiCreate;