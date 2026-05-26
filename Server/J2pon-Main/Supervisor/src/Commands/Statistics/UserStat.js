const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, AttachmentBuilder, ComponentType, PermissionsBitField, bold, italic } = require("discord.js");
const { createCanvas } = require("@napi-rs/canvas");
const friendShip = require("../../../../../../Global/Schemas/friendShip.js");
const { GetTools } = require("../../Extras/GetTools.js");
const setup = require("../../../../../../Global/Settings/Setup.json");
const system = require("../../../../../../Global/Settings/System");
const moment = require('moment');
require("moment-duration-format");
const friendShip2 = require("../../../../../../Global/Schemas/chatFriend");
const tagliStats = require("../../../../../../Global/Schemas/tagliStats");
const yetkiliStats = require("../../../../../../Global/Schemas/yetkiliStats");
const davetStats = require("../../../../../../Global/Schemas/davetStats");
const sorunCozmeStats = require("../../../../../../Global/Schemas/sorunCozmeStats");
const oryantasyonStats = require("../../../../../../Global/Schemas/oryantasyonStats");
const regstats = require("../../../../../../Global/Schemas/registerStats");
const userTask = require("../../../../../../Global/Schemas/userTask");
const tasks = require("../../../../../../Global/Schemas/tasks");
const { MessageStat, VoiceStat, StreamerStat, CameraStat } = require("../../../../../../Global/Models");
const guildTaggedMembers = require("../../../../../../Global/Schemas/guildTaggedMembers");

