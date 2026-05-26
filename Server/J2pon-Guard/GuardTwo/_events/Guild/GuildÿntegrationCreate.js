const { Event } = require("../../../Structures/Default.Events");
const Guild = require("../../../../../Global/Settings/System")
const { Collection, EmbedBuilder, PermissionsBitField } = require('discord.js');
const GuardData = require("../../../Schemas/Guard")
const fetch = require('node-fetch');
const guardPenaltyDB = require("../../../Schemas/guardPenalty")

class     integrationCreate extends Event {
    constructor(client) {
        super(client, {
            name: "guildIntegrationsCreate",
            enabled: true,
        });    
    }    

 async   onLoad(guildx) {
    if(guildx.id != Guild.ServerID) return;
    const client = this.client;
    if (!client || !client.guilds) return;
    const guild = client.guilds.cache.get(Guild.ServerID);
    if (!guild) return;
    const Guard = await GuardData.findOne({guildID: guild.id})
    const serverGuardonly = Guard ? Guard.serverGuard : false;
    if(serverGuardonly == true){
    let entry = await guild.fetchAuditLogs({type: 80}).then(audit => audit.entries.first());
    if(!entry || !entry.executor || Date.now() - entry.createdTimestamp > 5000) return;
    if(entry.executor.id == guild.ownerId) return;

    const j2ponnew = await guild.members.cache.get(entry.executor.id);
    if(!j2ponnew || j2ponnew.user.bot) return;
    var safetyJ2pon = Guard ? Guard.serverSafedMembers : ["274549490235736075"]
    const log = guild.channels.cache.find(x => x.name == "guard_log")
    const embed = new EmbedBuilder({
        title:"Server İntegration Protection - Security II",
        footer:{text:`Server Security`, iconURL: client.user.avatarURL()}
    })
    if (await guvenli(j2ponnew,"server") == true){
        await guardPenaltyDB.findOneAndUpdate({guildID:guild.id,j2ponnew:j2ponnew.id},{$push:{işlemler:{Güvenilir:true,işlem:`Entagrasyon Oluşturdu.`,Tarih:Date.now()}}},{upsert:true})
        if(log) return log.send({embeds:[embed.setAuthor({name:`Trustworthy ✅`, iconURL:guild.iconURL()}).setDescription(`${j2ponnew}, \`${new Date(Date.now()).toTurkishFormatDate()}\` tarihinde entegrasyon oluşturdu.`)]})
        return; // Whitelist'teyse işlemi durdur
    }
    await sik(guild,j2ponnew.id,"am")

    await ytçek(j2ponnew)
    await guardPenaltyDB.findOneAndUpdate({guildID:guild.id,j2ponnew:j2ponnew.id},{$push:{işlemler:{Güvenilir:false,işlem:`Entagrasyon Oluşturdu.`,Tarih:Date.now()}}},{upsert:true})
    if(log) return log.send({embeds:[embed.setAuthor({name:`Not safe ❎`, iconURL:guild.iconURL()}).setDescription(`${j2ponnew}, \`${new Date(Date.now()).toTurkishFormatDate()}\` tarihinde entegrasyon oluşturduğu için rolleri alındı.`)]})
    }
 }
}
module.exports = integrationCreate;