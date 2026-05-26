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
const userResponsibilityTask = require("../../../../../../Global/Schemas/userResponsibilityTask");
const emojis = require("../../../../../../Global/Settings/Emojis.json");

module.exports = {
    name: "sgörev",
    description: "Sorumluluk görev seçim paneli",
    category: "STAT",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["sorumlulukgörev", "sgorev"],
        usage: ".sgörev",
    },

    onLoad: function (client) {
        client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isButton()) return;
            const { customId, user, member, guild } = interaction;

            if (customId.startsWith("resp_select_")) {
                const respKey = customId.replace("resp_select_", "");
                
                // Yetki seviyesini belirle (Alt/Orta/Ust)
                let level = "AltYetki";
                if (setup.OrtaYetkiRoles?.some(r => member.roles.cache.has(r))) level = "OrtaYetki";
                if (setup.UstYetkiRoles?.some(r => member.roles.cache.has(r))) level = "UstYetki";

                const taskData = requirements.ResponsibilityTasks[level].tasks[respKey];
                if (!taskData) {
                    return interaction.reply({ content: "Bu sorumluluk için bu seviyede görev tanımlanmamış.", flags: MessageFlags.Ephemeral });
                }

                // Rol kontrolü (İlgili sorumluluk rolüne sahip mi?)
                const staffRoles = setup.Sorumluluk?.StaffRoles?.[respKey];
                if (staffRoles) {
                    const hasRole = member.roles.cache.has(staffRoles.responsible) || member.roles.cache.has(staffRoles.leader);
                    if (!hasRole) {
                        return interaction.reply({ 
                            content: `Bu görevi alabilmek için ilgili sorumluluk rolüne (Sorumlu veya Lider) sahip olmalısınız.`, 
                            flags: MessageFlags.Ephemeral 
                        });
                    }
                }

                // Görevi ata
                await userResponsibilityTask.findOneAndUpdate(
                    { userId: user.id, responsibilityKey: respKey },
                    { 
                        $set: { 
                            level: level,
                            startDate: Date.now(),
                            'counts.message': 0,
                            'counts.voice': 0,
                            'counts.register': 0,
                            'counts.invite': 0,
                            'counts.yetkili': 0,
                            'counts.tagli': 0,
                            'counts.stream': 0,
                            'counts.oryantasyon': 0
                        } 
                    },
                    { upsert: true }
                );

                return interaction.reply({ 
                    content: `${emojis.server_onay} **${taskData.label}** görevi başarıyla üzerinize tanımlandı. İlerlemeyi \`.stat\` üzerinden takip edebilirsiniz.`, 
                    flags: MessageFlags.Ephemeral 
                });
            }
        });
    },

    onCommand: async function (client, message, args) {
        if (!system.BotsOwners.includes(message.author.id) && !message.member.permissions.has(8n)) return;

        const embed = new EmbedBuilder()
            .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
            .setTitle("Sorumluluk Görev Seçim Paneli")
            .setDescription(`
Aşağıdaki butonları kullanarak sorumluluk alanınıza uygun görevi seçebilirsiniz.
Görevler yetki seviyenize (**Alt/Orta/Üst**) göre otomatik olarak belirlenir.

**Sorumluluk Görevleri (Başlangıç):**
${Object.entries(requirements.ResponsibilityTasks.AltYetki.tasks).map(([key, data]) => {
    const reqStr = Object.entries(data.req).map(([rk, rv]) => {
        if (rk === "voice") return `${Math.floor(rv / 1000 / 60 / 60)} Saat Ses`;
        if (rk === "stream") return `${Math.floor(rv / 1000 / 60 / 60)} Saat Yayın`;
        if (rk === "message") return `${rv} Mesaj`;
        if (rk === "register") return `${rv} Kayıt`;
        if (rk === "tagli") return `${rv} Taglı`;
        if (rk === "yetkili") return `${rv} Yetkili`;
        if (rk === "invite") return `${rv} Davet`;
        if (rk === "oryantasyon") return `${rv} Oryantasyon`;
        return `${rv} ${rk}`;
    }).join(" + ");
    return `> **${data.label}**: ${reqStr}`;
}).join("\n")}
            `)
            .setFooter({ text: "Görevinizi seçtikten sonra statlarınız sıfırdan saymaya başlar." })
            .setColor("Random");

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("resp_select_yetkili").setLabel("Yetkili Alım").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("resp_select_streamer").setLabel("Streamer").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("resp_select_public").setLabel("Public").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("resp_select_rehberlik").setLabel("Rehber").setStyle(ButtonStyle.Primary)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("resp_select_register").setLabel("Teyit").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("resp_select_sorunCozucu").setLabel("Sorun Çözücü").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("resp_select_etkinlik").setLabel("Etkinlik").setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({ embeds: [embed], components: [row1, row2] });
    }
}
