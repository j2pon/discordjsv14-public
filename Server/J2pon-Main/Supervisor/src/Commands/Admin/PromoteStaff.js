const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const setup = require("../../../../../../Global/Settings/Setup.json");
const system = require("../../../../../../Global/Settings/System");
const userTask = require("../../../../../../Global/Schemas/userTask");
const userResponsibilityTask = require("../../../../../../Global/Schemas/userResponsibilityTask");
const requirements = require("../../../../../../Global/Settings/ResponsibilityRequirements");
const emojis = require("../../../../../../Global/Settings/Emojis.json");

module.exports = {
    name: "ytyükselt",
    description: "Yetkili yükseltme komutu",
    category: "ADMIN",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["ytyukselt", "yetkiyükselt"],
        usage: ".ytyükselt <@user>",
    },

    onLoad: function (client) { 
        client.setMaxListeners(100);
    },

    onCommand: async function (client, message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && !setup.OwnerRoles.some(r => message.member.roles.cache.has(r))) {
            return message.reply({ content: "Bu komutu kullanmak için yönetici yetkiniz olmalı." });
        }

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) return message.reply({ content: "Bir üye belirtmelisiniz." });

        // 1. Görev Kontrolü
        const taskData = await userTask.findOne({ userId: member.id });
        const respTasks = await userResponsibilityTask.find({ userId: member.id });
        
        let level = "AltYetki";
        if (setup.OrtaYetkiRoles?.some(r => member.roles.cache.has(r))) level = "OrtaYetki";
        if (setup.UstYetkiRoles?.some(r => member.roles.cache.has(r))) level = "UstYetki";

        // Ana Görev Yüzdesi Hesapla
        let mainComplete = false;
        if (taskData && taskData.selectedTask) {
            const mTask = requirements.MainTasks[taskData.selectedTask];
            if (mTask) {
                let totalReq = 0, totalCurrent = 0;
                for (const [key, reqVal] of Object.entries(mTask.req)) {
                    totalReq += reqVal;
                    totalCurrent += Math.min(taskData.counts?.[key] || 0, reqVal);
                }
                if (totalCurrent >= totalReq) mainComplete = true;
            }
        }

        // Sorumluluk Görevi Yüzdesi Hesapla
        let respComplete = respTasks.length > 0;
        for (const uResp of respTasks) {
            const rTask = requirements.ResponsibilityTasks[uResp.level || level]?.tasks[uResp.responsibilityKey];
            if (rTask) {
                let rReq = 0, rCur = 0;
                for (const [key, val] of Object.entries(rTask.req)) {
                    rReq += val;
                    rCur += Math.min(uResp.counts?.[key] || 0, val);
                }
                if (rCur < rReq) {
                    respComplete = false;
                    break;
                }
            }
        }

        if (!mainComplete || !respComplete) {
            return message.reply({ content: `Bu üyenin görevleri henüz tamamlanmamış.\nAna Görev: ${mainComplete ? "✅" : "❌"}\nSorumluluk: ${respComplete ? "✅" : "❌"}` });
        }

        // 2. Rol Yükseltme
        const allPromotionRoles = [
            ...setup.PromotionRoles.AltYetki,
            ...setup.PromotionRoles.OrtaYetki,
            ...setup.PromotionRoles.UstYetki
        ];

        const currentRole = member.roles.cache.filter(r => allPromotionRoles.includes(r.id)).sort((a, b) => b.position - a.position).first();
        if (!currentRole) return message.reply({ content: "Üyenin mevcut yetki rolü hiyerarşide bulunamadı." });

        const currentIndex = allPromotionRoles.indexOf(currentRole.id);
        if (currentIndex === -1 || currentIndex === allPromotionRoles.length - 1) {
            return message.reply({ content: "Üye zaten en üst yetkide veya hiyerarşi dışında." });
        }

        let jump = 1;
        if (setup.PromotionRoles.AltYetki.includes(currentRole.id)) {
            jump = 2; // Alt yetkiler 2 rol atlar
        }

        let nextIndex = Math.min(currentIndex + jump, allPromotionRoles.length - 1);
        const nextRoleId = allPromotionRoles[nextIndex];

        // Rolleri Güncelle
        await member.roles.remove(allPromotionRoles);
        await member.roles.add(nextRoleId);

        // 3. Statları ve Görevleri Sıfırla
        await userTask.deleteOne({ userId: member.id });
        await userResponsibilityTask.deleteMany({ userId: member.id });
        
        // Ses/Mesaj veritabanı sıfırlama (Opsiyonel: Weekly/Monthly sıfırlanabilir)
        const { MessageStat, VoiceStat, StreamerStat } = require("../../../../../Global/Models");
        await MessageStat.findOneAndUpdate({ guildID: message.guild.id, userID: member.id }, { $set: { TotalStat: 0, DailyStat: 0, WeeklyStat: 0, MonthlyStat: 0 } });
        await VoiceStat.findOneAndUpdate({ guildID: message.guild.id, userID: member.id }, { $set: { TotalStat: 0, DailyStat: 0, WeeklyStat: 0, MonthlyStat: 0 } });
        await StreamerStat.findOneAndUpdate({ guildID: message.guild.id, userID: member.id }, { $set: { TotalStat: 0, DailyStat: 0, WeeklyStat: 0, MonthlyStat: 0 } });

        const embed = new EmbedBuilder()
            .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
            .setDescription(`${member} başarıyla yükseltildi!`)
            .addFields(
                { name: "Eski Rol", value: `<@&${currentRole.id}>`, inline: true },
                { name: "Yeni Rol", value: `<@&${nextRoleId}>`, inline: true },
                { name: "Sıfırlanan Veriler", value: "Tüm görev ilerlemeleri ve istatistikler sıfırlandı.", inline: false }
            )
            .setColor("Green")
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
}
