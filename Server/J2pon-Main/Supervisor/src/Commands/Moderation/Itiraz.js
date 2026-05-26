const { EmbedBuilder, codeBlock } = require("discord.js");
const penals = require("../../../../../../Global/Schemas/penals");
const itirazSchema = require("../../../../../../Global/Schemas/itiraz");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const system = require("../../../../../../Global/Settings/System");
const moment = require("moment");
moment.locale("tr");

// İşlenmiş mesajları takip etmek için Set
const processedMessages = new Set();

// Komut fonksiyonunu önce tanımla
const executeCommand = async function (client, message, args, byj2ponembed) {
        try {
        const allowedChannel = "cezalı-chat";
        
        // Kanal kontrolü
        if (!message.guild || !message.member) return;
        
        const isAllowedChannel = message.channel.name === allowedChannel || 
                                 message.channel.name.toLowerCase() === allowedChannel.toLowerCase();
        
        if (!isAllowedChannel) {
            const channelMention = client.channels.cache.find(chan => 
                chan.name === allowedChannel || chan.name.toLowerCase() === allowedChannel.toLowerCase()
            );
            return message.reply({ 
                content: `${client.emoji("server_carpi") || "❌"} Bu komutu sadece ${channelMention || `\`#${allowedChannel}\``} kanalında kullanabilirsiniz.`
            }).then((e) => setTimeout(() => { e.delete().catch(() => {}); }, 10000)).catch(() => {});
        }

        // Sebep kontrolü
        if (!args[0]) {
            return message.reply({
                embeds: [byj2ponembed.setDescription(`${client.emoji("server_carpi") || "❌"} Lütfen itiraz sebebinizi belirtin.\n\n**Kullanım:** \`.itiraz <sebep>\``)]
            }).then((e) => setTimeout(() => { e.delete().catch(() => {}); }, 10000)).catch(() => {});
        }

        const sebep = args.join(" ");

        // Günlük limit kontrolü
        const itirazData = await itirazSchema.findOne({ 
            guildID: message.guild.id, 
            userID: message.author.id 
        });

        if (itirazData) {
            const lastDate = itirazData.lastItirazDate;
            const now = Date.now();
            const oneDayInMs = 86400000; // 24 saat

            if (now - lastDate < oneDayInMs) {
                const remainingTime = oneDayInMs - (now - lastDate);
                const remainingHours = Math.floor(remainingTime / 3600000);
                const remainingMinutes = Math.floor((remainingTime % 3600000) / 60000);
                
                return message.reply({
                    embeds: [byj2ponembed.setDescription(
                        `${client.emoji("server_carpi") || "❌"} Bu komutu günde sadece 1 kez kullanabilirsiniz.\n\n` +
                        `${client.emoji("server_info") || "ℹ️"} Tekrar kullanabileceğiniz süre: **${remainingHours} saat ${remainingMinutes} dakika**\n` +
                        `<t:${Math.floor((lastDate + oneDayInMs) / 1000)}:R>`
                    )]
                }).then((e) => setTimeout(() => { e.delete().catch(() => {}); }, 10000)).catch(() => {});
            }
        }

        // Kullanıcının cezalarını getir
        const cezalar = await penals.find({ 
            guildID: message.guild.id, 
            userID: message.author.id 
        }).sort({ date: -1 }).limit(10);

        // Log kanalını bul
        const logChannel = client.channels.cache.get(j2ponm.ItirazLogChannel);
        
        if (!logChannel) {
            return message.reply({
                embeds: [byj2ponembed.setDescription(`${client.emoji("server_carpi") || "❌"} Log kanalı bulunamadı!`)]
            }).then((e) => setTimeout(() => { e.delete().catch(() => {}); }, 10000)).catch(() => {});
        }

        // Sicil bilgisi formatla
        let sicilBilgisi = "";
        if (cezalar.length === 0) {
            sicilBilgisi = `${client.emoji("server_info") || "ℹ️"} Sicilde kayıtlı ceza bulunmamaktadır.`;
        } else {
            sicilBilgisi = cezalar.map((ceza) => {
                const cezaEmoji = ceza.active ? (client.emoji("server_carpi") || "❌") : (client.emoji("server_onay") || "✅");
                const cezaTarih = moment(ceza.date).format("DD MMMM YYYY, HH:mm");
                return `${cezaEmoji} **#${ceza.id}** [${ceza.type}] - ${cezaTarih}\n${codeBlock("fix", (ceza.reason || "Sebep belirtilmedi").length > 200 ? (ceza.reason || "Sebep belirtilmedi").substring(0, 197).trim() + "..." : ceza.reason || "Sebep belirtilmedi")}`;
            }).join("\n\n");
            
            // Sicil bilgisi çok uzunsa kısalt
            if (sicilBilgisi.length > 1024) {
                sicilBilgisi = sicilBilgisi.substring(0, 1020).trim() + "...";
            }
        }

        // Embed oluştur
        const itirazEmbed = new EmbedBuilder()
            .setAuthor({ 
                name: `${message.author.tag} - İtiraz Başvurusu`, 
                iconURL: message.author.displayAvatarURL({ dynamic: true, size: 2048 }) 
            })
            .setDescription(
                `${client.emoji("server_info") || "ℹ️"} **İtiraz Başvurusu**\n\n` +
                `${client.emoji("server_members") || "👥"} **Kullanıcı:** ${message.author} (\`${message.author.id}\`)\n` +
                `${client.emoji("server_info") || "ℹ️"} **Tarih:** <t:${Math.floor(Date.now() / 1000)}:F> (<t:${Math.floor(Date.now() / 1000)}:R>)`
            )
            .addFields(
                {
                    name: `${client.emoji("server_star") || "⭐"} İtiraz Sebebi`,
                    value: sebep.length > 1024 ? sebep.substring(0, 1020).trim() + "..." : sebep,
                    inline: false
                },
                {
                    name: `${client.emoji("server_star2") || "✨"} Kullanıcı Sicili (Son ${cezalar.length} Ceza)`,
                    value: sicilBilgisi,
                    inline: false
                }
            )
            .setColor("#FFD700")
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 2048 }))
            .setFooter({ 
                text: `İtiraz ID: ${message.author.id} | Toplam Ceza: ${cezalar.length}`, 
                iconURL: message.guild.iconURL({ dynamic: true }) 
            })
            .setTimestamp();

        // Log kanalına gönder
        await logChannel.send({ embeds: [itirazEmbed] }).catch(err => {
            console.error("İtiraz log gönderilirken hata:", err);
        });

        // Kullanıcıya onay mesajı
        const onayEmoji = client.emoji("server_onay");
        if (onayEmoji) await message.react(onayEmoji).catch(() => {});
        
        await message.reply({
            embeds: [byj2ponembed.setDescription(
                `${client.emoji("server_onay") || "✅"} İtirazınız başarıyla kaydedildi!\n\n` +
                `${client.emoji("server_info") || "ℹ️"} İtirazınız yetkililer tarafından incelenecektir.\n` +
                `${client.emoji("server_star") || "⭐"} İtiraz sebebiniz: ${codeBlock(sebep.length > 200 ? sebep.substring(0, 198).trim() + ".." : sebep)}`
            )]
        }).then((e) => setTimeout(() => { e.delete().catch(() => {}); }, 15000)).catch(() => {});

        // Günlük limit kaydını güncelle
        await itirazSchema.findOneAndUpdate(
            { guildID: message.guild.id, userID: message.author.id },
            { $set: { lastItirazDate: Date.now() } },
            { upsert: true }
        );
        } catch (error) {
            console.error("İtiraz komutu hatası:", error);
            message.reply({ content: "Bir hata oluştu! Lütfen tekrar deneyin." }).catch(() => {});
        }
};

