const client = global.client;
const j2poncik = require("../../../../../../Global/Settings/System");
const j2ponm = require("../../../../../../Global/Settings/Setup.json")
const { EmbedBuilder, AuditLogEvent } = require("discord.js");
const moment = require("moment");
const voiceLogs = require("../../../../../../Global/Schemas/voiceLogs");

client.on("voiceStateUpdate", async(oldState, newState) => {
    const channel = client.channels.cache.find(x => x.name === "voice_log")
    
    // Giriş
    if (!oldState.channel && newState.channel) {
        await new voiceLogs({ guildID: newState.guild.id, userID: newState.member.id, channelID: newState.channel.id, type: "JOIN" }).save();
        if (channel) channel.send({ embeds: [new EmbedBuilder().setColor("Random").setAuthor({ name: client.guilds.cache.get(j2poncik.ServerID).name, iconURL: client.guilds.cache.get(j2poncik.ServerID).iconURL({dynamic:true})}).setFooter({ text: `${moment(Date.now()).format("LLL")}`}).setDescription(`${client.emoji("server_onay")} ${newState.member.toString()} isimli kullanıcı bir ses kanalına giriş yaptı.\n\n \` ➥ \` Ses Kanalı: <#${newState.channel.id}>\n \` ➥ \` Girdiği Zaman: <t:${Math.floor(Date.now() / 1000)}:R>\n\n \`\`\`Kanalında bulunan üyeler şunlardır;\`\`\` \n ${newState.channel.members.map(x => `<@!${x.id}>`)}`)]});
    }

    // Çıkış
    if (oldState.channel && !newState.channel) {
        await new voiceLogs({ guildID: oldState.guild.id, userID: oldState.member.id, channelID: oldState.channel.id, type: "LEAVE" }).save();
        if (channel) channel.send({ embeds:  [new EmbedBuilder().setColor("Random").setAuthor({ name: client.guilds.cache.get(j2poncik.ServerID).name, iconURL: client.guilds.cache.get(j2poncik.ServerID).iconURL({dynamic:true})}).setFooter({ text: `${moment(Date.now()).format("LLL")}`}).setDescription(`${client.emoji("server_carpi")} ${newState.member.toString()} isimli kullanıcı bir sesli kanalından ayrıldı.\n\n \` ➥ \` Ses Kanalı: <#${oldState.channel.id}>\n \` ➥ \` Çıktığı Zaman: <t:${Math.floor(Date.now() / 1000)}:R>\n\n \`\`\`Kanalında bulunan üyeler şunlardır;\`\`\` \n ${oldState.channel.members.map(x => `<@!${x.id}>`)}`)]});
    }

    // Taşıma / Değiştirme
    if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
        await new voiceLogs({ guildID: newState.guild.id, userID: newState.member.id, channelID: newState.channel.id, oldChannelID: oldState.channel.id, type: "MOVE" }).save();
        if (channel) channel.send({ embeds:[new EmbedBuilder().setColor("Random").setAuthor({ name: client.guilds.cache.get(j2poncik.ServerID).name, iconURL: client.guilds.cache.get(j2poncik.ServerID).iconURL({dynamic:true})}).setFooter({ text: `${moment(Date.now()).format("LLL")}`}).setDescription(`${client.emoji("server_onay")} ${newState.member.toString()} isimli kullanıcı bir sesli kanal değişimi yaptı.\n\n \` ➥ \` Ses Kanal Değişikliği: <#${oldState.channel.id}> => <#${newState.channel.id}>\n \` ➥ \` Değişim Zamanı: <t:${Math.floor(Date.now() / 1000)}:R>\n\n \`\`\`Eski Kanalında bulunan üyeler şunlardır;\`\`\` \n ${oldState.channel.members.map(x => `<@!${x.id}>`)} \n\n \`\`\`Yeni Kanalında bulunan üyeler şunlardır;\`\`\` \n ${newState.channel.members.map(x => `<@!${x.id}>`)}  `)]});
    }

    // Susturma Kaldırma
    if (oldState.channel && oldState.selfMute && !newState.selfMute) {
        await new voiceLogs({ guildID: newState.guild.id, userID: newState.member.id, channelID: newState.channel.id, type: "UNMUTE" }).save();
        if (channel) channel.send({ embeds:[new EmbedBuilder().setColor("Random").setAuthor({ name: client.guilds.cache.get(j2poncik.ServerID).name, iconURL: client.guilds.cache.get(j2poncik.ServerID).iconURL({dynamic:true})}).setFooter({ text: `${moment(Date.now()).format("LLL")}`}).setDescription(`${client.emoji("server_onay")} ${newState.member.toString()} isimli kullanıcı bir sesli kanalda kendi susturmasını kaldırdı.\n\n \` ➥ \` Ses Kanalı: <#${newState.channel.id}>\n \` ➥ \` Kaldırma Zamanı <t:${Math.floor(Date.now() / 1000)}:R>`)]});
    }

    // Susturma
    if (oldState.channel && !oldState.selfMute && newState.selfMute) {
        await new voiceLogs({ guildID: newState.guild.id, userID: newState.member.id, channelID: newState.channel.id, type: "MUTE" }).save();
        if (channel) channel.send({ embeds:[new EmbedBuilder().setColor("Random").setAuthor({ name: client.guilds.cache.get(j2poncik.ServerID).name, iconURL: client.guilds.cache.get(j2poncik.ServerID).iconURL({dynamic:true})}).setFooter({ text: `${moment(Date.now()).format("LLL")}`}).setDescription(`${client.emoji("server_onay")} ${newState.member.toString()} isimli kullanıcı bir sesli kanalda kendini susturdu.\n\n \` ➥ \` Ses Kanalı: <#${newState.channel.id}>\n \` ➥ \` Susturma Zamanı <t:${Math.floor(Date.now() / 1000)}:R>`)]});
    }

    // Sağırlaştırma Kaldırma
    if (oldState.channel && oldState.selfDeaf && !newState.selfDeaf) {
        await new voiceLogs({ guildID: newState.guild.id, userID: newState.member.id, channelID: newState.channel.id, type: "UNDEAF" }).save();
        if (channel) channel.send({ embeds:[new EmbedBuilder().setColor("Random").setAuthor({ name: client.guilds.cache.get(j2poncik.ServerID).name, iconURL: client.guilds.cache.get(j2poncik.ServerID).iconURL({dynamic:true})}).setFooter({ text: `${moment(Date.now()).format("LLL")}`}).setDescription(`${client.emoji("server_onay")} ${newState.member.toString()} isimli kullanıcı bir sesli kanalda kendi sağırlaştırmasını kaldırdı.\n\n \` ➥ \` Ses Kanalı: <#${newState.channel.id}>\n \` ➥ \` Kaldırma Zamanı <t:${Math.floor(Date.now() / 1000)}:R>`)]});
    }

    // Sağırlaştırma
    if (oldState.channel && !oldState.selfDeaf && newState.selfDeaf) {
        await new voiceLogs({ guildID: newState.guild.id, userID: newState.member.id, channelID: newState.channel.id, type: "DEAF" }).save();
        if (channel) channel.send({ embeds:[new EmbedBuilder().setColor("Random").setAuthor({ name: client.guilds.cache.get(j2poncik.ServerID).name, iconURL: client.guilds.cache.get(j2poncik.ServerID).iconURL({dynamic:true})}).setFooter({ text: `${moment(Date.now()).format("LLL")}`}).setDescription(`${client.emoji("server_onay")} ${newState.member.toString()} isimli kullanıcı bir sesli kanalda kendini sağırlaştırdı.\n\n \` ➥ \` Ses Kanalı: <#${newState.channel.id}>\n \` ➥ \` Sağırlaştırma Zamanı <t:${Math.floor(Date.now() / 1000)}:R>`)]});
    }

    // Yayın Açma
    if (oldState.channel && !oldState.streaming && newState.channel && newState.streaming) {
        await new voiceLogs({ guildID: newState.guild.id, userID: newState.member.id, channelID: newState.channel.id, type: "STREAM-START" }).save();
        if (channel) channel.send({ embeds:[new EmbedBuilder().setColor("Random").setAuthor({ name: client.guilds.cache.get(j2poncik.ServerID).name, iconURL: client.guilds.cache.get(j2poncik.ServerID).iconURL({dynamic:true})}).setFooter({ text: `${moment(Date.now()).format("LLL")}`}).setDescription(`${client.emoji("server_onay")} ${newState.member.toString()} isimli kullanıcı bir sesli kanalda yayın açtı.\n\n \` ➥ \` Ses Kanalı: <#${newState.channel.id}>\n \` ➥ \` Yayını Açma Zamanı <t:${Math.floor(Date.now() / 1000)}:R>`)]});
    }

    // Yayın Kapama
    if (oldState.channel && oldState.streaming && newState.channel && !newState.streaming) {
        await new voiceLogs({ guildID: newState.guild.id, userID: newState.member.id, channelID: newState.channel.id, type: "STREAM-STOP" }).save();
        if (channel) channel.send({ embeds:[new EmbedBuilder().setColor("Random").setAuthor({ name: client.guilds.cache.get(j2poncik.ServerID).name, iconURL: client.guilds.cache.get(j2poncik.ServerID).iconURL({dynamic:true})}).setFooter({ text: `${moment(Date.now()).format("LLL")}`}).setDescription(`${client.emoji("server_onay")} ${newState.member.toString()} isimli kullanıcı bir sesli kanalda yayınını kapadı.\n\n \` ➥ \` Ses Kanalı: <#${newState.channel.id}>\n \` ➥ \` Yayını Kapama Zamanı <t:${Math.floor(Date.now() / 1000)}:R>`)]});
    }

    // Kamera Açma
    if (oldState.channel && !oldState.selfVideo && newState.channel && newState.selfVideo) {
        await new voiceLogs({ guildID: newState.guild.id, userID: newState.member.id, channelID: newState.channel.id, type: "CAMERA-START" }).save();
        if (channel) channel.send({ embeds:[new EmbedBuilder().setColor("Random").setAuthor({ name: client.guilds.cache.get(j2poncik.ServerID).name, iconURL: client.guilds.cache.get(j2poncik.ServerID).iconURL({dynamic:true})}).setFooter({ text: `${moment(Date.now()).format("LLL")}`}).setDescription(`${client.emoji("server_onay")} ${newState.member.toString()} isimli kullanıcı bir sesli kanalda kamerasını açtı.\n\n \` ➥ \` Ses Kanalı: <#${newState.channel.id}>\n \` ➥ \` Kamera Açma Zamanı <t:${Math.floor(Date.now() / 1000)}:R>`)]});
    }

    // Kamera Kapama
    if (oldState.channel && oldState.selfVideo && newState.channel && !newState.selfVideo) {
        await new voiceLogs({ guildID: newState.guild.id, userID: newState.member.id, channelID: newState.channel.id, type: "CAMERA-STOP" }).save();
        if (channel) channel.send({ embeds:[new EmbedBuilder().setColor("Random").setAuthor({ name: client.guilds.cache.get(j2poncik.ServerID).name, iconURL: client.guilds.cache.get(j2poncik.ServerID).iconURL({dynamic:true})}).setFooter({ text: `${moment(Date.now()).format("LLL")}`}).setDescription(`${client.emoji("server_onay")} ${newState.member.toString()} isimli kullanıcı bir sesli kanalda kamerasını kapadı.\n\n \` ➥ \` Ses Kanalı: <#${newState.channel.id}>\n \` ➥ \` Kamerayı Kapama Zamanı <t:${Math.floor(Date.now() / 1000)}:R>`)]});
    }

    const channel2 = client.channels.cache.find(x => x.name === "mute_log")
    if (!channel2) return;
    let logs = await oldState.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberUpdate }).catch(() => null);
    let entry = logs?.entries.first();
    if (entry && !oldState.serverMute && newState.serverMute) {
        if (!newState.member || !newState.channel || !entry || !entry.executor || !entry.executor.user) return;
        return channel2.send({ embeds: [new EmbedBuilder().setColor("Random").setAuthor({ name: client.guilds.cache.get(j2poncik.ServerID).name, iconURL: client.guilds.cache.get(j2poncik.ServerID).iconURL({dynamic:true})}).setFooter({ text: `${moment(Date.now()).format("LLL")}`}).setDescription(`
${newState.member.displayName} Adlı Kişiye ${entry.executor.user.username} tarafından Sağ-tık susturma işlemi yapıldı.`)
        .addFields(
        { name: "Cezalandırılan", value: `${newState.member}`, inline: true },
        { name: "Cezalanan", value: `${entry.executor}`, inline: true},
        { name: "Ses Kanal", value: ` <#${newState.channel.id}>`, inline: true},)]});
    }
});