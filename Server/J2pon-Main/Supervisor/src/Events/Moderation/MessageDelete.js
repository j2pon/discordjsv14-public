const { EmbedBuilder,AuditLogEvent,Events,codeBlock } = require("discord.js");
const snipe = require("../../../../../../Global/Schemas/snipe");
const client = global.client;
const system = require('../../../../../../Global/Settings/System');
const moment = require('moment');
require("moment-duration-format")
moment.duration("hh:mm:ss").format()

client.on(Events.MessageDelete, async (message) => {
    if (!message.author || message.author.bot) return;
    if (!message.guild || !message.channel) return;
    
    try {
        await snipe.findOneAndUpdate({ guildID: system.ServerID , channelID: message.channel.id }, { $set: { messageContent: message.content || "", userID: message.author.id, image: message.attachments.first() ? message.attachments.first().proxyURL : null, createdDate: message.createdTimestamp, deletedDate: Date.now() } }, { upsert: true });
        
        const channel = client.channels.cache.find(x => x.name == "message_log");
        if (!channel) return;
        
        let entry = await message.guild.fetchAuditLogs({ type: AuditLogEvent.MessageDelete }).then(audit => audit.entries.first()).catch(() => null);
        
        const authorName = message.member?.user?.globalName || message.author.globalName || message.author.username || "Bilinmeyen";
        const executorMention = entry?.executor ? `${entry.executor}` : "Bilinmeyen";
        
        const embed = new EmbedBuilder()
          .setAuthor({ name : authorName, iconURL: message.author.avatarURL({ dynamic: true }) || undefined})
          .setColor("Random")
          .setDescription(`${executorMention} üyesi ${message.channel} kanalında mesajını sildi.`)
          .addFields(
            { name: `Mesaj Kanalı`, value: `${codeBlock("fix", message.channel.name || "Bilinmeyen")}`, inline: false },
            { name: `Mesaj Sahibi`, value: `${codeBlock("fix", message.author.username || "Bilinmeyen")}`, inline: false },
            { name: `Silindiği Tarih`, value: `${codeBlock("fix", moment(Date.now()).format("LLL"))}`, inline: false },
            { name: `Silinen Mesaj`, value: `${codeBlock("fix", (message.content || "").length > 300 ? "300 Karakterden uzun.." : (message.content || "Mesaj içeriği yok"))}`, inline: false }
        );
        
        if (!message.attachments.first()) {
            await channel.send({ embeds: [embed]}).catch(() => {});
        } else {
            const embedx = new EmbedBuilder()
                .setAuthor({ name : authorName, iconURL: message.author.avatarURL({ dynamic: true }) || undefined})
                .setColor("Random")
                .setDescription(`
                ${executorMention} üyesi ${message.channel} kanalında bir içerik sildi!
                                
                \`•\` Mesaj Kanalı: ${message.channel} - (\`${message.channel.id}\`)
                \`•\` Mesaj Sahibi: ${message.author} - (\`${message.author.id}\`)
                `)
                .setFooter({ text: `ID: ${message.author.id} • ${moment(Date.now()).format("LLL")}`});
            
            const attachment = message.attachments.first();
            if (attachment && attachment.proxyURL) {
                await channel.send({ embeds: [embedx.setImage(attachment.proxyURL)]}).catch(() => {});
            }
        }
    } catch (error) {
        // Sessizce hata yakala
    }
});
