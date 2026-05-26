const { Events, ApplicationCommandOptionType, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, EmbedBuilder, ButtonStyle, TextInputBuilder, TextInputStyle, MessageFlags } = require("discord.js");
const j2poncik = require("../../../../../../Global/Settings/System");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const { star } = require("../../../../../../Global/Settings/Emojis.json");

module.exports = {
    name: "destek",
    description: "Destek Sistemi",
    category: "OWNER",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["support"],
        usage: ".support",
    },

    onLoad: function (client) {
        createYetkiliBasvuru(client);
        createIstekOneriSikayet(client);
    },

    onCommand: async function (client, message, args, byj2ponembed) {
        message.channel.send({
            content: `${client.emoji("server_star")} Aşağıdaki Butonlar Üzerinden **İstek,Öneri,Şikayet** Veya **Yetkili Başvurusu** Yapabilirsiniz.`,
            components: [new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("basvur")
                    .setLabel("Yetkili Başvur")
                    .setStyle(ButtonStyle.Primary)
                .setEmoji(client.emoji("server_info") || "🛡️"),
                new ButtonBuilder()
                    .setCustomId("iös")
                    .setLabel("İstek & Öneri & Şikayet")
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji(client.emoji("server_info") || "📨"),
            )]
        });
    },
};

///////////// fonksiyonlar ///////////////////////////////

function createYetkiliBasvuru(client) {
    client.on(Events.InteractionCreate, async interaction => {
        if (interaction.customId == "basvur") {
            const modal = new ModalBuilder()
                .setCustomId("ybasvuru")
                .setTitle("Yetkili Başvurusu");

            // Her bir soru için ayrı bir ActionRow oluşturuyoruz
            const soru1 = new TextInputBuilder()
                .setCustomId("soru1")
                .setLabel("İsim Ve Yaşınız")
                .setPlaceholder("Buraya İsim Ve Yaşınızı Yazın. / Örn: Can 21")
                .setStyle(TextInputStyle.Short);

            const soru2 = new TextInputBuilder()
                .setCustomId("soru2")
                .setLabel("Günde Kaç Saat Aktifsiniz")
                .setPlaceholder("Günde Kaç Saat Aktif Olduğunuzu Yazın. / Örn: 8 Saat")
                .setStyle(TextInputStyle.Short);

            const soru3 = new TextInputBuilder()
                .setCustomId("soru3")
                .setLabel("Sunucumuz için neler yapabilirsiniz?")
                .setPlaceholder("Ne Yapabileceğinizi Yazın. / Örn: 5 Davet")
                .setStyle(TextInputStyle.Short);

            const soru4 = new TextInputBuilder()
                .setCustomId("soru4")
                .setLabel("Bize biraz kendinizden bahseder misiniz?")
                .setPlaceholder("Ne Yapmaktan Hoşlandığınızı Yazın. / Örn: Sohbet Etmek")
                .setStyle(TextInputStyle.Paragraph);

            // Her bir soruyu ayrı bir ActionRow'a ekliyoruz
            const firstActionRow = new ActionRowBuilder().addComponents(soru1);
            const secondActionRow = new ActionRowBuilder().addComponents(soru2);
            const thirdActionRow = new ActionRowBuilder().addComponents(soru3);
            const fourthActionRow = new ActionRowBuilder().addComponents(soru4);

            // Modal'a en fazla 5 ActionRow eklenebilir
            modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);
            
            await interaction.showModal(modal);
        }
    });

    client.on(Events.InteractionCreate, async (interaction) => {
        if (interaction.customId === 'ybasvuru') {
            const member = interaction.member;
    
            // First, ensure the interaction is acknowledged (use defer if necessary)
            if (!interaction.replied) {
                await interaction.reply({ content: `Başvurunuz Başarıyla Alındı!`, flags: MessageFlags.Ephemeral });
            }
    
            const yBasvuruLog = client.guilds.cache.get(j2poncik.ServerID).channels.cache.find((channel) => channel.id === j2ponm.BasvuruLogChannel);
            const button = new ButtonBuilder().setCustomId('kabul').setLabel("Kabul Et").setStyle(ButtonStyle.Success);
            const button2 = new ButtonBuilder().setCustomId('reddet').setLabel("Reddet").setStyle(ButtonStyle.Danger);
            const row = new ActionRowBuilder().addComponents(button, button2);
    
            const soru1 = interaction.fields.getTextInputValue('soru1');
            const soru2 = interaction.fields.getTextInputValue('soru2');
            const soru3 = interaction.fields.getTextInputValue('soru3');
            const soru4 = interaction.fields.getTextInputValue('soru4');
    
            const createEmbed = (title, color, description) => {
                return new EmbedBuilder()
                    .setTitle(title)
                    .setColor(color)
                    .setDescription(description);
            };
    
            const sendEmbed = (embed, components, message) => {
                yBasvuruLog.send({ embeds: [embed], components: components }).then((msg) => {
                    const aButton = new ButtonBuilder().setCustomId('kabull').setLabel("Kabul Et").setStyle(ButtonStyle.Success).setDisabled(true);
                    const dButton = new ButtonBuilder().setCustomId('reddet').setLabel("Reddet").setStyle(ButtonStyle.Danger).setDisabled(true);
                    const row2 = new ActionRowBuilder().addComponents(aButton, dButton);
    
                    client.on(Events.InteractionCreate, async (interaction) => {
                        if (interaction.customId === "kabul") {
                            const aEmbed = createEmbed("Yetkili Başvuru [KABUL EDİLDİ]", "#2b2d31", `
                                **Kullanıcı:** ${interaction.user.displayName}(\`${interaction.user.id}\`)

                                **・Soru 1:** İsim Ve Yaşınız?
                                \`\`\`
                                ${soru1}
                                \`\`\`
                                **・Soru 2:** Günde Kaç Saat Aktif Olduğunuzu Yazın?
                                \`\`\`
                                ${soru2}
                                \`\`\`
                                **・Soru 3:** Sunucumuz için neler yapabilirsiniz? 
                                \`\`\`
                                ${soru3}
                                \`\`\`
                                **・Soru 4:** Bize biraz kendinizden bahseder misiniz?
                                \`\`\`
                                ${soru4} 
                                \`\`\`

                                **Not:** Onaylamak veya reddetmek için aşağıdaki butonları kullanınız.
                            `);
                            await msg.edit({ embeds: [aEmbed], components: [row2] });
                            interaction.reply({ content: `Başarıyla ${member} kullanıcısının başvurusunu onayladınız. `, flags: MessageFlags.Ephemeral });
                            await member.send({ content: `${interaction.guild.name} Sunucusunda başvurunuz onaylandı!` });
                            member.roles.add(j2ponm.StartAuthority);
                        }
    
                        if (interaction.customId === "reddet") {
                            const dEmbed = new EmbedBuilder()
                                .setTitle("Yetkili Başvurusu [REDDEDİLDİ]")
                                .setColor("#2b2d31")
                                .setDescription(`
                                    **Kullanıcı:** ${interaction.user.displayName}(\`${interaction.user.id}\`)

                                    **・Soru 1:** İsim Ve Yaşınız?
                                    \`\`\`
                                    ${soru1}
                                    \`\`\`
                                    **・Soru 2:** Günde Kaç Saat Aktif Olduğunuzu Yazın?
                                    \`\`\`
                                    ${soru2}
                                    \`\`\`
                                    **・Soru 3:** Sunucumuz için neler yapabilirsiniz? 
                                    \`\`\`
                                    ${soru3}
                                    \`\`\`
                                    **・Soru 4:** Bize biraz kendinizden bahseder misiniz?
                                    \`\`\`
                                    ${soru4} 
                                    \`\`\`

                                    **Not:** Başvurunuz reddedildi.
                                `);
                            await msg.edit({ embeds: [dEmbed], components: [row2] });
                            interaction.reply({ content: `Başarıyla ${member} kullanıcısının başvurusunu reddedildi. `, flags: MessageFlags.Ephemeral });
                            await member.send({ content: `${interaction.guild.name} Sunucusunda başvurunuz reddedildi!` });
                        }
                    });
                });
            };
    
            const initialEmbed = createEmbed("Yetkili Başvuru [BEKLEMEDE]", "#2b2d31", `
                **Kullanıcı:** ${interaction.user.displayName}(\`${interaction.user.id}\`)

                **・Soru 1:** İsim Ve Yaşınız?
                \`\`\`
                ${soru1}
                \`\`\`
                **・Soru 2:** Günde Kaç Saat Aktif Olduğunuzu Yazın?
                \`\`\`
                ${soru2}
                \`\`\`
                **・Soru 3:** Sunucumuz için neler yapabilirsiniz? 
                \`\`\`
                ${soru3}
                \`\`\`
                **・Soru 4:** Bize biraz kendinizden bahseder misiniz?
                \`\`\`
                ${soru4} 
                \`\`\`

                **Not:** Onaylamak veya reddetmek için aşağıdaki butonları kullanınız.
            `);
            sendEmbed(initialEmbed, [row]);
        }
    });
}

