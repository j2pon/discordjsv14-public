const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    MessageFlags,
    Events
} = require("discord.js");
const setup = require("../../../../../../Global/Settings/Setup.json");
const system = require("../../../../../../Global/Settings/System");
const requirements = require("../../../../../../Global/Settings/ResponsibilityRequirements");
const userTask = require("../../../../../../Global/Schemas/userTask");
const tasks = require("../../../../../../Global/Schemas/tasks");
const emojis = require("../../../../../../Global/Settings/Emojis.json");

module.exports = {
    name: "görevpanel",
    description: "Ana görev seçim paneli",
    category: "STAT",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["görev-panel", "gorevpanel"],
        usage: ".görevpanel",
    },

    onLoad: function (client) {
        client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isButton()) return;
            const { customId, user, member } = interaction;

            if (customId.startsWith("main_task_select_")) {
                const taskKey = customId.replace("main_task_select_", "");
                const taskData = requirements.MainTasks[taskKey];

                if (!taskData) return;
                
                // Yetkili permi kontrolü (Alt/Orta/Ust yetkili rollerinden birine sahip mi?)
                const allStaffRoles = [
                    ...(setup.PromotionRoles?.AltYetki || []),
                    ...(setup.PromotionRoles?.OrtaYetki || []),
                    ...(setup.PromotionRoles?.UstYetki || []),
                    ...(setup.StartAuthority || [])
                ];

                const isStaff = member.roles.cache.some(r => allStaffRoles.includes(r.id));
                if (!isStaff) {
                    return interaction.reply({ 
                        content: `Bu panelden görev alabilmek için yetkili kadrosunda bulunmalısınız.`, 
                        flags: MessageFlags.Ephemeral 
                    });
                }

                // Mevcut görevi güncelle veya oluştur
                // Not: userTask şeması roleId bazlı çalışıyor ama biz burada seçilen görevi işaretleyeceğiz
                // Normalde bu sistem roleId'ye bağlı hedefleri çeker. 
                // Ancak kullanıcı butonla seçmek istiyor. 
                // Bu yüzden seçilen "taskKey" bilgisini de saklamalıyız ya da 
                // seçilen hedefe göre statları oraya yönlendirmeliyiz.
                
                // Mevcut mantığa göre userTask roleId'ye göre tasks şemasından hedefleri çeker.
                // Kullanıcı "Yetkili Alım", "Invite" veya "Chat" seçince o stat sayılmaya başlar.
                
                await userTask.findOneAndUpdate(
                    { userId: user.id },
                    { 
                        $set: { 
                            roleId: member.roles.highest.id,
                            startDate: Date.now(),
                            selectedTask: taskKey, // Yeni alan: seçilen görev tipi
                            'counts.message': 0,
                            'counts.voice': 0,
                            'counts.register': 0,
                            'counts.invite': 0,
                            'counts.yetkili': 0,
                            'counts.tagli': 0
                        } 
                    },
                    { upsert: true }
                );

                return interaction.reply({ 
                    content: `${emojis.server_onay} **${taskData.label}** görevi başarıyla seçildi. İlerlemeyi \`.stat\` üzerinden takip edebilirsiniz.`, 
                    flags: MessageFlags.Ephemeral 
                });
            }
        });
    },

    onCommand: async function (client, message, args) {
        if (!system.BotsOwners.includes(message.author.id) && !message.member.permissions.has(8n)) return;

        const embed = new EmbedBuilder()
            .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
            .setTitle("Ana Görev Seçim Paneli")
            .setDescription(`
Yetki yükselimi için gerekli olan ana görevinizi aşağıdan seçebilirsiniz.

**Görev Seçenekleri:**
${Object.entries(requirements.MainTasks).map(([key, data]) => {
    const reqStr = Object.entries(data.req).map(([rk, rv]) => {
        if (rk === "yetkili") return `${rv} Yetkili`;
        if (rk === "invite") return `${rv} Davet`;
        if (rk === "message") return `${rv} Mesaj`;
        return `${rv} ${rk}`;
    }).join(" + ");
    return `- **${data.label}**: ${reqStr}`;
}).join("\n")}
            `)
            .setFooter({ text: "Görevinizi seçtiğinizde ilerlemeniz sıfırlanır." })
            .setColor("Random");

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("main_task_select_yetkiliAlim").setLabel("YETKİLİ ALIM").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("main_task_select_invite").setLabel("İNVİTE").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("main_task_select_chat").setLabel("CHAT").setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
}