module.exports = {
    name: "itiraz",
    description: "Ceza itiraz komutu",
    category: "USER",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["appeal"],
        usage: ".itiraz <sebep>",
    },

    onLoad: function (client) {
        // Cezalı kullanıcılar için özel event listener
        client.on('messageCreate', async (message) => {
            try {
                // Sadece cezalı kullanıcılar için çalışsın
                if (!message.guild || !message.member || message.author.bot) return;
                
                // Eğer kullanıcı cezalı rolüne sahip değilse, bu listener'ı atla
                if (!j2ponm.JailedRoles.some((x) => message.member.roles.cache.has(x))) return;
                
                // Prefix kontrolü
                const prefix = system.Mainframe.Prefixs.find((x) => message.content.toLowerCase().startsWith(x));
                if (!prefix) return;
                
                // Komut kontrolü
                let args = message.content.substring(prefix.length).split(' ');
                let commandName = args[0].toLowerCase();
                args = args.slice(1);
                
                if (commandName !== 'itiraz' && commandName !== 'appeal') return;
                
                // Mesaj zaten işlendiyse tekrar işleme
                if (processedMessages.has(message.id)) return;
                processedMessages.add(message.id);
                
                // 5 saniye sonra Set'ten kaldır (bellek temizliği)
                setTimeout(() => processedMessages.delete(message.id), 5000);
                
                // Embed oluştur
                const byj2ponembed = new EmbedBuilder()
                    .setAuthor({
                        name: message.member.displayName,
                        iconURL: message.author.avatarURL({ dynamic: true, size: 2048 }),
                    })
                    .setFooter({
                        text: system.SubTitle ? system.SubTitle : `J2pon was here¿`,
                        iconURL: message.author.avatarURL({ dynamic: true, size: 2048 }),
                    })
                    .setColor('Random');
                
                // Komutu çalıştır
                await executeCommand(client, message, args, byj2ponembed);
            } catch (error) {
                console.error('İtiraz komutu özel listener hatası:', error);
            }
        });
    },

    onCommand: executeCommand,
};