function createIstekOneriSikayet(client) {
    client.on(Events.InteractionCreate, async interaction => {
        if (interaction.customId == "iös") {
            const modal = new ModalBuilder()
                .setCustomId("ibasvuru")
                .setTitle("İstek Öneri Şikayet Talebi");

            const soru1 = new TextInputBuilder()
                .setCustomId("s1")
                .setLabel("İşlem Türünüzü Yazınız")
                .setPlaceholder("Örnek: İstek/Öneri/Şikayet")
                .setStyle(TextInputStyle.Short);

            const soru2 = new TextInputBuilder()
                .setCustomId("s2")
                .setLabel("Sorunuzu bildiriniz")
                .setPlaceholder("Örnek: Sunucuya Güzel Sistemler eklensin.")
                .setStyle(TextInputStyle.Paragraph);

            const firstActionRow = new ActionRowBuilder().addComponents(soru1);
            const secondActionRow = new ActionRowBuilder().addComponents(soru2);

            modal.addComponents(firstActionRow, secondActionRow);
            await interaction.showModal(modal);
        }
    });

    client.on(Events.InteractionCreate, async (interaction) => {
        if (interaction.customId === 'ibasvuru') {
            await interaction.reply({ content: `Başvurunuz Başarıyla Alındı!`, flags: MessageFlags.Ephemeral });

            const iBasvuruLog = client.guilds.cache.get(j2poncik.ServerID).channels.cache.find((channel) => channel.id === j2ponm.IstekOneriSikayetLogChannel);
            const s1 = interaction.fields.getTextInputValue('s1');
            const s2 = interaction.fields.getTextInputValue('s2');

            const byj2pon = new EmbedBuilder()
                .setColor("#2b2d31")
                .setDescription(`
                    **Kullanıcı:** ${interaction.user.displayName}(\`${interaction.user.id}\`)

                    **・Soru 1:** İşlem Türünüzü Yazınız?
                    \`\`\`
                    ${s1}
                    \`\`\`
                    **・Soru 2:** Sorunuzu bildiriniz.
                    \`\`\`
                    ${s2}
                    \`\`\`
                `);
            iBasvuruLog.send({ embeds: [byj2pon] });
        }
    });
}