module.exports = {
  name: "profil",
  description: "Kullanıcının istatistik verilerini gösterir.",
  category: "STAT",
  cooldown: 0,
  command: {
    enabled: true,
    aliases: ["stat", "stats", "istatistik", "verilerim"],
    usage: ".stat",
  },

  onLoad: function (client) { },

  onCommand: async function (client, message, args) {
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;

    const requirements = require("../../../../../../Global/Settings/ResponsibilityRequirements");
    const userResponsibilityTask = require("../../../../../../Global/Schemas/userResponsibilityTask");

    // 0. Temel Veriler (Normal Statlar)
    const mesajData = await MessageStat.findOne({ guildID: message.guild.id, userID: member.id });
    const sesData = await VoiceStat.findOne({ guildID: message.guild.id, userID: member.id });
    const streamerData = await StreamerStat.findOne({ guildID: message.guild.id, userID: member.id });
    const cameraData = await CameraStat.findOne({ guildID: message.guild.id, userID: member.id });

    const totalVoice = formatDuration(sesData ? sesData.TotalStat : 0);
    const weeklyVoice = formatDuration(sesData ? sesData.WeeklyStat : 0);
    const dailyVoice = formatDuration(sesData ? sesData.DailyStat : 0);

    const totalMessage = (mesajData ? mesajData.TotalStat : 0).toLocaleString();
    const dailyMessage = (mesajData ? mesajData.DailyStat : 0).toLocaleString();

    const totalStream = formatDuration(streamerData ? streamerData.TotalStat : 0);
    const totalCamera = formatDuration(cameraData ? cameraData.TotalStat : 0);

    const isStaff = member.roles.cache.some(r => 
        [...setup.PromotionRoles.AltYetki, ...setup.PromotionRoles.OrtaYetki, ...setup.PromotionRoles.UstYetki].includes(r.id) ||
        Object.values(setup.Sorumluluk?.StaffRoles || {}).some(s => member.roles.cache.has(s.responsible) || member.roles.cache.has(s.leader))
    );

    // Sorumluluk Verilerini Çek
    const userRespTasks = await userResponsibilityTask.find({ userId: member.id });
    
    // Yetki Seviyesini Belirle
    let level = "AltYetki";
    if (setup.PromotionRoles.OrtaYetki?.some(r => member.roles.cache.has(r))) level = "OrtaYetki";
    if (setup.PromotionRoles.UstYetki?.some(r => member.roles.cache.has(r))) level = "UstYetki";


    // 1. Ana Görev Hesaplama
    let mainTaskPercent = 0;
    let mainTaskLabel = "Görev Seçilmemiş";
    const taskData = await userTask.findOne({ userId: member.id });
    if (taskData && taskData.selectedTask) {
        const mTask = requirements.MainTasks[taskData.selectedTask];
        if (mTask) {
            mainTaskLabel = mTask.label;
            let totalReq = 0, totalCurrent = 0;
            for (const [key, reqVal] of Object.entries(mTask.req)) {
                totalReq += reqVal;
                totalCurrent += Math.min(taskData.counts?.[key] || 0, reqVal);
            }
            mainTaskPercent = totalReq > 0 ? Math.floor((totalCurrent / totalReq) * 100) : 100;
        }
    }

    // 2. Sorumluluk Görevleri Hesaplama
    let respPercent = 0;
    let respDetails = [];
    let totalRespReq = 0, totalRespCurrent = 0;
    
    if (userRespTasks.length > 0) {
        for (const uResp of userRespTasks) {
            const rTask = requirements.ResponsibilityTasks[uResp.level || level]?.tasks[uResp.responsibilityKey];
            if (rTask) {
                let rReq = 0, rCur = 0;
                for (const [key, val] of Object.entries(rTask.req)) {
                    rReq += val;
                    rCur += Math.min(uResp.counts?.[key] || 0, val);
                }
                totalRespReq += rReq;
                totalRespCurrent += rCur;
                respDetails.push(`${rTask.label} (%${rReq > 0 ? Math.floor((rCur / rReq) * 100) : 100})`);
            }
        }
        respPercent = totalRespReq > 0 ? Math.floor((totalRespCurrent / totalRespReq) * 100) : 100;
    }

    // 3. Genel İlerleme ve Süre Hesaplama
    const calcOverall = level === "AltYetki" ? respPercent : Math.floor((mainTaskPercent + (userRespTasks.length > 0 ? respPercent : 100)) / 2);

    const durationDays = requirements.ResponsibilityTasks[level]?.duration || 7;
    const startDate = taskData?.startDate || member.joinedAt;
    const endDate = startDate + (durationDays * 24 * 60 * 60 * 1000);
    const remainingMs = Math.max(0, endDate - Date.now());
    const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
    const passedDays = Math.max(0, durationDays - remainingDays);
    const timePercent = Math.min(100, Math.floor((passedDays / durationDays) * 100));

    const embed = new EmbedBuilder()
      .setColor(0x2F3136)
      .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 2048 }));

    let description = `${member} adlı üyenin istatistik verileri;\n\n`;
    
    description += `**\` • Ses İstatistiği     : \`** ${totalVoice} (Günlük: ${dailyVoice})\n`;
    description += `**\` • Mesaj İstatistiği   : \`** ${totalMessage} (Günlük: ${dailyMessage})\n`;
    description += `**\` • Yayın İstatistiği   : \`** ${totalStream}\n`;
    description += `**\` • Kamera İstatistiği  : \`** ${totalCamera}\n\n`;

    if (isStaff) {
        const returnStats = require("../../../../../../Global/Schemas/returnStats");
        const rStatData = await returnStats.findOne({ guildID: message.guild.id, userID: member.id });
        const returnCount = rStatData ? rStatData.count : 0;

        const allPromoRoles = [...setup.PromotionRoles.AltYetki, ...setup.PromotionRoles.OrtaYetki, ...setup.PromotionRoles.UstYetki];
        const memberPromoRoles = member.roles.cache.filter(r => allPromoRoles.includes(r.id)).sort((a, b) => b.position - a.position);
        const highestRoleName = memberPromoRoles.first() ? memberPromoRoles.first().name : "Yetkisiz";

        let staffStartDate = taskData?.staffStartDate;
        if (!staffStartDate) {
            const taggedData = await guildTaggedMembers.findOne({ guildID: message.guild.id, userID: member.id });
            if (taggedData) staffStartDate = taggedData.updatedAt;
        }

        const staffEntryDate = staffStartDate ? moment(staffStartDate).locale("tr").format("DD MMMM YYYY (HH:mm)") : "Bilinmiyor";
        const staffDuration = staffStartDate ? moment.duration(Date.now() - staffStartDate).format("Y [yıl,] M [ay,] D [gün]") : "Bilinmiyor";

        description += `**───────────────**\n`;
        description += `**\` • Yetki Rolü        : \`** ${highestRoleName}\n`;
        description += `**\` • Yetkiye Giriş     : \`** ${staffEntryDate}\n`;
        description += `**\` • Yetki Süresi      : \`** ${staffDuration}\n`;
        description += `**\` • Return Statı       : \`** ${returnCount}\n`;
        if (level !== "AltYetki") description += `**\` • Ana Görev          : \`** ${mainTaskLabel} (%${mainTaskPercent})\n`;
        description += `**\` • Sorumluluklar      : \`** ${respDetails.length > 0 ? respDetails.join(", ") : "Yok"}\n`;
        description += `**\` • Kalan Süre         : \`** ${remainingDays} Gün (Toplam: ${durationDays} Gün)\n\n`;
        
        const Emojis = require("../../../../../../Global/Settings/Emojis.json");

        const getProgressBar = (percent, color = "Blue") => {
            const totalBars = 10;
            const fullBars = Math.round((percent / 100) * totalBars);
            
            let barStr = "";
            // Başlangıç
            if (fullBars > 0) barStr += Emojis[`${color}Start`] || "■";
            else barStr += Emojis["EmptyStart"] || "□";
            
            // Orta
            for (let i = 1; i < totalBars - 1; i++) {
                if (i < fullBars) barStr += Emojis[`${color}Mid`] || "■";
                else barStr += Emojis["EmptyMid"] || "□";
            }
            
            // Bitiş
            if (fullBars === totalBars) barStr += Emojis[`${color}End`] || "■";
            else barStr += Emojis["EmptyEnd"] || "□";
            
            return barStr;
        };

        description += `**───────────────**\n`;
        description += `**📋 Genel İlerleme Durumu (\` %${calcOverall} \`)**\n${getProgressBar(calcOverall, "Blue")}\n\n`;
        description += `**🛡️ Sorumluluk İlerlemesi (\` %${respPercent} \`)**\n${getProgressBar(respPercent, "Blue")}\n\n`;
        
        if (level !== "AltYetki") {
            description += `**⚔️ Ana Görev İlerlemesi (\` %${mainTaskPercent} \`)**\n${getProgressBar(mainTaskPercent, "Blue")}\n\n`;
        }
        
        description += `**📅 Süre İlerlemesi (\` %${timePercent} \`)**\n${getProgressBar(timePercent, "Blue")}\n\n`;
        
        embed.setDescription(description);
        embed.setFooter({ text: `Son Güncelleme: ${moment().format("HH:mm:ss")}` });

        return message.reply({ embeds: [embed] });
    }

    embed.setDescription(description);
    embed.setFooter({ text: `Son Güncelleme: ${moment().format("HH:mm:ss")}` });

    message.reply({ embeds: [embed] });
  },
};

function roundRect(ctx, x, y, width, height, radius, fill) {
    if (typeof radius === 'undefined') radius = 5;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    else ctx.stroke();
}

function formatDuration(ms) {
    const duration = moment.duration(ms);
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    return `${hours} saat, ${minutes} dk.`;
}