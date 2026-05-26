const { AttachmentBuilder, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputStyle, TextInputBuilder, StringSelectMenuBuilder, codeBlock } = require("discord.js");
const guard = require("../../../../../J2pon-Guard/Schemas/Guard");
const j2poncik = require("../../../../../../Global/Settings/System");
const guardPenalty = require("../../../../../J2pon-Guard/Schemas/guardPenalty");
const rolePermissions = require("../../../../../J2pon-Guard/Schemas/rolePermissions");
const { guildRoles, guildChannels } = require("../../../../../J2pon-Guard/Additions/_general.additions");
const {exec} = require("child_process");

module.exports = {
    name: "panel",
    description: "Guard Kontrol Paneli",
    category: "OWNER",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["panel","guard","guardpanel","p"],
      usage: ".panel", 
    },
  

    onLoad: function (client) { },

    onCommand: async function (client, message, args, byj2ponembed) {

        const ayarbutonları = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder().setCustomId("sunucuayarkoruma").setLabel("Sunucu Ayar Koruması").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("rolkoruma").setLabel("Rol Koruması").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("kanalkoruma").setLabel("Kanal Koruması").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("bankickkoruma").setLabel("Ban/Kick Koruması").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("emojistickerskoruma").setLabel("Emoji/Stickers Koruması").setStyle(ButtonStyle.Secondary),
        ) 
        const ayarbutonları2 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder().setCustomId("chatguard").setLabel("Chat Guard Koruması").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("chatguard_settings").setLabel("Chat Guard Ayarları").setStyle(ButtonStyle.Secondary),
        ) 
        const ayaryedekleme = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder().setCustomId("yetkiac").setLabel("Yetkileri Aç/Kapat").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("urlspammer").setLabel("URL Spammer").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("kanalyedek").setLabel("Kanalları/Rolleri Yedekle").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("weboffline").setLabel("Web/Çevrimdışı Güvenlik").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("database").setLabel("Yedekleme Aç/Kapat").setStyle(ButtonStyle.Secondary),
        ) 
        let guardEmoji = message.guild.emojis.cache.find(x=> x.name == "ok") ? message.guild.emojis.cache.find(x=> x.name == "ok") : "•"
        const dataguard = await guard.findOne({guildID:message.guild.id})
        const safedMembers = dataguard ? dataguard.SafedMembers : client.owners
        var adminmenu = [];
        const admins = await message.guild.members.cache.filter(member => !member.user.bot && member.permissions.has(PermissionsBitField.Flags.Administrator)).map(async x=> await adminmenu.push({label:`${x.user.tag}`,description:`Sunucuya katılım: ${tarihsel(x.joinedTimestamp)}`,value:`${x.id}`}))
        const yoneticilermenusu = new ActionRowBuilder()
        .addComponents(
        new StringSelectMenuBuilder()
        .setCustomId("yoneticiMenu")
        .setPlaceholder("Yöneticiler")
        .setOptions(adminmenu)
        );
        var guardData = await guard.findOne({guildID:message.guild.id})
        var databaseOnly = guardData ? guardData.database : false
        var serverGuardOnly = guardData ? guardData.serverGuard : false
        var roleGuardOnly = guardData ? guardData.rolesGuard : false
        var channelGuardOnly = guardData ? guardData.channelsGuard : false
        var bankickGuardOnly = guardData ? guardData.banKickGuard : false
        var emojistickerGuardOnly = guardData ? guardData.emojiStickersGuard : false
        var urlSpammerOnly = guardData ? guardData.UrlSpammer : false
        var webandofflineOnly = guardData ? guardData.webAndofflineGuard :false
        var chatGuardOnly = guardData ? guardData.chatGuards : false
        message.channel.send({embeds:[byj2ponembed.setDescription(`Merhaba ${message.member} Guard Yönetim ve Kontrol Paneline Hoşgeldin,
        ${guardEmoji} Aşağıda bulunan butonlardan korumaları açıp/kapatabilir,
        ${guardEmoji} Menüden bulunan yöneticileri Güvenliye ekleyebilir/çıkarabilir,
        ${guardEmoji} Database verilerini tekrar yedekleyebilir,
        ${guardEmoji} Yetkileri açıp/kapatabilirsin.
        ${guardEmoji} URL Spammer ile Url'ni koruyabilirsin.\n\`Spamlama işlemi 1 dakika arayla yapılmaktadır.\`
        ${codeBlock("md",
            `# Sunucu Koruma Paneli
${databaseOnly == true ? "< Database                 : Açık 🟢" : "> Database                 : Kapalı 🔴"}
${urlSpammerOnly == true ? "< URL Spammer              : Açık 🟢" : "> URL Spammer              : Kapalı 🔴"}
${roleGuardOnly == true ? "< Rol Koruması             : Açık 🟢" : "> Rol Koruması             : Kapalı 🔴"}
${channelGuardOnly == true ? "< Kanal Koruması           : Açık 🟢" : "> Kanal Koruması           : Kapalı 🔴"}
${serverGuardOnly == true ? "< Sunucu Koruması          : Açık 🟢" : "> Sunucu Koruması          : Kapalı 🔴"}
${bankickGuardOnly == true ? "< Ban ve Kick Koruması     : Açık 🟢" : "> Ban ve Kick Koruması     : Kapalı 🔴"}
${emojistickerGuardOnly == true ? "< Emoji ve Sticker Koruması: Açık 🟢" : "> Emoji ve Sticker Koruması: Kapalı 🔴"}
${webandofflineOnly == true ? "< Web/Çevrimdışı Koruması  : Açık 🟢" : "> Web/Çevrimdışı Koruması  : Kapalı 🔴"}
${chatGuardOnly == true ? "< Chat Guard Koruması      : Açık 🟢"    : "> Chat Guard Koruması      : Kapalı 🔴"}
        `)}
        **[Unutma]** \`Not:\` __Bu panele sadece__ **Taç Sahibi <@${message.guild.ownerId}>** __ ve ${j2poncik.BotsOwners.map(x=> `<@${x}>`).join(", ")} erişebilir ve kullanabilir.__
        `)],components:[ayarbutonları,ayaryedekleme,ayarbutonları2,yoneticilermenusu]}).then(async msg =>{
          const filter = d => d.user.id == message.member.id 
          const collector = msg.createMessageComponentCollector({ filter: filter,  errors: ["time"], time: 30000*10 })
          collector.on('collect', async (interaction) => {
            await interaction.deferUpdate();
            if(interaction.customId == "weboffline"){
            webandofflineOnly = guardData ? guardData.webAndofflineGuard :false
            if(webandofflineOnly == true){
              await guard.findOneAndUpdate({guildID:interaction.guild.id},{$set:{webAndofflineGuard:false}},{upsert:true})
              guardData = await guard.findOne({guildID:interaction.guild.id})
          databaseOnly = guardData ? guardData.database : false
          serverGuardOnly = guardData ? guardData.serverGuard : false
          roleGuardOnly = guardData ? guardData.rolesGuard : false
          channelGuardOnly = guardData ? guardData.channelsGuard : false
          bankickGuardOnly = guardData ? guardData.banKickGuard : false
          emojistickerGuardOnly = guardData ? guardData.emojiStickersGuard : false
          urlSpammerOnly = guardData ? guardData.UrlSpammer : false
          webandofflineOnly = guardData ? guardData.webAndofflineGuard :false
          chatGuardOnly = guardData ? guardData.chatGuards :false
              await msg.edit({embeds:[byj2ponembed.setDescription(`Merhaba ${message.member} Guard Yönetim ve Kontrol Paneline Hoşgeldin,
              ${guardEmoji} Aşağıda bulunan butonlardan korumaları açıp/kapatabilir,
              ${guardEmoji} Menüden bulunan yöneticileri Güvenliye ekleyebilir/çıkarabilir,
              ${guardEmoji} Database verilerini tekrar yedekleyebilir,
              ${guardEmoji} Yetkileri açıp/kapatabilirsin
              ${guardEmoji} URL Spammer ile Url'ni koruyabilirsin.\n\`Spamlama işlemi 1 dakika arayla yapılmaktadır.\`
              ${codeBlock("md",
              `# Sunucu Koruma Paneli
${databaseOnly == true ? "< Database                 : Açık 🟢":"> Database                 : Kapalı 🔴"}
${urlSpammerOnly == true ? "< URL Spammer              : Açık 🟢":"> URL Spammer              : Kapalı 🔴"}
${roleGuardOnly == true ? "< Rol Koruması             : Açık 🟢":"> Rol Koruması             : Kapalı 🔴"}
${channelGuardOnly == true ? "< Kanal Koruması           : Açık 🟢":"> Kanal Koruması           : Kapalı 🔴"}
${serverGuardOnly == true ? "< Sunucu Koruması          : Açık 🟢":"> Sunucu Koruması          : Kapalı 🔴"}
${bankickGuardOnly == true ? "< Ban ve Kick Koruması     : Açık 🟢":"> Ban ve Kick Koruması     : Kapalı 🔴"}
${emojistickerGuardOnly == true ? "< Emoji ve Sticker Koruması: Açık 🟢":"> Emoji ve Sticker Koruması: Kapalı 🔴"}
${webandofflineOnly == true ? "< Web/Çevrimdışı Koruması  : Açık 🟢":"> Web/Çevrimdışı Koruması  : Kapalı 🔴"}
${chatGuardOnly == true ? "< Chat Guard Koruması      : Açık 🟢"    : "> Chat Guard Koruması      : Kapalı 🔴"}
              `)}
                      **[Unutma]** \`Not:\` __Bu panele sadece__ **Taç Sahibi <@${message.guild.ownerId}>** __ ve ${j2poncik.BotsOwners.map(x=> `<@${x}>`).join(", ")} erişebilir ve kullanabilir.__
              `)]})
            }else{
              await guard.findOneAndUpdate({guildID:interaction.guild.id},{$set:{webAndofflineGuard:true}},{upsert:true})
          
              guardData = await guard.findOne({guildID:interaction.guild.id})
          serverGuardOnly = guardData ? guardData.serverGuard : false
          roleGuardOnly = guardData ? guardData.rolesGuard : false
          channelGuardOnly = guardData ? guardData.channelsGuard : false
          bankickGuardOnly = guardData ? guardData.banKickGuard : false
          emojistickerGuardOnly = guardData ? guardData.emojiStickersGuard : false
          urlSpammerOnly = guardData ? guardData.UrlSpammer : false
          webandofflineOnly = guardData ? guardData.webAndofflineGuard :false
          databaseOnly = guardData ? guardData.database : false
          chatGuardOnly = guardData ? guardData.chatGuards :false
              await msg.edit({embeds:[byj2ponembed.setDescription(`Merhaba ${message.member} Guard Yönetim ve Kontrol Paneline Hoşgeldin,
              ${guardEmoji} Aşağıda bulunan butonlardan korumaları açıp/kapatabilir,
              ${guardEmoji} Menüden bulunan yöneticileri Güvenliye ekleyebilir/çıkarabilir,
              ${guardEmoji} Database verilerini tekrar yedekleyebilir,
              ${guardEmoji} Yetkileri açıp/kapatabilirsin
              ${guardEmoji} URL Spammer ile Url'ni koruyabilirsin.\n\`Spamlama işlemi 1 dakika arayla yapılmaktadır.\`
              ${codeBlock("md",
              `# Sunucu Koruma Paneli
${databaseOnly == true ? "< Database                 : Açık 🟢":"> Database                 : Kapalı 🔴"}
${urlSpammerOnly == true ? "< URL Spammer              : Açık 🟢":"> URL Spammer              : Kapalı 🔴"}
${roleGuardOnly == true ? "< Rol Koruması             : Açık 🟢":"> Rol Koruması             : Kapalı 🔴"}
${channelGuardOnly == true ? "< Kanal Koruması           : Açık 🟢":"> Kanal Koruması           : Kapalı 🔴"}
${serverGuardOnly == true ? "< Sunucu Koruması          : Açık 🟢":"> Sunucu Koruması          : Kapalı 🔴"}
${bankickGuardOnly == true ? "< Ban ve Kick Koruması     : Açık 🟢":"> Ban ve Kick Koruması     : Kapalı 🔴"}
${emojistickerGuardOnly == true ? "< Emoji ve Sticker Koruması: Açık 🟢":"> Emoji ve Sticker Koruması: Kapalı 🔴"}
${webandofflineOnly == true ? "< Web/Çevrimdışı Koruması  : Açık 🟢":"> Web/Çevrimdışı Koruması  : Kapalı 🔴"}
${chatGuardOnly == true ? "< Chat Guard Koruması      : Açık 🟢"    : "> Chat Guard Koruması      : Kapalı 🔴"}
              `)}
                      **[Unutma]** \`Not:\` __Bu panele sadece__ **Taç Sahibi <@${message.guild.ownerId}>** __ ve ${j2poncik.BotsOwners.map(x=> `<@${x}>`).join(", ")} erişebilir ve kullanabilir.__
              `)]})
            }
            }
            if(interaction.customId == "kanalyedek"){
              guardData = await guard.findOne({guildID:interaction.guild.id})
              databaseOnly = guardData ? guardData.database : false
              if(databaseOnly == true){
                await guildChannels(interaction.guild)
                await guildRoles(interaction.guild)
                await interaction.channel.send({content:`**Kanallar ve Roller Başarıyla Yedeklendi!**`,ephemeral:true})
              }
              else {
                await interaction.channel.send({content:`**Datebase Sistemi** kapalı olduğundan dolayı yedekleme işlemi yapılamaz.`,ephemeral:true})
              }
            }
            if(interaction.customId == "database"){
              databaseOnly = guardData ? guardData.database : false
        
          if(databaseOnly == true){
            await guard.findOneAndUpdate({guildID:interaction.guild.id},{$set:{database:false}},{upsert:true})
            guardData = await guard.findOne({guildID:interaction.guild.id})
        databaseOnly = guardData ? guardData.database : false
        serverGuardOnly = guardData ? guardData.serverGuard : false
        roleGuardOnly = guardData ? guardData.rolesGuard : false
        channelGuardOnly = guardData ? guardData.channelsGuard : false
        bankickGuardOnly = guardData ? guardData.banKickGuard : false
        emojistickerGuardOnly = guardData ? guardData.emojiStickersGuard : false
        urlSpammerOnly = guardData ? guardData.UrlSpammer : false
        webandofflineOnly = guardData ? guardData.webAndofflineGuard :false
        chatGuardOnly = guardData ? guardData.chatGuards :false
            await msg.edit({embeds:[byj2ponembed.setDescription(`Merhaba ${message.member} Guard Yönetim ve Kontrol Paneline Hoşgeldin,
            ${guardEmoji} Aşağıda bulunan butonlardan korumaları açıp/kapatabilir,
            ${guardEmoji} Menüden bulunan yöneticileri Güvenliye ekleyebilir/çıkarabilir,
            ${guardEmoji} Database verilerini tekrar yedekleyebilir,
            ${guardEmoji} Yetkileri açıp/kapatabilirsin
            ${guardEmoji} URL Spammer ile Url'ni koruyabilirsin.\n\`Spamlama işlemi 1 dakika arayla yapılmaktadır.\`
            ${codeBlock("md",
            `# Sunucu Koruma Paneli
${databaseOnly == true ? "< Database                 : Açık 🟢":"> Database                 : Kapalı 🔴"}
${urlSpammerOnly == true ? "< URL Spammer              : Açık 🟢":"> URL Spammer              : Kapalı 🔴"}
${roleGuardOnly == true ? "< Rol Koruması             : Açık 🟢":"> Rol Koruması             : Kapalı 🔴"}
${channelGuardOnly == true ? "< Kanal Koruması           : Açık 🟢":"> Kanal Koruması           : Kapalı 🔴"}
${serverGuardOnly == true ? "< Sunucu Koruması          : Açık 🟢":"> Sunucu Koruması          : Kapalı 🔴"}
${bankickGuardOnly == true ? "< Ban ve Kick Koruması     : Açık 🟢":"> Ban ve Kick Koruması     : Kapalı 🔴"}
${emojistickerGuardOnly == true ? "< Emoji ve Sticker Koruması: Açık 🟢":"> Emoji ve Sticker Koruması: Kapalı 🔴"}
${webandofflineOnly == true ? "< Web/Çevrimdışı Koruması  : Açık 🟢":"> Web/Çevrimdışı Koruması  : Kapalı 🔴"}
${chatGuardOnly == true ? "< Chat Guard Koruması      : Açık 🟢"    : "> Chat Guard Koruması      : Kapalı 🔴"}
            `)}
                    **[Unutma]** \`Not:\` __Bu panele sadece__ **Taç Sahibi <@${message.guild.ownerId}>** __ ve ${j2poncik.BotsOwners.map(x=> `<@${x}>`).join(", ")} erişebilir ve kullanabilir.__
            `)]})
          }else{
            await guard.findOneAndUpdate({guildID:interaction.guild.id},{$set:{database:true}},{upsert:true})
        
            guardData = await guard.findOne({guildID:interaction.guild.id})
        serverGuardOnly = guardData ? guardData.serverGuard : false
        roleGuardOnly = guardData ? guardData.rolesGuard : false
        channelGuardOnly = guardData ? guardData.channelsGuard : false
        bankickGuardOnly = guardData ? guardData.banKickGuard : false
        emojistickerGuardOnly = guardData ? guardData.emojiStickersGuard : false
        urlSpammerOnly = guardData ? guardData.UrlSpammer : false
        webandofflineOnly = guardData ? guardData.webAndofflineGuard :false
        databaseOnly = guardData ? guardData.database : false
        chatGuardOnly = guardData ? guardData.chatGuards :false
            await msg.edit({embeds:[byj2ponembed.setDescription(`Merhaba ${message.member} Guard Yönetim ve Kontrol Paneline Hoşgeldin,
            ${guardEmoji} Aşağıda bulunan butonlardan korumaları açıp/kapatabilir,
            ${guardEmoji} Menüden bulunan yöneticileri Güvenliye ekleyebilir/çıkarabilir,
            ${guardEmoji} Database verilerini tekrar yedekleyebilir,
            ${guardEmoji} Yetkileri açıp/kapatabilirsin
            ${guardEmoji} URL Spammer ile Url'ni koruyabilirsin.\n\`Spamlama işlemi 1 dakika arayla yapılmaktadır.\`
            ${codeBlock("md",
            `# Sunucu Koruma Paneli
${databaseOnly == true ? "< Database                 : Açık 🟢":"> Database                 : Kapalı 🔴"}
${urlSpammerOnly == true ? "< URL Spammer              : Açık 🟢":"> URL Spammer              : Kapalı 🔴"}
${roleGuardOnly == true ? "< Rol Koruması             : Açık 🟢":"> Rol Koruması             : Kapalı 🔴"}
${channelGuardOnly == true ? "< Kanal Koruması           : Açık 🟢":"> Kanal Koruması           : Kapalı 🔴"}
${serverGuardOnly == true ? "< Sunucu Koruması          : Açık 🟢":"> Sunucu Koruması          : Kapalı 🔴"}
${bankickGuardOnly == true ? "< Ban ve Kick Koruması     : Açık 🟢":"> Ban ve Kick Koruması     : Kapalı 🔴"}
${emojistickerGuardOnly == true ? "< Emoji ve Sticker Koruması: Açık 🟢":"> Emoji ve Sticker Koruması: Kapalı 🔴"}
${webandofflineOnly == true ? "< Web/Çevrimdışı Koruması  : Açık 🟢":"> Web/Çevrimdışı Koruması  : Kapalı 🔴"}
${chatGuardOnly == true ? "< Chat Guard Koruması      : Açık 🟢"    : "> Chat Guard Koruması      : Kapalı 🔴"}
            `)}
                    **[Unutma]** \`Not:\` __Bu panele sadece__ **Taç Sahibi <@${message.guild.ownerId}>** __ ve ${j2poncik.BotsOwners.map(x=> `<@${x}>`).join(", ")} erişebilir ve kullanabilir.__
            `)]})
            await guildRoles(interaction.guild)
            await guildChannels(interaction.guild)
            await interaction.channel.send({content:`**Roller ve Kanallar Yedeklendi!** \n\`Not: Tekrar Yedeklemek için "Kanalları Yedekle" & "Rolleri Yedekle" butonlarını kullanabilirsiniz.\``,ephemeral:true})
        
          }
            }
            if(interaction.customId == "sunucuayarkoruma"){
              serverGuardOnly = guardData ? guardData.serverGuard : false
        
          if(serverGuardOnly == true){
            await guard.findOneAndUpdate({guildID:interaction.guild.id},{$set:{serverGuard:false}},{upsert:true})
            guardData = await guard.findOne({guildID:interaction.guild.id})
        serverGuardOnly = guardData ? guardData.serverGuard : false
        roleGuardOnly = guardData ? guardData.rolesGuard : false
        databaseOnly = guardData ? guardData.database : false
        chatGuardOnly = guardData ? guardData.chatGuards :false
        channelGuardOnly = guardData ? guardData.channelsGuard : false
        bankickGuardOnly = guardData ? guardData.banKickGuard : false
        emojistickerGuardOnly = guardData ? guardData.emojiStickersGuard : false
        urlSpammerOnly = guardData ? guardData.UrlSpammer : false
        webandofflineOnly = guardData ? guardData.webAndofflineGuard :false
            await msg.edit({embeds:[byj2ponembed.setDescription(`Merhaba ${message.member} Guard Yönetim ve Kontrol Paneline Hoşgeldin,
            ${guardEmoji} Aşağıda bulunan butonlardan korumaları açıp/kapatabilir,
            ${guardEmoji} Menüden bulunan yöneticileri Güvenliye ekleyebilir/çıkarabilir,
            ${guardEmoji} Database verilerini tekrar yedekleyebilir,
            ${guardEmoji} Yetkileri açıp/kapatabilirsin
            ${guardEmoji} URL Spammer ile Url'ni koruyabilirsin.\n\`Spamlama işlemi 1 dakika arayla yapılmaktadır.\`
            ${codeBlock("md",
            `# Sunucu Koruma Paneli
${databaseOnly == true ? "< Database                 : Açık 🟢":"> Database                 : Kapalı 🔴"}
${urlSpammerOnly == true ? "< URL Spammer              : Açık 🟢":"> URL Spammer              : Kapalı 🔴"}
${roleGuardOnly == true ? "< Rol Koruması             : Açık 🟢":"> Rol Koruması             : Kapalı 🔴"}
${channelGuardOnly == true ? "< Kanal Koruması           : Açık 🟢":"> Kanal Koruması           : Kapalı 🔴"}
${serverGuardOnly == true ? "< Sunucu Koruması          : Açık 🟢":"> Sunucu Koruması          : Kapalı 🔴"}
${bankickGuardOnly == true ? "< Ban ve Kick Koruması     : Açık 🟢":"> Ban ve Kick Koruması     : Kapalı 🔴"}
${emojistickerGuardOnly == true ? "< Emoji ve Sticker Koruması: Açık 🟢":"> Emoji ve Sticker Koruması: Kapalı 🔴"}
${webandofflineOnly == true ? "< Web/Çevrimdışı Koruması  : Açık 🟢":"> Web/Çevrimdışı Koruması  : Kapalı 🔴"}
${chatGuardOnly == true ? "< Chat Guard Koruması      : Açık 🟢"    : "> Chat Guard Koruması      : Kapalı 🔴"}
            `)}
                    **[Unutma]** \`Not:\` __Bu panele sadece__ **Taç Sahibi <@${message.guild.ownerId}>** __ ve ${j2poncik.BotsOwners.map(x=> `<@${x}>`).join(", ")} erişebilir ve kullanabilir.__
            `)]})
          }else{
            await guard.findOneAndUpdate({guildID:interaction.guild.id},{$set:{serverGuard:true}},{upsert:true})
            guardData = await guard.findOne({guildID:interaction.guild.id})
        serverGuardOnly = guardData ? guardData.serverGuard : false
        roleGuardOnly = guardData ? guardData.rolesGuard : false
        channelGuardOnly = guardData ? guardData.channelsGuard : false
        bankickGuardOnly = guardData ? guardData.banKickGuard : false
        emojistickerGuardOnly = guardData ? guardData.emojiStickersGuard : false
        urlSpammerOnly = guardData ? guardData.UrlSpammer : false
        chatGuardOnly = guardData ? guardData.chatGuards :false
        webandofflineOnly = guardData ? guardData.webAndofflineGuard :false
            await msg.edit({embeds:[byj2ponembed.setDescription(`Merhaba ${message.member} Guard Yönetim ve Kontrol Paneline Hoşgeldin,
            ${guardEmoji} Aşağıda bulunan butonlardan korumaları açıp/kapatabilir,
            ${guardEmoji} Menüden bulunan yöneticileri Güvenliye ekleyebilir/çıkarabilir,
            ${guardEmoji} Database verilerini tekrar yedekleyebilir,
            ${guardEmoji} Yetkileri açıp/kapatabilirsin
            ${guardEmoji} URL Spammer ile Url'ni koruyabilirsin.\n\`Spamlama işlemi 1 dakika arayla yapılmaktadır.\`
            ${codeBlock("md",
            `# Sunucu Koruma Paneli
${databaseOnly == true ? "< Database                 : Açık 🟢":"> Database                 : Kapalı 🔴"}
${urlSpammerOnly == true ? "< URL Spammer              : Açık 🟢":"> URL Spammer              : Kapalı 🔴"}
${roleGuardOnly == true ? "< Rol Koruması             : Açık 🟢":"> Rol Koruması             : Kapalı 🔴"}
${channelGuardOnly == true ? "< Kanal Koruması           : Açık 🟢":"> Kanal Koruması           : Kapalı 🔴"}
${serverGuardOnly == true ? "< Sunucu Koruması          : Açık 🟢":"> Sunucu Koruması          : Kapalı 🔴"}
${bankickGuardOnly == true ? "< Ban ve Kick Koruması     : Açık 🟢":"> Ban ve Kick Koruması     : Kapalı 🔴"}
${emojistickerGuardOnly == true ? "< Emoji ve Sticker Koruması: Açık 🟢":"> Emoji ve Sticker Koruması: Kapalı 🔴"}
${webandofflineOnly == true ? "< Web/Çevrimdışı Koruması  : Açık 🟢":"> Web/Çevrimdışı Koruması  : Kapalı 🔴"}
${chatGuardOnly == true ? "< Chat Guard Koruması      : Açık 🟢"    : "> Chat Guard Koruması      : Kapalı 🔴"}
            `)}
                    **[Unutma]** \`Not:\` __Bu panele sadece__ **Taç Sahibi <@${message.guild.ownerId}>** __ ve ${j2poncik.BotsOwners.map(x=> `<@${x}>`).join(", ")} erişebilir ve kullanabilir.__
            `)]})
          }
            }
            if(interaction.customId == "rolkoruma"){
              roleGuardOnly = guardData ? guardData.rolesGuard : false
        
          if(roleGuardOnly == true){
            await guard.findOneAndUpdate({guildID:interaction.guild.id},{$set:{rolesGuard:false}},{upsert:true})
            guardData = await guard.findOne({guildID:interaction.guild.id})
        serverGuardOnly = guardData ? guardData.serverGuard : false
        roleGuardOnly = guardData ? guardData.rolesGuard : false
        channelGuardOnly = guardData ? guardData.channelsGuard : false
        bankickGuardOnly = guardData ? guardData.banKickGuard : false
        chatGuardOnly = guardData ? guardData.chatGuards :false
        emojistickerGuardOnly = guardData ? guardData.emojiStickersGuard : false
        urlSpammerOnly = guardData ? guardData.UrlSpammer : false
        webandofflineOnly = guardData ? guardData.webAndofflineGuard :false
            await msg.edit({embeds:[byj2ponembed.setDescription(`Merhaba ${message.member} Guard Yönetim ve Kontrol Paneline Hoşgeldin,
            ${guardEmoji} Aşağıda bulunan butonlardan korumaları açıp/kapatabilir,
            ${guardEmoji} Menüden bulunan yöneticileri Güvenliye ekleyebilir/çıkarabilir,
            ${guardEmoji} Database verilerini tekrar yedekleyebilir,
            ${guardEmoji} Yetkileri açıp/kapatabilirsin
            ${guardEmoji} URL Spammer ile Url'ni koruyabilirsin.\n\`Spamlama işlemi 1 dakika arayla yapılmaktadır.\`
            ${codeBlock("md",
            `# Sunucu Koruma Paneli
${databaseOnly == true ? "< Database                 : Açık 🟢":"> Database                 : Kapalı 🔴"}
${urlSpammerOnly == true ? "< URL Spammer              : Açık 🟢":"> URL Spammer              : Kapalı 🔴"}
${roleGuardOnly == true ? "< Rol Koruması             : Açık 🟢":"> Rol Koruması             : Kapalı 🔴"}
${channelGuardOnly == true ? "< Kanal Koruması           : Açık 🟢":"> Kanal Koruması           : Kapalı 🔴"}
${serverGuardOnly == true ? "< Sunucu Koruması          : Açık 🟢":"> Sunucu Koruması          : Kapalı 🔴"}
${bankickGuardOnly == true ? "< Ban ve Kick Koruması     : Açık 🟢":"> Ban ve Kick Koruması     : Kapalı 🔴"}
${emojistickerGuardOnly == true ? "< Emoji ve Sticker Koruması: Açık 🟢":"> Emoji ve Sticker Koruması: Kapalı 🔴"}
${webandofflineOnly == true ? "< Web/Çevrimdışı Koruması  : Açık 🟢":"> Web/Çevrimdışı Koruması  : Kapalı 🔴"}
${chatGuardOnly == true ? "< Chat Guard Koruması      : Açık 🟢"    : "> Chat Guard Koruması      : Kapalı 🔴"}
            `)}
                    **[Unutma]** \`Not:\` __Bu panele sadece__ **Taç Sahibi <@${message.guild.ownerId}>** __ ve ${j2poncik.BotsOwners.map(x=> `<@${x}>`).join(", ")} erişebilir ve kullanabilir.__
            `)]})
          }else{
            await guard.findOneAndUpdate({guildID:interaction.guild.id},{$set:{rolesGuard:true}},{upsert:true})
            guardData = await guard.findOne({guildID:interaction.guild.id})
        serverGuardOnly = guardData ? guardData.serverGuard : false
        roleGuardOnly = guardData ? guardData.rolesGuard : false
        channelGuardOnly = guardData ? guardData.channelsGuard : false
        bankickGuardOnly = guardData ? guardData.banKickGuard : false
        emojistickerGuardOnly = guardData ? guardData.emojiStickersGuard : false
        urlSpammerOnly = guardData ? guardData.UrlSpammer : false
        chatGuardOnly = guardData ? guardData.chatGuards :false
        webandofflineOnly = guardData ? guardData.webAndofflineGuard :false
            await msg.edit({embeds:[byj2ponembed.setDescription(`Merhaba ${message.member} Guard Yönetim ve Kontrol Paneline Hoşgeldin,
            ${guardEmoji} Aşağıda bulunan butonlardan korumaları açıp/kapatabilir,
            ${guardEmoji} Menüden bulunan yöneticileri Güvenliye ekleyebilir/çıkarabilir,
            ${guardEmoji} Database verilerini tekrar yedekleyebilir,
            ${guardEmoji} Yetkileri açıp/kapatabilirsin
            ${guardEmoji} URL Spammer ile Url'ni koruyabilirsin.\n\`Spamlama işlemi 1 dakika arayla yapılmaktadır.\`
            ${codeBlock("md",
            `# Sunucu Koruma Paneli
${databaseOnly == true ? "< Database                 : Açık 🟢":"> Database                 : Kapalı 🔴"}
${urlSpammerOnly == true ? "< URL Spammer              : Açık 🟢":"> URL Spammer              : Kapalı 🔴"}
${roleGuardOnly == true ? "< Rol Koruması             : Açık 🟢":"> Rol Koruması             : Kapalı 🔴"}
${channelGuardOnly == true ? "< Kanal Koruması           : Açık 🟢":"> Kanal Koruması           : Kapalı 🔴"}
${serverGuardOnly == true ? "< Sunucu Koruması          : Açık 🟢":"> Sunucu Koruması          : Kapalı 🔴"}
${bankickGuardOnly == true ? "< Ban ve Kick Koruması     : Açık 🟢":"> Ban ve Kick Koruması     : Kapalı 🔴"}
${emojistickerGuardOnly == true ? "< Emoji ve Sticker Koruması: Açık 🟢":"> Emoji ve Sticker Koruması: Kapalı 🔴"}
${webandofflineOnly == true ? "< Web/Çevrimdışı Koruması  : Açık 🟢":"> Web/Çevrimdışı Koruması  : Kapalı 🔴"}
${chatGuardOnly == true ? "< Chat Guard Koruması      : Açık 🟢"    : "> Chat Guard Koruması      : Kapalı 🔴"}
            `)}
                    **[Unutma]** \`Not:\` __Bu panele sadece__ **Taç Sahibi <@${message.guild.ownerId}>** __ ve ${j2poncik.BotsOwners.map(x=> `<@${x}>`).join(", ")} erişebilir ve kullanabilir.__
            `)]})
          }
            }
            if(interaction.customId == "kanalkoruma"){
              channelGuardOnly = guardData ? guardData.channelsGuard : false
        
          if(channelGuardOnly == true){
            await guard.findOneAndUpdate({guildID:interaction.guild.id},{$set:{channelsGuard:false}},{upsert:true})
            guardData = await guard.findOne({guildID:interaction.guild.id})
        serverGuardOnly = guardData ? guardData.serverGuard : false
        roleGuardOnly = guardData ? guardData.rolesGuard : false
        databaseOnly = guardData ? guardData.database : false
        chatGuardOnly = guardData ? guardData.chatGuards :false
        channelGuardOnly = guardData ? guardData.channelsGuard : false
        bankickGuardOnly = guardData ? guardData.banKickGuard : false
        emojistickerGuardOnly = guardData ? guardData.emojiStickersGuard : false
        urlSpammerOnly = guardData ? guardData.UrlSpammer : false
        webandofflineOnly = guardData ? guardData.webAndofflineGuard :false
            await msg.edit({embeds:[byj2ponembed.setDescription(`Merhaba ${message.member} Guard Yönetim ve Kontrol Paneline Hoşgeldin,
            ${guardEmoji} Aşağıda bulunan butonlardan korumaları açıp/kapatabilir,
            ${guardEmoji} Menüden bulunan yöneticileri Güvenliye ekleyebilir/çıkarabilir,
            ${guardEmoji} Database verilerini tekrar yedekleyebilir,
            ${guardEmoji} Yetkileri açıp/kapatabilirsin
            ${guardEmoji} URL Spammer ile Url'ni koruyabilirsin.\n\`Spamlama işlemi 1 dakika arayla yapılmaktadır.\`
            ${codeBlock("md",
            `# Sunucu Koruma Paneli
${databaseOnly == true ? "< Database                 : Açık 🟢":"> Database                 : Kapalı 🔴"}
${urlSpammerOnly == true ? "< URL Spammer              : Açık 🟢":"> URL Spammer              : Kapalı 🔴"}
${roleGuardOnly == true ? "< Rol Koruması             : Açık 🟢":"> Rol Koruması             : Kapalı 🔴"}
${channelGuardOnly == true ? "< Kanal Koruması           : Açık 🟢":"> Kanal Koruması           : Kapalı 🔴"}
${serverGuardOnly == true ? "< Sunucu Koruması          : Açık 🟢":"> Sunucu Koruması          : Kapalı 🔴"}
${bankickGuardOnly == true ? "< Ban ve Kick Koruması     : Açık 🟢":"> Ban ve Kick Koruması     : Kapalı 🔴"}
${emojistickerGuardOnly == true ? "< Emoji ve Sticker Koruması: Açık 🟢":"> Emoji ve Sticker Koruması: Kapalı 🔴"}
${webandofflineOnly == true ? "< Web/Çevrimdışı Koruması  : Açık 🟢":"> Web/Çevrimdışı Koruması  : Kapalı 🔴"}
${chatGuardOnly == true ? "< Chat Guard Koruması      : Açık 🟢"    : "> Chat Guard Koruması      : Kapalı 🔴"}
            `)}
                    **[Unutma]** \`Not:\` __Bu panele sadece__ **Taç Sahibi <@${message.guild.ownerId}>** __ ve ${j2poncik.BotsOwners.map(x=> `<@${x}>`).join(", ")} erişebilir ve kullanabilir.__
            `)]})
          }else{
            await guard.findOneAndUpdate({guildID:interaction.guild.id},{$set:{channelsGuard:true}},{upsert:true})
            guardData = await guard.findOne({guildID:interaction.guild.id})
        serverGuardOnly = guardData ? guardData.serverGuard : false
        roleGuardOnly = guardData ? guardData.rolesGuard : false
        channelGuardOnly = guardData ? guardData.channelsGuard : false
        chatGuardOnly = guardData ? guardData.chatGuards :false
        bankickGuardOnly = guardData ? guardData.banKickGuard : false
        emojistickerGuardOnly = guardData ? guardData.emojiStickersGuard : false
        urlSpammerOnly = guardData ? guardData.UrlSpammer : false
        webandofflineOnly = guardData ? guardData.webAndofflineGuard :false
            await msg.edit({embeds:[byj2ponembed.setDescription(`Merhaba ${message.member} Guard Yönetim ve Kontrol Paneline Hoşgeldin,
            ${guardEmoji} Aşağıda bulunan butonlardan korumaları açıp/kapatabilir,
            ${guardEmoji} Menüden bulunan yöneticileri Güvenliye ekleyebilir/çıkarabilir,
            ${guardEmoji} Database verilerini tekrar yedekleyebilir,
            ${guardEmoji} Yetkileri açıp/kapatabilirsin
            ${guardEmoji} URL Spammer ile Url'ni koruyabilirsin.\n\`Spamlama işlemi 1 dakika arayla yapılmaktadır.\`
            ${codeBlock("md",
            `# Sunucu Koruma Paneli
${databaseOnly == true ? "< Database                 : Açık 🟢":"> Database                 : Kapalı 🔴"}
${urlSpammerOnly == true ? "< URL Spammer              : Açık 🟢":"> URL Spammer              : Kapalı 🔴"}
${roleGuardOnly == true ? "< Rol Koruması             : Açık 🟢":"> Rol Koruması             : Kapalı 🔴"}
${channelGuardOnly == true ? "< Kanal Koruması           : Açık 🟢":"> Kanal Koruması           : Kapalı 🔴"}
${serverGuardOnly == true ? "< Sunucu Koruması          : Açık 🟢":"> Sunucu Koruması          : Kapalı 🔴"}
${bankickGuardOnly == true ? "< Ban ve Kick Koruması     : Açık 🟢":"> Ban ve Kick Koruması     : Kapalı 🔴"}
${emojistickerGuardOnly == true ? "< Emoji ve Sticker Koruması: Açık 🟢":"> Emoji ve Sticker Koruması: Kapalı 🔴"}
${webandofflineOnly == true ? "< Web/Çevrimdışı Koruması  : Açık 🟢":"> Web/Çevrimdışı Koruması  : Kapalı 🔴"}
${chatGuardOnly == true ? "< Chat Guard Koruması      : Açık 🟢"    : "> Chat Guard Koruması      : Kapalı 🔴"}
            `)}
                    **[Unutma]** \`Not:\` __Bu panele sadece__ **Taç Sahibi <@${message.guild.ownerId}>** __ ve ${j2poncik.BotsOwners.map(x=> `<@${x}>`).join(", ")} erişebilir ve kullanabilir.__
            `)]})
          }
            }
            if(interaction.customId == "bankickkoruma"){
              bankickGuardOnly = guardData ? guardData.banKickGuard : false
        
          if(bankickGuardOnly == true){
            await guard.findOneAndUpdate({guildID:interaction.guild.id},{$set:{banKickGuard:false}},{upsert:true})
            guardData = await guard.findOne({guildID:interaction.guild.id})
        serverGuardOnly = guardData ? guardData.serverGuard : false
        roleGuardOnly = guardData ? guardData.rolesGuard : false
        channelGuardOnly = guardData ? guardData.channelsGuard : false
        bankickGuardOnly = guardData ? guardData.banKickGuard : false
        chatGuardOnly = guardData ? guardData.chatGuards :false
        emojistickerGuardOnly = guardData ? guardData.emojiStickersGuard : false
        urlSpammerOnly = guardData ? guardData.UrlSpammer : false
        webandofflineOnly = guardData ? guardData.webAndofflineGuard :false
            await msg.edit({embeds:[byj2ponembed.setDescription(`Merhaba ${message.member} Guard Yönetim ve Kontrol Paneline Hoşgeldin,
            ${guardEmoji} Aşağıda bulunan butonlardan korumaları açıp/kapatabilir,
            ${guardEmoji} Menüden bulunan yöneticileri Güvenliye ekleyebilir/çıkarabilir,
            ${guardEmoji} Database verilerini tekrar yedekleyebilir,
            ${guardEmoji} Yetkileri açıp/kapatabilirsin
            ${guardEmoji} URL Spammer ile Url'ni koruyabilirsin.\n\`Spamlama işlemi 1 dakika arayla yapılmaktadır.\`
            ${codeBlock("md",
            `# Sunucu Koruma Paneli
${databaseOnly == true ? "< Database                 : Açık 🟢":"> Database                 : Kapalı 🔴"}
${urlSpammerOnly == true ? "< URL Spammer              : Açık 🟢":"> URL Spammer              : Kapalı 🔴"}
${roleGuardOnly == true ? "< Rol Koruması             : Açık 🟢":"> Rol Koruması             : Kapalı 🔴"}
${channelGuardOnly == true ? "< Kanal Koruması           : Açık 🟢":"> Kanal Koruması           : Kapalı 🔴"}
${serverGuardOnly == true ? "< Sunucu Koruması          : Açık 🟢":"> Sunucu Koruması          : Kapalı 🔴"}
${bankickGuardOnly == true ? "< Ban ve Kick Koruması     : Açık 🟢":"> Ban ve Kick Koruması     : Kapalı 🔴"}
${emojistickerGuardOnly == true ? "< Emoji ve Sticker Koruması: Açık 🟢":"> Emoji ve Sticker Koruması: Kapalı 🔴"}
${webandofflineOnly == true ? "< Web/Çevrimdışı Koruması  : Açık 🟢":"> Web/Çevrimdışı Koruması  : Kapalı 🔴"}
${chatGuardOnly == true ? "< Chat Guard Koruması      : Açık 🟢"    : "> Chat Guard Koruması      : Kapalı 🔴"}
            `)}
                    **[Unutma]** \`Not:\` __Bu panele sadece__ **Taç Sahibi <@${message.guild.ownerId}>** __ ve ${j2poncik.BotsOwners.map(x=> `<@${x}>`).join(", ")} erişebilir ve kullanabilir.__
            `)]})
          }else{
            await guard.findOneAndUpdate({guildID:interaction.guild.id},{$set:{banKickGuard:true}},{upsert:true})
            guardData = await guard.findOne({guildID:interaction.guild.id})
        serverGuardOnly = guardData ? guardData.serverGuard : false
        roleGuardOnly = guardData ? guardData.rolesGuard : false
        channelGuardOnly = guardData ? guardData.channelsGuard : false
        chatGuardOnly = guardData ? guardData.chatGuards :false
        bankickGuardOnly = guardData ? guardData.banKickGuard : false
        emojistickerGuardOnly = guardData ? guardData.emojiStickersGuard : false
        urlSpammerOnly = guardData ? guardData.UrlSpammer : false
        webandofflineOnly = guardData ? guardData.webAndofflineGuard :false
            await msg.edit({embeds:[byj2ponembed.setDescription(`Merhaba ${message.member} Guard Yönetim ve Kontrol Paneline Hoşgeldin,
            ${guardEmoji} Aşağıda bulunan butonlardan korumaları açıp/kapatabilir,
            ${guardEmoji} Menüden bulunan yöneticileri Güvenliye ekleyebilir/çıkarabilir,
            ${guardEmoji} Database verilerini tekrar yedekleyebilir,
            ${guardEmoji} Yetkileri açıp/kapatabilirsin
            ${guardEmoji} URL Spammer ile Url'ni koruyabilirsin.\n\`Spamlama işlemi 1 dakika arayla yapılmaktadır.\`
            ${codeBlock("md",
            `# Sunucu Koruma Paneli
${databaseOnly == true ? "< Database                 : Açık 🟢":"> Database                 : Kapalı 🔴"}
${urlSpammerOnly == true ? "< URL Spammer              : Açık 🟢":"> URL Spammer              : Kapalı 🔴"}
${roleGuardOnly == true ? "< Rol Koruması             : Açık 🟢":"> Rol Koruması             : Kapalı 🔴"}
${channelGuardOnly == true ? "< Kanal Koruması           : Açık 🟢":"> Kanal Koruması           : Kapalı 🔴"}
${serverGuardOnly == true ? "< Sunucu Koruması          : Açık 🟢":"> Sunucu Koruması          : Kapalı 🔴"}
${bankickGuardOnly == true ? "< Ban ve Kick Koruması     : Açık 🟢":"> Ban ve Kick Koruması     : Kapalı 🔴"}
${emojistickerGuardOnly == true ? "< Emoji ve Sticker Koruması: Açık 🟢":"> Emoji ve Sticker Koruması: Kapalı 🔴"}
${webandofflineOnly == true ? "< Web/Çevrimdışı Koruması  : Açık 🟢":"> Web/Çevrimdışı Koruması  : Kapalı 🔴"}
${chatGuardOnly == true ? "< Chat Guard Koruması      : Açık 🟢"    : "> Chat Guard Koruması      : Kapalı 🔴"}
            `)}
                    **[Unutma]** \`Not:\` __Bu panele sadece__ **Taç Sahibi <@${message.guild.ownerId}>** __ ve ${j2poncik.BotsOwners.map(x=> `<@${x}>`).join(", ")} erişebilir ve kullanabilir.__
            `)]})
          }
            }
            if(interaction.customId == "emojistickerskoruma"){
              emojistickerGuardOnly = guardData ? guardData.emojiStickersGuard : false
        
          if(emojistickerGuardOnly == true){
            await guard.findOneAndUpdate({guildID:interaction.guild.id},{$set:{emojiStickersGuard:false}},{upsert:true})
            guardData = await guard.findOne({guildID:interaction.guild.id})
        serverGuardOnly = guardData ? guardData.serverGuard : false
        databaseOnly = guardData ? guardData.database : false
        chatGuardOnly = guardData ? guardData.chatGuards :false
        roleGuardOnly = guardData ? guardData.rolesGuard : false
        channelGuardOnly = guardData ? guardData.channelsGuard : false
        bankickGuardOnly = guardData ? guardData.banKickGuard : false
        emojistickerGuardOnly = guardData ? guardData.emojiStickersGuard : false
        urlSpammerOnly = guardData ? guardData.UrlSpammer : false
        webandofflineOnly = guardData ? guardData.webAndofflineGuard :false
            await msg.edit({embeds:[byj2ponembed.setDescription(`Merhaba ${message.member} Guard Yönetim ve Kontrol Paneline Hoşgeldin,
            ${guardEmoji} Aşağıda bulunan butonlardan korumaları açıp/kapatabilir,
            ${guardEmoji} Menüden bulunan yöneticileri Güvenliye ekleyebilir/çıkarabilir,
            ${guardEmoji} Database verilerini tekrar yedekleyebilir,
            ${guardEmoji} Yetkileri açıp/kapatabilirsin
            ${guardEmoji} URL Spammer ile Url'ni koruyabilirsin.\n\`Spamlama işlemi 1 dakika arayla yapılmaktadır.\`
            ${codeBlock("md",
            `# Sunucu Koruma Paneli
${databaseOnly == true ? "< Database                 : Açık 🟢":"> Database                 : Kapalı 🔴"}
${urlSpammerOnly == true ? "< URL Spammer              : Açık 🟢":"> URL Spammer              : Kapalı 🔴"}
${roleGuardOnly == true ? "< Rol Koruması             : Açık 🟢":"> Rol Koruması             : Kapalı 🔴"}
${channelGuardOnly == true ? "< Kanal Koruması           : Açık 🟢":"> Kanal Koruması           : Kapalı 🔴"}
${serverGuardOnly == true ? "< Sunucu Koruması          : Açık 🟢":"> Sunucu Koruması          : Kapalı 🔴"}
${bankickGuardOnly == true ? "< Ban ve Kick Koruması     : Açık 🟢":"> Ban ve Kick Koruması     : Kapalı 🔴"}
${emojistickerGuardOnly == true ? "< Emoji ve Sticker Koruması: Açık 🟢":"> Emoji ve Sticker Koruması: Kapalı 🔴"}
${webandofflineOnly == true ? "< Web/Çevrimdışı Koruması  : Açık 🟢":"> Web/Çevrimdışı Koruması  : Kapalı 🔴"}
${chatGuardOnly == true ? "< Chat Guard Koruması      : Açık 🟢"    : "> Chat Guard Koruması      : Kapalı 🔴"}
            `)}
                    **[Unutma]** \`Not:\` __Bu panele sadece__ **Taç Sahibi <@${message.guild.ownerId}>** __ ve ${j2poncik.BotsOwners.map(x=> `<@${x}>`).join(", ")} erişebilir ve kullanabilir.__
            `)]})
          }else{
            await guard.findOneAndUpdate({guildID:interaction.guild.id},{$set:{emojiStickersGuard:true}},{upsert:true})
        
            guardData = await guard.findOne({guildID:interaction.guild.id})
        serverGuardOnly = guardData ? guardData.serverGuard : false
        roleGuardOnly = guardData ? guardData.rolesGuard : false
        channelGuardOnly = guardData ? guardData.channelsGuard : false
        bankickGuardOnly = guardData ? guardData.banKickGuard : false
        emojistickerGuardOnly = guardData ? guardData.emojiStickersGuard : false
        urlSpammerOnly = guardData ? guardData.UrlSpammer : false
        chatGuardOnly = guardData ? guardData.chatGuards :false
        webandofflineOnly = guardData ? guardData.webAndofflineGuard :false
            await msg.edit({embeds:[byj2ponembed.setDescription(`Merhaba ${message.member} Guard Yönetim ve Kontrol Paneline Hoşgeldin,
            ${guardEmoji} Aşağıda bulunan butonlardan korumaları açıp/kapatabilir,
            ${guardEmoji} Menüden bulunan yöneticileri Güvenliye ekleyebilir/çıkarabilir,
            ${guardEmoji} Database verilerini tekrar yedekleyebilir,
            ${guardEmoji} Yetkileri açıp/kapatabilirsin
            ${guardEmoji} URL Spammer ile Url'ni koruyabilirsin.\n\`Spamlama işlemi 1 dakika arayla yapılmaktadır.\`
            ${codeBlock("md",
            `# Sunucu Koruma Paneli
${databaseOnly == true ? "< Database                 : Açık 🟢":"> Database                 : Kapalı 🔴"}
${urlSpammerOnly == true ? "< URL Spammer              : Açık 🟢":"> URL Spammer              : Kapalı 🔴"}
${roleGuardOnly == true ? "< Rol Koruması             : Açık 🟢":"> Rol Koruması             : Kapalı 🔴"}
${channelGuardOnly == true ? "< Kanal Koruması           : Açık 🟢":"> Kanal Koruması           : Kapalı 🔴"}
${serverGuardOnly == true ? "< Sunucu Koruması          : Açık 🟢":"> Sunucu Koruması          : Kapalı 🔴"}
${bankickGuardOnly == true ? "< Ban ve Kick Koruması     : Açık 🟢":"> Ban ve Kick Koruması     : Kapalı 🔴"}
${emojistickerGuardOnly == true ? "< Emoji ve Sticker Koruması: Açık 🟢":"> Emoji ve Sticker Koruması: Kapalı 🔴"}
${webandofflineOnly == true ? "< Web/Çevrimdışı Koruması  : Açık 🟢":"> Web/Çevrimdışı Koruması  : Kapalı 🔴"}
${chatGuardOnly == true ? "< Chat Guard Koruması      : Açık 🟢"    : "> Chat Guard Koruması      : Kapalı 🔴"}
            `)}
                    **[Unutma]** \`Not:\` __Bu panele sadece__ **Taç Sahibi <@${message.guild.ownerId}>** __ ve ${j2poncik.BotsOwners.map(x=> `<@${x}>`).join(", ")} erişebilir ve kullanabilir.__
            `)]})
          }
            }
            if(interaction.customId == "chatguard"){
              chatGuardOnly = guardData ? guardData.chatGuards : false

          if(chatGuardOnly == true){
            await guard.findOneAndUpdate({guildID:interaction.guild.id},{$set:{chatGuards:false}},{upsert:true})
            guardData = await guard.findOne({guildID:interaction.guild.id})
        serverGuardOnly = guardData ? guardData.serverGuard : false
        databaseOnly = guardData ? guardData.database : false
        roleGuardOnly = guardData ? guardData.rolesGuard : false
        channelGuardOnly = guardData ? guardData.channelsGuard : false
        bankickGuardOnly = guardData ? guardData.banKickGuard : false
        chatGuardOnly = guardData ? guardData.chatGuards : false
        urlSpammerOnly = guardData ? guardData.UrlSpammer : false
        webandofflineOnly = guardData ? guardData.webAndofflineGuard :false
            await msg.edit({embeds:[byj2ponembed.setDescription(`Merhaba ${message.member} Guard Yönetim ve Kontrol Paneline Hoşgeldin,
            ${guardEmoji} Aşağıda bulunan butonlardan korumaları açıp/kapatabilir,
            ${guardEmoji} Menüden bulunan yöneticileri Güvenliye ekleyebilir/çıkarabilir,
            ${guardEmoji} Database verilerini tekrar yedekleyebilir,
            ${guardEmoji} Yetkileri açıp/kapatabilirsin
            ${guardEmoji} URL Spammer ile Url'ni koruyabilirsin.\n\`Spamlama işlemi 1 dakika arayla yapılmaktadır.\`
            ${codeBlock("md",
            `# Sunucu Koruma Paneli
${databaseOnly == true ? "< Database                 : Açık 🟢":"> Database                 : Kapalı 🔴"}
${urlSpammerOnly == true ? "< URL Spammer              : Açık 🟢":"> URL Spammer              : Kapalı 🔴"}
${roleGuardOnly == true ? "< Rol Koruması             : Açık 🟢":"> Rol Koruması             : Kapalı 🔴"}
${channelGuardOnly == true ? "< Kanal Koruması           : Açık 🟢":"> Kanal Koruması           : Kapalı 🔴"}
${serverGuardOnly == true ? "< Sunucu Koruması          : Açık 🟢":"> Sunucu Koruması          : Kapalı 🔴"}
${bankickGuardOnly == true ? "< Ban ve Kick Koruması     : Açık 🟢":"> Ban ve Kick Koruması     : Kapalı 🔴"}
${emojistickerGuardOnly == true ? "< Emoji ve Sticker Koruması: Açık 🟢":"> Emoji ve Sticker Koruması: Kapalı 🔴"}  
${webandofflineOnly == true ? "< Web/Çevrimdışı Koruması  : Açık 🟢":"> Web/Çevrimdışı Koruması  : Kapalı 🔴"}
${chatGuardOnly == true ? "< Chat Guard Koruması      : Açık 🟢"    : "> Chat Guard Koruması      : Kapalı 🔴"}
            `)}
                    **[Unutma]** \`Not:\` __Bu panele sadece__ **Taç Sahibi <@${message.guild.ownerId}>** __ ve ${j2poncik.BotsOwners.map(x=> `<@${x}>`).join(", ")} erişebilir ve kullanabilir.__
            `)]})
          }else{
            await guard.findOneAndUpdate({guildID:interaction.guild.id},{$set:{chatGuards:true}},{upsert:true})
        
            guardData = await guard.findOne({guildID:interaction.guild.id})
        serverGuardOnly = guardData ? guardData.serverGuard : false
        roleGuardOnly = guardData ? guardData.rolesGuard : false
        channelGuardOnly = guardData ? guardData.channelsGuard : false
        bankickGuardOnly = guardData ? guardData.banKickGuard : false
        emojistickerGuardOnly = guardData ? guardData.emojiStickersGuard : false
        urlSpammerOnly = guardData ? guardData.UrlSpammer : false
        chatGuardOnly = guardData ? guardData.chatGuards :false
        webandofflineOnly = guardData ? guardData.webAndofflineGuard :false
            await msg.edit({embeds:[byj2ponembed.setDescription(`Merhaba ${message.member} Guard Yönetim ve Kontrol Paneline Hoşgeldin,
            ${guardEmoji} Aşağıda bulunan butonlardan korumaları açıp/kapatabilir,
            ${guardEmoji} Menüden bulunan yöneticileri Güvenliye ekleyebilir/çıkarabilir,
            ${guardEmoji} Database verilerini tekrar yedekleyebilir,
            ${guardEmoji} Yetkileri açıp/kapatabilirsin
            ${guardEmoji} URL Spammer ile Url'ni koruyabilirsin.\n\`Spamlama işlemi 1 dakika arayla yapılmaktadır.\`
            ${codeBlock("md",
            `# Sunucu Koruma Paneli
${databaseOnly == true ? "< Database                 : Açık 🟢":"> Database                 : Kapalı 🔴"}
${urlSpammerOnly == true ? "< URL Spammer              : Açık 🟢":"> URL Spammer              : Kapalı 🔴"}
${roleGuardOnly == true ? "< Rol Koruması             : Açık 🟢":"> Rol Koruması             : Kapalı 🔴"}
${channelGuardOnly == true ? "< Kanal Koruması           : Açık 🟢":"> Kanal Koruması           : Kapalı 🔴"}
${serverGuardOnly == true ? "< Sunucu Koruması          : Açık 🟢":"> Sunucu Koruması          : Kapalı 🔴"}
${bankickGuardOnly == true ? "< Ban ve Kick Koruması     : Açık 🟢":"> Ban ve Kick Koruması     : Kapalı 🔴"}
${emojistickerGuardOnly == true ? "< Emoji ve Sticker Koruması: Açık 🟢":"> Emoji ve Sticker Koruması: Kapalı 🔴"}
${webandofflineOnly == true ? "< Web/Çevrimdışı Koruması  : Açık 🟢":"> Web/Çevrimdışı Koruması  : Kapalı 🔴"}
${guardData?.chatGuards ? "< Chat Guard Koruması      : Açık 🟢"    : "> Chat Guard Koruması      : Kapalı 🔴"}
            `)}
                    **[Unutma]** \`Not:\` __Bu panele sadece__ **Taç Sahibi <@${message.guild.ownerId}>** __ ve ${j2poncik.BotsOwners.map(x=> `<@${x}>`).join(", ")} erişebilir ve kullanabilir.__
            `)]})
          }
            }

            if (interaction.customId === "chatguard_settings") {
              // Menü aç: Reklam/Küfür/Spam/Caps toggle
              guardData = await guard.findOne({ guildID: interaction.guild.id });
              const settings = guardData?.chatGuardSettings || {};

              const reklam = typeof settings.reklam === "boolean" ? settings.reklam : global.system.Security.ReklamEngel;
              const kufur = typeof settings.kufur === "boolean" ? settings.kufur : global.system.Security.KufurEngel;
              const spam = typeof settings.spam === "boolean" ? settings.spam : global.system.Security.SpamEngel;
              const caps = typeof settings.caps === "boolean" ? settings.caps : global.system.Security.CapsEngel;

              const menu = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                  .setCustomId("chatguard_settings_menu")
                  .setPlaceholder("Chat Guard Ayarı Seç (Aç/Kapat)")
                  .setMinValues(1)
                  .setMaxValues(1)
                  .setOptions([
                    { label: `Reklam Engeli: ${reklam ? "Açık" : "Kapalı"}`, value: "toggle_reklam", description: "Invite/link/reklam filtreleri" },
                    { label: `Küfür Engeli: ${kufur ? "Açık" : "Kapalı"}`, value: "toggle_kufur", description: "Küfür kelime listesi" },
                    { label: `Spam Engeli: ${spam ? "Açık" : "Kapalı"}`, value: "toggle_spam", description: "Flood / hızlı mesaj" },
                    { label: `Caps Engeli: ${caps ? "Açık" : "Kapalı"}`, value: "toggle_caps", description: "Büyük harf oranı kontrolü" },
                  ])
              );

              const info = new EmbedBuilder()
                .setColor("Random")
                .setDescription(
                  `${message.member} **Chat Guard Ayarları**\n\n` +
                  `- Reklam: **${reklam ? "Açık" : "Kapalı"}**\n` +
                  `- Küfür: **${kufur ? "Açık" : "Kapalı"}**\n` +
                  `- Spam: **${spam ? "Açık" : "Kapalı"}**\n` +
                  `- Caps: **${caps ? "Açık" : "Kapalı"}**\n\n` +
                  `Menüden seçip tek tek aç/kapat yapabilirsin.`
                );

              const settingsMsg = await interaction.channel.send({ embeds: [info], components: [menu] });
              const filter2 = (i) => i.user.id === message.member.id;
              const collector2 = settingsMsg.createMessageComponentCollector({ filter: filter2, time: 30000 * 3 });

              collector2.on("collect", async (i) => {
                try {
                  await i.deferUpdate();
                  const pick = i.values?.[0];

                  const current = await guard.findOne({ guildID: i.guild.id });
                  const s = current?.chatGuardSettings || {};
                  const next = {
                    reklam: typeof s.reklam === "boolean" ? s.reklam : global.system.Security.ReklamEngel,
                    kufur: typeof s.kufur === "boolean" ? s.kufur : global.system.Security.KufurEngel,
                    spam: typeof s.spam === "boolean" ? s.spam : global.system.Security.SpamEngel,
                    caps: typeof s.caps === "boolean" ? s.caps : global.system.Security.CapsEngel,
                  };

                  if (pick === "toggle_reklam") next.reklam = !next.reklam;
                  if (pick === "toggle_kufur") next.kufur = !next.kufur;
                  if (pick === "toggle_spam") next.spam = !next.spam;
                  if (pick === "toggle_caps") next.caps = !next.caps;

                  await guard.findOneAndUpdate(
                    { guildID: i.guild.id },
                    { $set: { chatGuardSettings: next } },
                    { upsert: true }
                  );

                  // UI refresh
                  const refreshed = new EmbedBuilder()
                    .setColor("Random")
                    .setDescription(
                      `${message.member} **Chat Guard Ayarları**\n\n` +
                      `- Reklam: **${next.reklam ? "Açık" : "Kapalı"}**\n` +
                      `- Küfür: **${next.kufur ? "Açık" : "Kapalı"}**\n` +
                      `- Spam: **${next.spam ? "Açık" : "Kapalı"}**\n` +
                      `- Caps: **${next.caps ? "Açık" : "Kapalı"}**\n\n` +
                      `Menüden seçip tek tek aç/kapat yapabilirsin.`
                    );

                  const refreshedMenu = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                      .setCustomId("chatguard_settings_menu")
                      .setPlaceholder("Chat Guard Ayarı Seç (Aç/Kapat)")
                      .setMinValues(1)
                      .setMaxValues(1)
                      .setOptions([
                        { label: `Reklam Engeli: ${next.reklam ? "Açık" : "Kapalı"}`, value: "toggle_reklam", description: "Invite/link/reklam filtreleri" },
                        { label: `Küfür Engeli: ${next.kufur ? "Açık" : "Kapalı"}`, value: "toggle_kufur", description: "Küfür kelime listesi" },
                        { label: `Spam Engeli: ${next.spam ? "Açık" : "Kapalı"}`, value: "toggle_spam", description: "Flood / hızlı mesaj" },
                        { label: `Caps Engeli: ${next.caps ? "Açık" : "Kapalı"}`, value: "toggle_caps", description: "Büyük harf oranı kontrolü" },
                      ])
                  );

                  await settingsMsg.edit({ embeds: [refreshed], components: [refreshedMenu] }).catch(() => {});
                } catch (e) {
                  console.error("chatguard_settings_menu error:", e);
                }
              });

              collector2.on("end", async () => {
                settingsMsg.edit({ components: [] }).catch(() => {});
              });
            }
            if(interaction.customId == "urlspammer"){
              if(!message.guild.vanityURLCode || message.guild.vanityURLCode == null) return interaction.channel.send({content:`Özel URL'ye sahip olmadığınız için bu sistemi kullanamazsınız.`})
              urlSpammerOnly = guardData ? guardData.UrlSpammer : false
        webandofflineOnly = guardData ? guardData.webAndofflineGuard :false
        
          if(urlSpammerOnly == true){
            await guard.findOneAndUpdate({guildID:interaction.guild.id},{$set:{UrlSpammer:false}},{upsert:true})
            exec('pm2 stop ../../../../../J2pon-Guard/UrlSpammer/body.js', (error, stdout, stderr) => {
              if (error) {
                console.error(`Bir hata oluştu: ${error}`);
                return;
              }
              
              console.log(`Çıktı: ${stdout}`);
              console.error(`Hata: ${stderr}`);
            });    guardData = await guard.findOne({guildID:interaction.guild.id})
        serverGuardOnly = guardData ? guardData.serverGuard : false
        databaseOnly = guardData ? guardData.database : false
        chatGuardOnly = guardData ? guardData.chatGuards :false
        roleGuardOnly = guardData ? guardData.rolesGuard : false
        channelGuardOnly = guardData ? guardData.channelsGuard : false
        bankickGuardOnly = guardData ? guardData.banKickGuard : false
        emojistickerGuardOnly = guardData ? guardData.emojiStickersGuard : false
        urlSpammerOnly = guardData ? guardData.UrlSpammer : false
        webandofflineOnly = guardData ? guardData.webAndofflineGuard :false
            await msg.edit({embeds:[byj2ponembed.setDescription(`Merhaba ${message.member} Guard Yönetim ve Kontrol Paneline Hoşgeldin,
            ${guardEmoji} Aşağıda bulunan butonlardan korumaları açıp/kapatabilir,
            ${guardEmoji} Menüden bulunan yöneticileri Güvenliye ekleyebilir/çıkarabilir,
            ${guardEmoji} Database verilerini tekrar yedekleyebilir,
            ${guardEmoji} Yetkileri açıp/kapatabilirsin
            ${guardEmoji} URL Spammer ile Url'ni koruyabilirsin.\n\`Spamlama işlemi 1 dakika arayla yapılmaktadır.\`
            ${codeBlock("md",
            `# Sunucu Koruma Paneli
${databaseOnly == true ? "< Database                 : Açık 🟢":"> Database                 : Kapalı 🔴"}
${urlSpammerOnly == true ? "< URL Spammer              : Açık 🟢":"> URL Spammer              : Kapalı 🔴"}
${roleGuardOnly == true ? "< Rol Koruması             : Açık 🟢":"> Rol Koruması             : Kapalı 🔴"}
${channelGuardOnly == true ? "< Kanal Koruması           : Açık 🟢":"> Kanal Koruması           : Kapalı 🔴"}
${serverGuardOnly == true ? "< Sunucu Koruması          : Açık 🟢":"> Sunucu Koruması          : Kapalı 🔴"}
${bankickGuardOnly == true ? "< Ban ve Kick Koruması     : Açık 🟢":"> Ban ve Kick Koruması     : Kapalı 🔴"}
${emojistickerGuardOnly == true ? "< Emoji ve Sticker Koruması: Açık 🟢":"> Emoji ve Sticker Koruması: Kapalı 🔴"}
${webandofflineOnly == true ? "< Web/Çevrimdışı Koruması  : Açık 🟢":"> Web/Çevrimdışı Koruması  : Kapalı 🔴"}
${chatGuardOnly == true ? "< Chat Guard Koruması      : Açık 🟢"    : "> Chat Guard Koruması      : Kapalı 🔴"}
            `)}
                    **[Unutma]** \`Not:\` __Bu panele sadece__ **Taç Sahibi <@${message.guild.ownerId}>** __ ve ${j2poncik.BotsOwners.map(x=> `<@${x}>`).join(", ")} erişebilir ve kullanabilir.__
            `)]})
          }else{
            await guard.findOneAndUpdate({guildID:interaction.guild.id},{$set:{UrlSpammer:true}},{upsert:true})
            exec('pm2 start  ../../../../../J2pon-Guard/UrlSpammer/body.js', (error, stdout, stderr) => {
              if (error) {
                console.error(`Bir hata oluştu: ${error}`);
                return;
              }              
              console.log(`Çıktı: ${stdout}`);
              console.error(`Hata: ${stderr}`);
            });
            guardData = await guard.findOne({guildID:interaction.guild.id})
        serverGuardOnly = guardData ? guardData.serverGuard : false
        roleGuardOnly = guardData ? guardData.rolesGuard : false
        channelGuardOnly = guardData ? guardData.channelsGuard : false
        bankickGuardOnly = guardData ? guardData.banKickGuard : false
        emojistickerGuardOnly = guardData ? guardData.emojiStickersGuard : false
        urlSpammerOnly = guardData ? guardData.UrlSpammer : false
        chatGuardOnly = guardData ? guardData.chatGuards :false

        webandofflineOnly = guardData ? guardData.webAndofflineGuard :false
            await msg.edit({embeds:[byj2ponembed.setDescription(`Merhaba ${message.member} Guard Yönetim ve Kontrol Paneline Hoşgeldin,
            ${guardEmoji} Aşağıda bulunan butonlardan korumaları açıp/kapatabilir,
            ${guardEmoji} Menüden bulunan yöneticileri Güvenliye ekleyebilir/çıkarabilir,
            ${guardEmoji} Database verilerini tekrar yedekleyebilir,
            ${guardEmoji} Yetkileri açıp/kapatabilirsin
            ${guardEmoji} URL Spammer ile Url'ni koruyabilirsin.\n\`Spamlama işlemi 1 dakika arayla yapılmaktadır.\`
            ${codeBlock("md",
            `# Sunucu Koruma Paneli
${databaseOnly == true ? "< Database                 : Açık 🟢":"> Database                 : Kapalı 🔴"}
${urlSpammerOnly == true ? "< URL Spammer              : Açık 🟢":"> URL Spammer              : Kapalı 🔴"}
${roleGuardOnly == true ? "< Rol Koruması             : Açık 🟢":"> Rol Koruması             : Kapalı 🔴"}
${channelGuardOnly == true ? "< Kanal Koruması           : Açık 🟢":"> Kanal Koruması           : Kapalı 🔴"}
${serverGuardOnly == true ? "< Sunucu Koruması          : Açık 🟢":"> Sunucu Koruması          : Kapalı 🔴"}
${bankickGuardOnly == true ? "< Ban ve Kick Koruması     : Açık 🟢":"> Ban ve Kick Koruması     : Kapalı 🔴"}
${emojistickerGuardOnly == true ? "< Emoji ve Sticker Koruması: Açık 🟢":"> Emoji ve Sticker Koruması: Kapalı 🔴"}
${webandofflineOnly == true ? "< Web/Çevrimdışı Koruması  : Açık 🟢":"> Web/Çevrimdışı Koruması  : Kapalı 🔴"}
${chatGuardOnly == true ? "< Chat Guard Koruması      : Açık 🟢"    : "> Chat Guard Koruması      : Kapalı 🔴"}
            `)}
                    **[Unutma]** \`Not:\` __Bu panele sadece__ **Taç Sahibi <@${message.guild.ownerId}>** __ ve ${j2poncik.BotsOwners.map(x=> `<@${x}>`).join(", ")} erişebilir ve kullanabilir.__
            `)]})
          }
            }
            if(interaction.customId == "yetkiac"){
            interaction.channel.send({embeds:[
              new EmbedBuilder()
              .setDescription(`Sunucuda bulunan rollerde ki yetkileri açmak veya kapatmak için aşağıda ki butonları kullanınız!`)
            ],
          components:[
            new ActionRowBuilder()
            .setComponents(
              new ButtonBuilder().setCustomId("ac").setLabel("Yetkileri Aç").setStyle(ButtonStyle.Danger),
              new ButtonBuilder().setCustomId("kapat").setLabel("Yetkileri Kapat").setStyle(ButtonStyle.Success)
            )
          ]})
          .then(async ytMSG=>{
            const filter = d => d.user.id == message.member.id 
          const collector = ytMSG.createMessageComponentCollector({ filter: filter,  errors: ["time"], time: 30000*10 })
          collector.on('collect', async (ytInteraction) => {
          await ytInteraction.deferUpdate();
        if(ytInteraction.customId == "ac"){
        let rolepData = await rolePermissions.find();
        if(!rolepData || rolepData.length == 0) return ytInteraction.channel.send({content:`Veri bulunamadı!`});
        rolepData.forEach(async data =>{
        let role = ytInteraction.guild.roles.cache.get(data.roleID);
        if(!role) return;
        if(!role.editable) return;
        role.setPermissions(new PermissionsBitField(data.BitField))
        ytInteraction.channel.send({embeds:[
          new EmbedBuilder().setDescription(`\`${role.name}\` isimli role **${data.BitField}** yetkisi verildi!`)
        ]})
        await guardPenalty.findOneAndUpdate({guildID:message.guild.id,j2ponnew:message.member.id},{$push:{işlemler:{Güvenilir:safedMembers.some(id => id == message.member.id),işlem:`${role.name} ${data.BitField} ✅`,Tarih:Date.now()}}},{upsert:true})
        await rolePermissions.findOneAndDelete({roleID:role.id},{upsert:true})
        })
        
        }
        if(ytInteraction.customId == "kapat"){
          let roles =   ytInteraction.guild.roles.cache.filter(r => r.editable && (r.permissions.has(PermissionsBitField.Flags.Administrator) || r.permissions.has(PermissionsBitField.Flags.ManageGuild) || r.permissions.has(PermissionsBitField.Flags.ManageRoles) || r.permissions.has(PermissionsBitField.Flags.ManageWebhooks) || r.permissions.has(PermissionsBitField.Flags.BanMembers) || r.permissions.has(PermissionsBitField.Flags.KickMembers)|| r.permissions.has(PermissionsBitField.Flags.ModerateMembers)))
          if(roles.size == 0) return   ytInteraction.channel.send({embeds:[
            new EmbedBuilder()
            .setDescription(`Sunucuda yetkisi kapatılıcak rol bulunamadı veya yetersiz yetkim bulunuyor.`)
          ]})
          ytInteraction.guild.roles.cache.filter(r => r.editable && (r.permissions.has(PermissionsBitField.Flags.Administrator) || r.permissions.has(PermissionsBitField.Flags.ManageGuild) || r.permissions.has(PermissionsBitField.Flags.ManageRoles) || r.permissions.has(PermissionsBitField.Flags.ManageWebhooks) || r.permissions.has(PermissionsBitField.Flags.BanMembers) || r.permissions.has(PermissionsBitField.Flags.KickMembers)|| r.permissions.has(PermissionsBitField.Flags.ModerateMembers))).forEach(async r => {
            await rolePermissions.findOneAndUpdate({roleID:r.id},{$set:{BitField:r.permissions.bitfield}},{upsert:true})
            await r.setPermissions(PermissionsBitField.Flags.SendMessages);
          });
          ytInteraction.channel.send({embeds:[
            new EmbedBuilder()
            .setDescription(`Aşağıdaki rollerin yetkileri kapatılmıştır.`)
            .setFields({name:`Roller \`(${roles.size})\``,value:`${roles.map(x=> `\`${x.rawPosition}.\` **> ${x.name} [~~${x.permissions.bitfield}~~]**`).join("\n")}`})
          ]})
          await guardPenalty.findOneAndUpdate({guildID:message.guild.id,j2ponnew:message.member.id},{$push:{işlemler:{Güvenilir:safedMembers.some(id => id == message.member.id),işlem:`${role.name} ${data.BitField} ❌`,Tarih:Date.now()}}},{upsert:true})
        
        }
          })
          })
            }
          for (let index = 0; index < adminmenu.length; index++) {
            const element = adminmenu[index];
            if(interaction.values && interaction.values[0] == element.value){
              let admin = interaction.guild.members.cache.get(element.value)
              let guardp = await guardPenalty.findOne({j2ponnew:admin.id});
              let guardsicil = guardp ? guardp.işlemler : [];
        let adminembed = new EmbedBuilder().setAuthor({name:admin.user.tag,iconURL:admin.user.avatarURL()})
              .setDescription(`<t:${(admin.joinedTimestamp/1000).toFixed()}> Tarihinden beri sunucuda bulunuyor.`)
                .addFields({name:`👤 Kullanıcı Bilgisi`,value:`
        \`${guardEmoji}\` ID: \`${admin.id}\`
        \`${guardEmoji}\` Profil: ${admin}`,inline:true})
              if(guardsicil.length > 0){
              adminembed.addFields({name:"Son 10 İşlemi",value:`**${guardsicil.sort((a,b)=> b.Tarih -a.Tarih).map(x=> `[${x.Güvenilir == true ? "✅" : "❌"} | <t:${(x.Tarih/1000).toFixed()}>] ${x.işlem} `).splice(0,10).join("\n")}**`})
              }
        
              interaction.channel.send({embeds:[
                adminembed
              ]})
            }
          }
        
          })
        })


     },

  };