const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const setup = require("../../../../../../Global/Settings/Setup.json");
const moment = require('moment');
require("moment-duration-format");
const { MessageStat, VoiceStat, StreamerStat, CameraStat, VoiceUserChannel, MessageUserChannel } = require("../../../../../../Global/Models");

// Diğer Şemalar
const tagliStats = require("../../../../../../Global/Schemas/tagliStats");
const yetkiliStats = require("../../../../../../Global/Schemas/yetkiliStats");
const davetStats = require("../../../../../../Global/Schemas/davetStats");
const sorunCozmeStats = require("../../../../../../Global/Schemas/sorunCozmeStats");
const oryantasyonStats = require("../../../../../../Global/Schemas/oryantasyonStats");
const regstats = require("../../../../../../Global/Schemas/registerStats");
const returnStats = require("../../../../../../Global/Schemas/returnStats");

module.exports = {
  name: "me",
  description: "Detaylı kişisel istatistiklerinizi gösterir.",
  category: "STAT",
  cooldown: 5,
  command: {
    enabled: true,
    aliases: ["ben", "bilgilerim"],
    usage: ".me",
  },

  onLoad: function (client) { },

  onCommand: async function (client, message, args) {
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;

    // 1. Temel Veriler (Toplam Statlar)
    const mesajData = await MessageStat.findOne({ guildID: message.guild.id, userID: member.id });
    const sesData = await VoiceStat.findOne({ guildID: message.guild.id, userID: member.id });
    const streamerData = await StreamerStat.findOne({ guildID: message.guild.id, userID: member.id });
    const cameraData = await CameraStat.findOne({ guildID: message.guild.id, userID: member.id });

    const totalVoice = formatDuration(sesData ? sesData.TotalStat : 0);
    const totalMessage = (mesajData ? mesajData.TotalStat : 0).toLocaleString();
    const totalStream = formatDuration(streamerData ? streamerData.TotalStat : 0);
    const totalCamera = formatDuration(cameraData ? cameraData.TotalStat : 0);

    // 2. En Çok Kullanılan Kanallar (Top 5)
    const topVoiceChannels = await VoiceUserChannel.find({ guildID: message.guild.id, userID: member.id }).sort({ ChannelData: -1 }).limit(5);
    const topTextChannels = await MessageUserChannel.find({ guildID: message.guild.id, userID: member.id }).sort({ ChannelData: -1 }).limit(5);

    // 3. Yetkili Verileri (Diğer Bilgiler)
    const isStaff = member.roles.cache.some(r => 
        [...setup.PromotionRoles.AltYetki, ...setup.PromotionRoles.OrtaYetki, ...setup.PromotionRoles.UstYetki].includes(r.id) ||
        Object.values(setup.Sorumluluk?.StaffRoles || {}).some(s => member.roles.cache.has(s.responsible) || member.roles.cache.has(s.leader))
    );

    const tagli = await tagliStats.findOne({ guildID: message.guild.id, userID: member.id });
    const yetkili = await yetkiliStats.findOne({ guildID: message.guild.id, userID: member.id });
    const kayit = await regstats.findOne({ guildID: message.guild.id, userID: member.id });
    const davet = await davetStats.findOne({ guildID: message.guild.id, userID: member.id });
    const returnS = await returnStats.findOne({ guildID: message.guild.id, userID: member.id });
    const ory = await oryantasyonStats.findOne({ guildID: message.guild.id, userID: member.id });
    const sorun = await sorunCozmeStats.findOne({ guildID: message.guild.id, userID: member.id });

    // Embed Oluşturma
    const embed = new EmbedBuilder()
      .setColor(0x2F3136)
      .setAuthor({ name: `${member.user.username} adlı kullanıcının veri bilgileri;`, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 2048 }));

    let desc = `### Aktiviteler\n`;
    desc += `• **Ses:** ${totalVoice}\n`;
    desc += `• **Metin:** ${totalMessage} mesaj\n`;
    desc += `• **Yayın:** ${totalStream}\n`;
    desc += `• **Kamera:** ${totalCamera}\n\n`;

    desc += `### En çok kullanılan kanallar\n`;
    desc += `**Ses:**\n`;
    if (topVoiceChannels.length > 0) {
        topVoiceChannels.forEach(v => {
            desc += `• 🔊 <#${v.ChannelID}>: ${formatDuration(v.ChannelData)}\n`;
        });
    } else {
        desc += `• Veri bulunamadı.\n`;
    }

    desc += `\n**Metin:**\n`;
    if (topTextChannels.length > 0) {
        topTextChannels.forEach(m => {
            desc += `• # <#${m.ChannelID}>: ${m.ChannelData.toLocaleString()} mesaj\n`;
        });
    } else {
        desc += `• Veri bulunamadı.\n`;
    }

    if (isStaff) {
        desc += `\n### Diğer Bilgiler\n`;
        desc += `• \` [ Taglı Çekme      : ] \` ${tagli ? tagli.count : 0} adet\n`;
        desc += `• \` [ Yetkili Çekme    : ] \` ${yetkili ? yetkili.count : 0} adet\n`;
        desc += `• \` [ Kayıt Yapma      : ] \` ${kayit ? kayit.top : 0} adet\n`;
        desc += `• \` [ Davet Yapma      : ] \` ${davet ? davet.count : 0} adet\n`;
        desc += `• \` [ Return           : ] \` ${returnS ? returnS.count : 0} adet\n`;
        desc += `• \` [ Oryantasyon      : ] \` ${ory ? ory.count : 0} adet\n`;
        desc += `• \` [ Sorun Çözme      : ] \` ${sorun ? sorun.count : 0} adet\n`;
    }

    embed.setDescription(desc);
    message.reply({ embeds: [embed] });
  },
};

function formatDuration(ms) {
    const duration = moment.duration(ms);
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    if (hours > 0) {
        return `${hours} saat, ${minutes} dk.`;
    } else {
        return `${minutes} dk.`;
    }
}
