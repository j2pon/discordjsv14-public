const { PermissionsBitField, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require("discord.js");
const moment = require("moment");
const ceza = require("../../../../../../Global/Schemas/ceza");
const cezapuan = require("../../../../../../Global/Schemas/cezapuan");
const jailLimit = new Map();
const ms = require("ms");
const setup = require("../../../../../../Global/Settings/Setup.json");
const system = require("../../../../../../Global/Settings/System");
const kanal = require("../../../../../../Global/Settings/AyarName");
const emojis = require("../../../../../../Global/Settings/Emojis.json");

moment.locale("tr");

module.exports = {
    name: "jail",
    description: "Bellirttiğiniz kullanıcıyı karantinaya atar",
    category: "STAFF",
    cooldown: 0,
    command: {
      enabled: true,  
      aliases: ["karantina","cezalı"],
      usage: ".jail <@user/ID>",
    },
  

    onLoad: function (client) { },

    onCommand: async function (client, message, args) {

        const allowedChannels = kanal.KomutKullanımKanalİsim || [];
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && 
            !allowedChannels.includes(message.channel.name)) {
            return message.reply({ 
                content: `${kanal.formatAllowedChannels ? kanal.formatAllowedChannels(client) : allowedChannels.map(x => `${client.channels.cache.find(chan => chan.name == x) || `\`${x}\``}`)} kanallarında kullanabilirsiniz.`
            }).then((e) => setTimeout(() => { e.delete().catch(() => {}); }, 10000)); 
        }

        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && 
            !setup.JailHammer.some(x => message.member.roles.cache.has(x)) &&
            !setup.SponsorRoles.some(x => message.member.roles.cache.has(x))) {
            message.react(`${client.emoji("server_carpi")}`);
            return message.channel.send({ content: "Yeterli yetkin bulunmuyor!" })
                .then((e) => setTimeout(() => { e.delete().catch(() => {}); }, 5000)); 
        }
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) { message.channel.send({ content:"Bir üye belirtmelisin!"}).then((e) => setTimeout(() => { e.delete().catch(() => {}); }, 5000));
        message.react(`${client.emoji("server_carpi")}`) 
        return }
        if (setup.JailedRoles.some(x => member.roles.cache.has(x))) {
            message.react(`${client.emoji("server_carpi")}`);
            return message.channel.send({ content: "Bu üye zaten jailde!" })
                .then((e) => setTimeout(() => { e.delete().catch(() => {}); }, 5000));
        }
        
        if (message.member.roles.highest.position <= member.roles.highest.position) {
            return message.channel.send({ content: "Kendinle aynı yetkide ya da daha yetkili olan birini jailleyemezsin!" });
        }
        
        if (!member.manageable) {
            return message.channel.send({ content: "Bu üyeyi jailleyemiyorum!" });
        }
        
        if (system.Mainframe.jaillimit > 0 && 
            jailLimit.has(message.author.id) && 
            jailLimit.get(message.author.id) >= system.Mainframe.jaillimit) {
            message.react(`${client.emoji("server_carpi")}`);
            return message.channel.send({ content: "Saatlik jail sınırına ulaştın!" })
                .then((e) => setTimeout(() => { e.delete().catch(() => {}); }, 5000)); 
        }

        let logChannel = client.channels.cache.find(x => x.name === "jail_log");
        let punishmentLogChannel = client.channels.cache.find(x => x.name === "cezapuan-log");
        if(!logChannel) {
          let hello = new Error("JAİL LOG KANALI AYARLANMAMIS! LUTFEN SETUPTAN KURULUMU YAPINIZ!");
          console.log(hello);
        }
        if(!punishmentLogChannel) {
          let hello = new Error("CEZA PUAN LOG KANALI AYARLANMAMIS! LUTFEN SETUPTAN KURULUMU YAPINIZ!");
          console.log(hello);
        }
        
          
        const row = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('jail')
                .setPlaceholder(`Jail cezaları`)
                .addOptions([
                    { label: 'Cinsellik, taciz ve ağır hakaret', description: '1 Hafta', value: 'jail1', emoji: emojis.server_carpi },
                    { label: 'Sunucu kurallarına uyum sağlamamak', description: '3 Gün', value: 'jail2', emoji: emojis.server_carpi },
                    { label: 'Sesli/Mesajlı/Ekran P. DM Taciz)', description: '1 Gün', value: 'jail3', emoji: emojis.server_carpi },
                    { label: 'Dini, Irki ve Siyasi değerlere Hakaret', description: '1 Ay', value: 'jail4', emoji: emojis.server_carpi },
                    { label: 'Abartı rahatsız edici yaklaşımda bulunmak', description: '2 Hafta', value: 'jail5', emoji: emojis.server_carpi },
                    { label: 'Sunucu içerisi abartı trol / Kayıt trol yapmak', description: '3 Gün', value: 'jail6', emoji: emojis.server_carpi },
                    { label: 'Sunucu Kötüleme / Saygısız Davranış', description: '1 Ay', value: 'jail7', emoji: emojis.server_carpi },
                ]),
        );
    
    const duration = args[1] ? ms(args[1]) : undefined;
    
    if (duration) {
      const reason = args.slice(2).join(" ") || "Belirtilmedi!";
    
      await ceza.findOneAndUpdate({ guildID: message.guild.id, userID: member.user.id }, { $push: { ceza: 1 } }, { upsert: true });
      await ceza.findOneAndUpdate({ guildID: message.guild.id, userID: member.user.id }, { $inc: { top: 1 } }, { upsert: true });
      await ceza.findOneAndUpdate({ guildID: message.guild.id, userID: message.author.id }, { $inc: { JailAmount: 1 } }, {upsert: true});
      
      await cezapuan.findOneAndUpdate({ guildID: message.guild.id, userID: member.user.id }, { $inc: { cezapuan: 15 } }, { upsert: true });
      const cezapuanData = await cezapuan.findOne({ guildID: message.guild.id, userID: member.user.id });
      punishmentLogChannel.send({ content: `${member} üyesi ban cezası alarak toplam \`${cezapuanData ? cezapuanData.cezapuan : 0} ceza puanına\` ulaştı!`})
      member.roles.cache.has(setup.BoosterRole) ? member.roles.set([setup.BoosterRole, setup.JailedRoles[0]]) : member.roles.set(setup.JailedRoles)
      message.react(`${client.emoji("server_onay")}`)
      const penal = await client.penalize(message.guild.id, member.id, 'Jail', true, message.author.id, reason, true, Math.floor(Date.now() + duration))
      if (msg) msg.delete().catch(() => {});
      await message.channel.send({ embeds: [new EmbedBuilder().setDescription(` ${member.toString()} kullanıcısı başarıyla **"${reason}"** sebebiyle <t:${Math.floor((Date.now() + duration) / 1000)}:R> süre boyunca karantinaya atıldı. (Ceza Numarası: \`#${penal.id}\`)`)]})
      if (system.Mainframe.dmMessages) member.send({ content:`**${message.guild.name}** sunucusunda, **${message.author.tag}** tarafından, **${reason}** sebebiyle, <t:${Math.floor((Date.now() + duration) / 1000)}:R>'ya kadar jaillendiniz.`}).catch(() => {});
      
      const log = new EmbedBuilder()
            .setDescription(`
           **${member.user.tag}** adlı kullanıcıya **${message.author.tag}** tarafından Jail atıldı. Ceza Numarası: (\`${penal.id}\`)        
            `)
            .addFields(
{ name: "Cezalandırılan", value: `${member ? member.toString() : user.username}`, inline: true},
{ name: "Cezalandıran", value: `${message.author}`, inline: true},
{ name: "Ceza Bitiş", value: `<t:${Math.floor((Date.now() + duration) / 1000)}:R>`, inline: true},
{ name: "Ceza Sebebi", value: `\`\`\`fix\n${reason}\n\`\`\``, inline: false},
            )
            .setFooter({ text:`${moment(Date.now()).format("LLL")} (Ceza ID: #${penal.id})`})
          await logChannel.send({ embeds : [log]});
        
    
      if (system.Mainframe.jaillimit > 0) {
        if (!jailLimit.has(message.author.id)) jailLimit.set(message.author.id, 1);
        else jailLimit.set(message.author.id, jailLimit.get(message.author.id) + 1);
        setTimeout(() => {
          if (jailLimit.has(message.author.id)) jailLimit.delete(message.author.id);
        }, 1000 * 60 * 60);
      }
    } else if (!duration) {
      var msg = await message.channel.send({ embeds: [new EmbedBuilder()
      .setAuthor({name:message.guild.name,iconURL:message.guild.iconURL()})
      .setDescription(`Aşağıda bulunan menüden cezalıya atmak istediğiniz ${member.toString()} için uygun olan ceza sebebini ve süresini seçiniz!`)],
      components: [row]})
    }
    
    if (msg) {
        const filter = i => i.user.id === message.member.id;
        const collector = await msg.createMessageComponentCollector({ filter: filter, time: 30000 });

    collector.on("collect", async (interaction) => {
    
    if (interaction.values[0] === "jail1") {
    await interaction.deferUpdate();
    const duration = ms("1w");
    const reason = "Cinsellik, taciz ve ağır hakaret";
    
    await ceza.findOneAndUpdate({ guildID: message.guild.id, userID: member.user.id }, { $push: { ceza: 1 } }, { upsert: true });
    await ceza.findOneAndUpdate({ guildID: message.guild.id, userID: member.user.id }, { $inc: { top: 1 } }, { upsert: true });
    await ceza.findOneAndUpdate({ guildID: message.guild.id, userID: message.author.id }, { $inc: { JailAmount: 1 } }, {upsert: true});
    
    await cezapuan.findOneAndUpdate({ guildID: message.guild.id, userID: member.user.id }, { $inc: { cezapuan: 15 } }, { upsert: true });
    const cezapuanData = await cezapuan.findOne({ guildID: message.guild.id, userID: member.user.id });
    punishmentLogChannel.send({ content: `${member} üyesi ban cezası alarak toplam \`${cezapuanData ? cezapuanData.cezapuan : 0} ceza puanına\` ulaştı!`})
    member.roles.cache.has(setup.BoosterRole) ? member.roles.set([setup.BoosterRole, setup.JailedRoles[0]]) : member.roles.set(setup.JailedRoles)
    message.react(`${client.emoji("server_onay")}`)
    const penal = await client.penalize(message.guild.id, member.id, 'Jail', true, message.author.id, reason, true, Math.floor(Date.now() + duration))
    if (msg) msg.delete().catch(() => {});
    await message.channel.send({ embeds: [new EmbedBuilder().setDescription(` ${member.toString()} kullanıcısı başarıyla **"${reason}"** sebebiyle <t:${Math.floor((Date.now() + duration) / 1000)}:R> süre boyunca karantinaya atıldı. (Ceza Numarası: \`#${penal.id}\`)`)]})
    if (system.Mainframe.dmMessages) member.send({ content:`**${message.guild.name}** sunucusunda, **${message.author.tag}** tarafından, **${reason}** sebebiyle, <t:${Math.floor((Date.now() + duration) / 1000)}:R>'ya kadar jaillendiniz.`}).catch(() => {});
    
    const log = new EmbedBuilder()
    .setDescription(`
   **${member.user.tag}** adlı kullanıcıya **${message.author.tag}** tarafından Jail atıldı. Ceza Numarası: (\`${penal.id}\`)        
    `)
    .addFields(
        { name: "Cezalandırılan", value: `${member ? member.toString() : user.username}`, inline: true},
        { name: "Cezalandıran", value: `${message.author}`, inline: true},
        { name: "Ceza Bitiş", value: `<t:${Math.floor((Date.now() + duration) / 1000)}:R>`, inline: true},
        { name: "Ceza Sebebi", value: `\`\`\`fix\n${reason}\n\`\`\``, inline: false},
                    )
   .setFooter({ text:`${moment(Date.now()).format("LLL")} (Ceza ID: #${penal.id})` })
    
    await logChannel.send({ embeds: [log]});
    
    if (system.Mainframe.jaillimit > 0) {
      if (!jailLimit.has(message.author.id)) jailLimit.set(message.author.id, 1);
      else jailLimit.set(message.author.id, jailLimit.get(message.author.id) + 1);
      setTimeout(() => {
        if (jailLimit.has(message.author.id)) jailLimit.delete(message.author.id);
      }, 1000 * 60 * 60);
    }
    }
    
    if (interaction.values[0] === "jail2") {
    await interaction.deferUpdate();
    const duration = ms("3d");
    const reason = "Sunucu kurallarına uyum sağlamamak";
    
    await ceza.findOneAndUpdate({ guildID: message.guild.id, userID: member.user.id }, { $push: { ceza: 1 } }, { upsert: true });
    await ceza.findOneAndUpdate({ guildID: message.guild.id, userID: member.user.id }, { $inc: { top: 1 } }, { upsert: true });
    await ceza.findOneAndUpdate({ guildID: message.guild.id, userID: message.author.id }, { $inc: { JailAmount: 1 } }, {upsert: true});
    
    await cezapuan.findOneAndUpdate({ guildID: message.guild.id, userID: member.user.id }, { $inc: { cezapuan: 15 } }, { upsert: true });
    const cezapuanData = await cezapuan.findOne({ guildID: message.guild.id, userID: member.user.id });
    punishmentLogChannel.send({ content: `${member} üyesi ban cezası alarak toplam \`${cezapuanData ? cezapuanData.cezapuan : 0} ceza puanına\` ulaştı!`})
    member.roles.cache.has(setup.BoosterRole) ? member.roles.set([setup.BoosterRole, setup.JailedRoles[0]]) : member.roles.set(setup.JailedRoles)
    message.react(`${client.emoji("server_onay")}`)
    const penal = await client.penalize(message.guild.id, member.id, 'Jail', true, message.author.id, reason, true, Math.floor(Date.now() + duration))
    
    if (msg) msg.delete().catch(() => {});
    await message.channel.send({ embeds: [new EmbedBuilder().setDescription(` ${member.toString()} kullanıcısı başarıyla **"${reason}"** sebebiyle <t:${Math.floor((Date.now() + duration) / 1000)}:R> süre boyunca karantinaya atıldı. (Ceza Numarası: \`#${penal.id}\`)`)]})
    if (system.Mainframe.dmMessages) member.send({ content:`**${message.guild.name}** sunucusunda, **${message.author.tag}** tarafından, **${reason}** sebebiyle, <t:${Math.floor((Date.now() + duration) / 1000)}:R>'ya kadar jaillendiniz.`}).catch(() => {});
    
    const log = new EmbedBuilder()
    .setDescription(`
   **${member.user.tag}** adlı kullanıcıya **${message.author.tag}** tarafından Jail atıldı. Ceza Numarası: (\`${penal.id}\`)        
    `)
    .addFields(
        { name: "Cezalandırılan", value: `${member ? member.toString() : user.username}`, inline: true},
        { name: "Cezalandıran", value: `${message.author}`, inline: true},
        { name: "Ceza Bitiş", value: `<t:${Math.floor((Date.now() + duration) / 1000)}:R>`, inline: true},
        { name: "Ceza Sebebi", value: `\`\`\`fix\n${reason}\n\`\`\``, inline: false},
                    )
   .setFooter({ text:`${moment(Date.now()).format("LLL")} (Ceza ID: #${penal.id})` })
    
    await logChannel.send({ embeds: [log]});
    
    if (system.Mainframe.jaillimit > 0) {
      if (!jailLimit.has(message.author.id)) jailLimit.set(message.author.id, 1);
      else jailLimit.set(message.author.id, jailLimit.get(message.author.id) + 1);
      setTimeout(() => {
        if (jailLimit.has(message.author.id)) jailLimit.delete(message.author.id);
      }, 1000 * 60 * 60);
    }
    }
    
    if (interaction.values[0] === "jail3") {
    await interaction.deferUpdate();
    const duration = ms("1d");
    const reason = "Sesli/Mesajlı/Ekran P. DM Taciz";
    
    await ceza.findOneAndUpdate({ guildID: message.guild.id, userID: member.user.id }, { $push: { ceza: 1 } }, { upsert: true });
    await ceza.findOneAndUpdate({ guildID: message.guild.id, userID: member.user.id }, { $inc: { top: 1 } }, { upsert: true });
    await ceza.findOneAndUpdate({ guildID: message.guild.id, userID: message.author.id }, { $inc: { JailAmount: 1 } }, {upsert: true});
    
    await cezapuan.findOneAndUpdate({ guildID: message.guild.id, userID: member.user.id }, { $inc: { cezapuan: 15 } }, { upsert: true });
    const cezapuanData = await cezapuan.findOne({ guildID: message.guild.id, userID: member.user.id });
    punishmentLogChannel.send({ content: `${member} üyesi ban cezası alarak toplam \`${cezapuanData ? cezapuanData.cezapuan : 0} ceza puanına\` ulaştı!`})
    member.roles.cache.has(setup.BoosterRole) ? member.roles.set([setup.BoosterRole, setup.JailedRoles[0]]) : member.roles.set(setup.JailedRoles)
    message.react(`${client.emoji("server_onay")}`)
    const penal = await client.penalize(message.guild.id, member.id, 'Jail', true, message.author.id, reason, true, Math.floor(Date.now() + duration))
    
    if (msg) msg.delete().catch(() => {});
    await message.channel.send({ embeds: [new EmbedBuilder().setDescription(` ${member.toString()} kullanıcısı başarıyla **"${reason}"** sebebiyle <t:${Math.floor((Date.now() + duration) / 1000)}:R> süre boyunca karantinaya atıldı. (Ceza Numarası: \`#${penal.id}\`)`)]})
    if (system.Mainframe.dmMessages) member.send({ content:`**${message.guild.name}** sunucusunda, **${message.author.tag}** tarafından, **${reason}** sebebiyle, <t:${Math.floor((Date.now() + duration) / 1000)}:R>'ya kadar jaillendiniz.`}).catch(() => {});
    
    const log = new EmbedBuilder()
    .setDescription(`
   **${member.user.tag}** adlı kullanıcıya **${message.author.tag}** tarafından Jail atıldı. Ceza Numarası: (\`${penal.id}\`)        
    `)
    .addFields(
        { name: "Cezalandırılan", value: `${member ? member.toString() : user.username}`, inline: true},
        { name: "Cezalandıran", value: `${message.author}`, inline: true},
        { name: "Ceza Bitiş", value: `<t:${Math.floor((Date.now() + duration) / 1000)}:R>`, inline: true},
        { name: "Ceza Sebebi", value: `\`\`\`fix\n${reason}\n\`\`\``, inline: false},
                    )
    .setFooter({ text:`${moment(Date.now()).format("LLL")}` })
    
    await logChannel.send({ embeds: [log]});
    
    if (system.Mainframe.jaillimit > 0) {
      if (!jailLimit.has(message.author.id)) jailLimit.set(message.author.id, 1);
      else jailLimit.set(message.author.id, jailLimit.get(message.author.id) + 1);
      setTimeout(() => {
        if (jailLimit.has(message.author.id)) jailLimit.delete(message.author.id);
      }, 1000 * 60 * 60);
    }
    }
    
    if (interaction.values[0] === "jail4") {
    await interaction.deferUpdate();
    const duration = ms("4w");
    const reason = "Dini, Irki ve Siyasi değerlere Hakaret";
    
    await ceza.findOneAndUpdate({ guildID: message.guild.id, userID: member.user.id }, { $push: { ceza: 1 } }, { upsert: true });
    await ceza.findOneAndUpdate({ guildID: message.guild.id, userID: member.user.id }, { $inc: { top: 1 } }, { upsert: true });
    await ceza.findOneAndUpdate({ guildID: message.guild.id, userID: message.author.id }, { $inc: { JailAmount: 1 } }, {upsert: true});
    
    await cezapuan.findOneAndUpdate({ guildID: message.guild.id, userID: member.user.id }, { $inc: { cezapuan: 15 } }, { upsert: true });
    const cezapuanData = await cezapuan.findOne({ guildID: message.guild.id, userID: member.user.id });
    punishmentLogChannel.send({ content: `${member} üyesi ban cezası alarak toplam \`${cezapuanData ? cezapuanData.cezapuan : 0} ceza puanına\` ulaştı!`})
    member.roles.cache.has(setup.BoosterRole) ? member.roles.set([setup.BoosterRole, setup.JailedRoles[0]]) : member.roles.set(setup.JailedRoles)
    message.react(`${client.emoji("server_onay")}`)
    const penal = await client.penalize(message.guild.id, member.id, 'Jail', true, message.author.id, reason, true, Math.floor(Date.now() + duration))
    
    if (msg) msg.delete().catch(() => {});
    await message.channel.send({ embeds: [new EmbedBuilder().setDescription(` ${member.toString()} kullanıcısı başarıyla **"${reason}"** sebebiyle <t:${Math.floor((Date.now() + duration) / 1000)}:R> süre boyunca karantinaya atıldı. (Ceza Numarası: \`#${penal.id}\`)`)]})
    if (system.Mainframe.dmMessages) member.send({ content:`**${message.guild.name}** sunucusunda, **${message.author.tag}** tarafından, **${reason}** sebebiyle, <t:${Math.floor((Date.now() + duration) / 1000)}:R>'ya kadar jaillendiniz.`}).catch(() => {});
    
    const log = new EmbedBuilder()
    .setDescription(`
   **${member.user.tag}** adlı kullanıcıya **${message.author.tag}** tarafından Jail atıldı. Ceza Numarası: (\`${penal.id}\`)        
    `)
    .addFields(
        { name: "Cezalandırılan", value: `${member ? member.toString() : user.username}`, inline: true},
        { name: "Cezalandıran", value: `${message.author}`, inline: true},
        { name: "Ceza Bitiş", value: `<t:${Math.floor((Date.now() + duration) / 1000)}:R>`, inline: true},
        { name: "Ceza Sebebi", value: `\`\`\`fix\n${reason}\n\`\`\``, inline: false},
                    )
   .setFooter({ text:`${moment(Date.now()).format("LLL")} (Ceza ID: #${penal.id})` })
    
    await logChannel.send({ embeds: [log]});
    
    if (system.Mainframe.jaillimit > 0) {
      if (!jailLimit.has(message.author.id)) jailLimit.set(message.author.id, 1);
      else jailLimit.set(message.author.id, jailLimit.get(message.author.id) + 1);
      setTimeout(() => {
        if (jailLimit.has(message.author.id)) jailLimit.delete(message.author.id);
      }, 1000 * 60 * 60);
    }
    }
    
    if (interaction.values[0] === "jail5") {
    await interaction.deferUpdate();
    const duration = ms("2w");
    const reason = "Abartı rahatsız edici yaklaşımda bulunmak!";
    
    await ceza.findOneAndUpdate({ guildID: message.guild.id, userID: member.user.id }, { $push: { ceza: 1 } }, { upsert: true });
    await ceza.findOneAndUpdate({ guildID: message.guild.id, userID: member.user.id }, { $inc: { top: 1 } }, { upsert: true });
    await ceza.findOneAndUpdate({ guildID: message.guild.id, userID: message.author.id }, { $inc: { JailAmount: 1 } }, {upsert: true});
    
    await cezapuan.findOneAndUpdate({ guildID: message.guild.id, userID: member.user.id }, { $inc: { cezapuan: 15 } }, { upsert: true });
    const cezapuanData = await cezapuan.findOne({ guildID: message.guild.id, userID: member.user.id });
    punishmentLogChannel.send({ content: `${member} üyesi ban cezası alarak toplam \`${cezapuanData ? cezapuanData.cezapuan : 0} ceza puanına\` ulaştı!`})
    member.roles.cache.has(setup.BoosterRole) ? member.roles.set([setup.BoosterRole, setup.JailedRoles[0]]) : member.roles.set(setup.JailedRoles)
    message.react(`${client.emoji("server_onay")}`)
    const penal = await client.penalize(message.guild.id, member.id, 'Jail', true, message.author.id, reason, true, Math.floor(Date.now() + duration))
    
    if (msg) msg.delete().catch(() => {});
    await message.channel.send({ embeds: [new EmbedBuilder().setDescription(` ${member.toString()} kullanıcısı başarıyla **"${reason}"** sebebiyle <t:${Math.floor((Date.now() + duration) / 1000)}:R> süre boyunca karantinaya atıldı. (Ceza Numarası: \`#${penal.id}\`)`)]})
    if (system.Mainframe.dmMessages) member.send({ content:`**${message.guild.name}** sunucusunda, **${message.author.tag}** tarafından, **${reason}** sebebiyle, <t:${Math.floor((Date.now() + duration) / 1000)}:R>'ya kadar jaillendiniz.`}).catch(() => {});
    
    const log = new EmbedBuilder()
    .setDescription(`
   **${member.user.tag}** adlı kullanıcıya **${message.author.tag}** tarafından Jail atıldı. Ceza Numarası: (\`${penal.id}\`)        
    `)
    .addFields(
        { name: "Cezalandırılan", value: `${member ? member.toString() : user.username}`, inline: true},
        { name: "Cezalandıran", value: `${message.author}`, inline: true},
        { name: "Ceza Bitiş", value: `<t:${Math.floor((Date.now() + duration) / 1000)}:R>`, inline: true},
        { name: "Ceza Sebebi", value: `\`\`\`fix\n${reason}\n\`\`\``, inline: false},
                    )
   .setFooter({ text:`${moment(Date.now()).format("LLL")} (Ceza ID: #${penal.id})` })
    
    await logChannel.send({ embeds: [log]});
    
    if (system.Mainframe.jaillimit > 0) {
      if (!jailLimit.has(message.author.id)) jailLimit.set(message.author.id, 1);
      else jailLimit.set(message.author.id, jailLimit.get(message.author.id) + 1);
      setTimeout(() => {
        if (jailLimit.has(message.author.id)) jailLimit.delete(message.author.id);
      }, 1000 * 60 * 60);
    }
    }
    
    if (interaction.values[0] === "jail6") {
    await interaction.deferUpdate();
    const duration = ms("3d");
    const reason = "Sunucu içerisi abartı trol / Kayıt trol yapmak!";
    
    await ceza.findOneAndUpdate({ guildID: message.guild.id, userID: member.user.id }, { $push: { ceza: 1 } }, { upsert: true });
    await ceza.findOneAndUpdate({ guildID: message.guild.id, userID: member.user.id }, { $inc: { top: 1 } }, { upsert: true });
    await ceza.findOneAndUpdate({ guildID: message.guild.id, userID: message.author.id }, { $inc: { JailAmount: 1 } }, {upsert: true});
    
    await cezapuan.findOneAndUpdate({ guildID: message.guild.id, userID: member.user.id }, { $inc: { cezapuan: 15 } }, { upsert: true });
    const cezapuanData = await cezapuan.findOne({ guildID: message.guild.id, userID: member.user.id });
    punishmentLogChannel.send({ content: `${member} üyesi ban cezası alarak toplam \`${cezapuanData ? cezapuanData.cezapuan : 0} ceza puanına\` ulaştı!`})
    member.roles.cache.has(setup.BoosterRole) ? member.roles.set([setup.BoosterRole, setup.JailedRoles[0]]) : member.roles.set(setup.JailedRoles)
    message.react(`${client.emoji("server_onay")}`)
    const penal = await client.penalize(message.guild.id, member.id, 'Jail', true, message.author.id, reason, true, Math.floor(Date.now() + duration))
    
    if (msg) msg.delete().catch(() => {});
    await message.channel.send({ embeds: [new EmbedBuilder().setDescription(` ${member.toString()} kullanıcısı başarıyla **"${reason}"** sebebiyle <t:${Math.floor((Date.now() + duration) / 1000)}:R> süre boyunca karantinaya atıldı. (Ceza Numarası: \`#${penal.id}\`)`)]})
    if (system.Mainframe.dmMessages) member.send({ content:`**${message.guild.name}** sunucusunda, **${message.author.tag}** tarafından, **${reason}** sebebiyle, <t:${Math.floor((Date.now() + duration) / 1000)}:R>'ya kadar jaillendiniz.`}).catch(() => {});
    
    const log = new EmbedBuilder()
    .setDescription(`
   **${member.user.tag}** adlı kullanıcıya **${message.author.tag}** tarafından Jail atıldı. Ceza Numarası: (\`${penal.id}\`)        
    `)
    .addFields(
        { name: "Cezalandırılan", value: `${member ? member.toString() : user.username}`, inline: true},
        { name: "Cezalandıran", value: `${message.author}`, inline: true},
        { name: "Ceza Bitiş", value: `<t:${Math.floor((Date.now() + duration) / 1000)}:R>`, inline: true},
        { name: "Ceza Sebebi", value: `\`\`\`fix\n${reason}\n\`\`\``, inline: false},
                    )
   .setFooter({ text:`${moment(Date.now()).format("LLL")} (Ceza ID: #${penal.id})` })
    
    await logChannel.send({ embeds: [log]});
    
    if (system.Mainframe.jaillimit > 0) {
      if (!jailLimit.has(message.author.id)) jailLimit.set(message.author.id, 1);
      else jailLimit.set(message.author.id, jailLimit.get(message.author.id) + 1);
      setTimeout(() => {
        if (jailLimit.has(message.author.id)) jailLimit.delete(message.author.id);
      }, 1000 * 60 * 60);
    }
    }
    
    if (interaction.values[0] === "jail7") {
    await interaction.deferUpdate();
    const duration = ms("4w");
    const reason = "Sunucu Kötüleme / Saygısız Davranış";
    
    await ceza.findOneAndUpdate({ guildID: message.guild.id, userID: member.user.id }, { $push: { ceza: 1 } }, { upsert: true });
    await ceza.findOneAndUpdate({ guildID: message.guild.id, userID: member.user.id }, { $inc: { top: 1 } }, { upsert: true });
    await ceza.findOneAndUpdate({ guildID: message.guild.id, userID: message.author.id }, { $inc: { JailAmount: 1 } }, {upsert: true});
    
    await cezapuan.findOneAndUpdate({ guildID: message.guild.id, userID: member.user.id }, { $inc: { cezapuan: 15 } }, { upsert: true });
    const cezapuanData = await cezapuan.findOne({ guildID: message.guild.id, userID: member.user.id });
    punishmentLogChannel.send({ content: `${member} üyesi ban cezası alarak toplam \`${cezapuanData ? cezapuanData.cezapuan : 0} ceza puanına\` ulaştı!`})
    member.roles.cache.has(setup.BoosterRole) ? member.roles.set([setup.BoosterRole, setup.JailedRoles[0]]) : member.roles.set(setup.JailedRoles)
    message.react(`${client.emoji("server_onay")}`)
    const penal = await client.penalize(message.guild.id, member.id, 'Jail', true, message.author.id, reason, true, Math.floor(Date.now() + duration))
    
    if (msg) msg.delete().catch(() => {});
    await message.channel.send({ embeds: [new EmbedBuilder().setDescription(` ${member.toString()} kullanıcısı başarıyla **"${reason}"** sebebiyle <t:${Math.floor((Date.now() + duration) / 1000)}:R> süre boyunca karantinaya atıldı. (Ceza Numarası: \`#${penal.id}\`)`)]})
    if (system.Mainframe.dmMessages) member.send({ content:`**${message.guild.name}** sunucusunda, **${message.author.tag}** tarafından, **${reason}** sebebiyle, <t:${Math.floor((Date.now() + duration) / 1000)}:R>'ya kadar jaillendiniz.`}).catch(() => {});
    
    const log = new EmbedBuilder()
    .setDescription(`
   **${member.user.tag}** adlı kullanıcıya **${message.author.tag}** tarafından Jail atıldı. Ceza Numarası: (\`${penal.id}\`)        
    `)
    .addFields(
        { name: "Cezalandırılan", value: `${member ? member.toString() : user.username}`, inline: true},
        { name: "Cezalandıran", value: `${message.author}`, inline: true},
        { name: "Ceza Bitiş", value: `<t:${Math.floor((Date.now() + duration) / 1000)}:R>`, inline: true},
        { name: "Ceza Sebebi", value: `\`\`\`fix\n${reason}\n\`\`\``, inline: false},
                    )
   .setFooter({ text:`${moment(Date.now()).format("LLL")} (Ceza ID: #${penal.id})` })
    
    await logChannel.send({ embeds: [log]});
    
    if (system.Mainframe.jaillimit > 0) {
      if (!jailLimit.has(message.author.id)) jailLimit.set(message.author.id, 1);
      else jailLimit.set(message.author.id, jailLimit.get(message.author.id) + 1);
      setTimeout(() => {
        if (jailLimit.has(message.author.id)) jailLimit.delete(message.author.id);
      }, 1000 * 60 * 60);
    }
    }
    
    if (interaction.values[0] === "jail8") {
    await interaction.deferUpdate();
    if (msg) msg.delete().catch(() => {});
    interaction.followUp({ content: `${client.emoji("server_onay")} Jail Atma işlemi başarıyla iptal edildi.`, ephemeral: true });
    }
    })
    }



     },

  };