const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { createCanvas } = require("@napi-rs/canvas");
const userTask = require("../../../../../../Global/Schemas/userTask");
const tasks = require("../../../../../../Global/Schemas/tasks");
const userResponsibilityTask = require("../../../../../../Global/Schemas/userResponsibilityTask");
const requirements = require("../../../../../../Global/Settings/ResponsibilityRequirements");

module.exports = {
    name: "görev",
    description: "Görev hakkında bilgi verir.",
    category: "ADMIN",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: [],
      usage: ".görev",
    },

    onLoad: function (client) { },

    onCommand: async function (client, message, args) { 
        if (!message.guild || !message.member) return;
        
        const mainData = await userTask.findOne({ userId: message.author.id });
        const respData = await userResponsibilityTask.find({ userId: message.author.id }); // Tüm sorumluluk görevleri
        
        let allTasks = [];

        // 1. Ana Görev Kontrolü
        if (mainData && mainData.selectedTask && requirements.MainTasks[mainData.selectedTask]) {
            const mTask = requirements.MainTasks[mainData.selectedTask];
            allTasks.push({
                label: `Ana Görev: ${mTask.label}`,
                req: mTask.req,
                data: mainData.counts
            });
        }

        // 2. Sorumluluk Görevleri Kontrolü
        if (respData && respData.length > 0) {
            respData.forEach(rd => {
                const rTask = requirements.ResponsibilityTasks[rd.level]?.tasks[rd.responsibilityKey];
                if (rTask) {
                    allTasks.push({
                        label: `Sorumluluk: ${rTask.label}`,
                        req: rTask.req,
                        data: rd.counts
                    });
                }
            });
        }

        // 3. Eski Rol Bazlı Görev Kontrolü (Eğer panel görevleri yoksa)
        if (allTasks.length === 0) {
            const currentHighestRole = message.member.roles.highest.id;
            const roleTask = await tasks.findOne({ currentRole: currentHighestRole });
            if (roleTask) {
                allTasks.push({
                    label: `Rol Görevi: <@&${roleTask.endOfMissionRole}>`,
                    req: roleTask.requiredCounts,
                    data: (mainData ? mainData.counts : {})
                });
            }
        }

        if (allTasks.length === 0) {
            return await message.reply({ content: 'Üzerinizde tanımlı aktif bir görev bulunamadı.' });
        }
        
        return await showTasks(client, message, allTasks);
    },
};

async function showTasks(client, message, allTasks) {
    try {
        let totalDesc = "";
        let totalTaskList = [];

        allTasks.forEach((task, tIndex) => {
            const reqs = task.req || {};
            const names = Object.keys(reqs);
            
            totalDesc += `### ${task.label}\n`;
            
            names.forEach(name => {
                const goal = reqs[name];
                const current = task.data[name] || 0;
                
                const isVoice = name === 'voice' || name === 'stream';
                const displayVal = isVoice ? Math.floor(goal / (1000 * 60 * 60)) : goal;
                const displayCount = isVoice ? Math.floor(current / (1000 * 60 * 60)) : current;
                const unit = isVoice ? ' saat' : '';
                const percent = Math.min(100, Math.floor((current / goal) * 100));

                totalDesc += `${client.emoji("server_nokta")} **\` ${name.charAt(0).toUpperCase() + name.slice(1)}: \`** **\` (${displayCount} / ${displayVal}${unit}) \`**\n`;
                
                totalTaskList.push({
                    label: `${task.label.split(":")[0]} - ${name}`,
                    percent: percent
                });
            });
            totalDesc += "\n";
        });

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setAuthor({ iconURL: message.author.displayAvatarURL({ dynamic: true }), name: message.author.username + ' ' + 'kullanıcısının görevleri' })
            .setDescription(totalDesc);

        // Canvas Çizimi
        const width = 600;
        const barHeight = 25;
        const spacing = 65;
        const canvasHeight = taskList.length * spacing + 20;
        const canvas = createCanvas(width, canvasHeight);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#2B2D31';
        ctx.fillRect(0, 0, width, canvasHeight);

        taskList.forEach((t, index) => {
            const y = 30 + (index * spacing);
            ctx.font = 'bold 18px sans-serif';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(t.label, 10, y - 10);
            ctx.fillText(`%${t.percent}`, width - 50, y - 10);

            ctx.fillStyle = '#1e1f22';
            roundRect(ctx, 10, y, width - 20, barHeight, 12, true);

            if (t.percent > 0) {
                ctx.fillStyle = '#43B581';
                roundRect(ctx, 10, y, (width - 20) * (t.percent / 100), barHeight, 12, true);
            }
        });

        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'tasks.png' });
        embed.setImage('attachment://tasks.png');

        await message.reply({
            embeds: [embed],
            files: [attachment]
        });
    } catch (e) {
        console.error('Show tasks error:', e);
        await message.reply({
            content: 'Görevler gösterilirken bir hata oluştu.'
        });
    }
}

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
