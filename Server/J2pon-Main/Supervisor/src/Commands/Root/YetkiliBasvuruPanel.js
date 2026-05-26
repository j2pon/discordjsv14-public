const {
    Events,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    EmbedBuilder,
    TextInputBuilder,
    TextInputStyle,
    PermissionsBitField,
    MessageFlags,
} = require("discord.js");
// Components V2 (discord.js 14.18+) – yoksa panel content + row ile gönderilir
let ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize;
try {
    const v2 = require("discord.js");
    ContainerBuilder = v2.ContainerBuilder;
    TextDisplayBuilder = v2.TextDisplayBuilder;
    SeparatorBuilder = v2.SeparatorBuilder;
    SeparatorSpacingSize = v2.SeparatorSpacingSize;
} catch (_) {}

const j2poncik = require("../../../../../../Global/Settings/System");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const GuildTagService = require("../../../../../../Global/Services/GuildTagService");

// Log mesajı ID'si -> başvuru verisi (onay/ret için)
const applicationStore = new Map();

module.exports = {
    name: "yetkili-başvuru-panel",
    description: "Yetkili Başvuru Paneli",
    category: "OWNER",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["yetkilibasvurupanel", "yetkili-panel"],
        usage: ".yetkili-başvuru-panel",
    },

    onLoad: function (client) {
        registerYetkiliPanelHandlers(client);
    },

    onCommand: async function (client, message, args) {
        if (!message.guild || !message.member) return;

        if (
            !j2ponm.OwnerRoles.some((r) => message.member.roles.cache.has(r)) &&
            !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
        ) {
            message.react(`${client.emoji("server_carpi")}`);
            message.reply({ content: `Yeterli yetkin yok!` }).then((e) => setTimeout(() => e.delete(), 5000));
            return;
        }

        const guildName = message.guild.name;

        const titleContent = `## • Merhaba **${guildName} Sunucusunun Yetkili Başvuru Paneline Hoş Geldin!**`;
        const descContent =
            "> Sunucumuzun gelişimi ve düzeni için ekibimize yeni yetkililer arıyoruz! Eğer topluluğumuza katkı sağlamak ve moderasyon ekibinin bir parçası olmak istiyorsan aşağıdaki butona tıklayarak başvurabilirsin.";
        const processContent = [
            "• **Başvuru Süreci**",
            "• Gerekli formu doldurduktan sonra başvurun incelemeye alınır.",
            "• Uygun görüldüğün takdirde sana özel bir görüşme ayarlanır.",
            "• Sonuçlar **DM** üzerinden bildirilir.",
        ].join("\n");
        const warningContent = "*Lütfen başvuru yapmadan önce aktif olabileceğinden emin ol!*";

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("yetkili_basvuru_panel")
                .setLabel("Yetkili Başvurusu")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(client.emoji("appEmoji_create") || "📋")
        );

        if (ContainerBuilder && TextDisplayBuilder && SeparatorBuilder && SeparatorSpacingSize != null) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(titleContent),
                    new TextDisplayBuilder().setContent(descContent)
                )
                .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(processContent),
                    new TextDisplayBuilder().setContent(warningContent)
                );
            const thumbEmbed = new EmbedBuilder().setThumbnail(message.client.user.displayAvatarURL({ size: 256 })).setDescription("\u200b").setColor(0x2F3136);
            await message.channel.send({
                embeds: [thumbEmbed],
                components: [container, row],
                flags: MessageFlags.IsComponentsV2,
            }).catch(async (err) => {
                console.error("Yetkili panel (Components V2) gönderilemedi, content ile deniyor:", err?.message);
                const content = [titleContent, "", descContent, "", processContent, "", warningContent].join("\n");
                const embed = new EmbedBuilder().setDescription(content).setThumbnail(message.client.user.displayAvatarURL({ size: 256 })).setColor(0x2F3136);
                await message.channel.send({ embeds: [embed], components: [row] });
            });
        } else {
            const content = [titleContent, "", descContent, "", processContent, "", warningContent].join("\n");
            const embed = new EmbedBuilder().setDescription(content).setThumbnail(message.client.user.displayAvatarURL({ size: 256 })).setColor(0x2F3136);
            await message.channel.send({ embeds: [embed], components: [row] });
        }
    },
};

function registerYetkiliPanelHandlers(client) {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (interaction.isButton() && interaction.customId === "yetkili_basvuru_panel") {
            if (!interaction.guild || !interaction.member) {
                return interaction.reply({
                    content: "Bu işlem sadece sunucularda kullanılabilir.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            const hasGuildTag = await GuildTagService.memberHasGuildTag(client, interaction.member);
            if (!hasGuildTag) {
                return interaction.reply({
                    content: "Yetkili başvurusu yapmak için sunucu tag'ına sahip olmalısınız. Tag almak için isminize sunucu tagımızı ekleyin.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            const modal = new ModalBuilder()
                .setCustomId("yetkili_basvuru_panel_form")
                .setTitle("Yetkili Başvuru");

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId("gunluk_saat")
                        .setLabel("GÜNLÜK KAÇ SAAT AKTİF OLABİLİRSİN? *")
                        .setPlaceholder("ÖRN: 5 Saat")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId("daha_once_yetkili")
                        .setLabel("DAHA ÖNCE YETKİLİ OLDUNUZ MU? *")
                        .setPlaceholder("ÖRN: Evet, x Sunucuda yetkili oldum.")
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId("iletisim")
                        .setLabel("İNSANLARLA İLETİŞİMİNİZ NASIL? *")
                        .setPlaceholder("ÖRN: İyi, kötü, orta")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId("neden_yetkili")
                        .setLabel("NEDEN YETKİLİ OLMAK İSTİYORSUNUZ? *")
                        .setPlaceholder("ÖRN: Çünkü sunucuya katkı sağlamak istiyorum.")
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                )
            );

            await interaction.showModal(modal);
        }

        if (interaction.isModalSubmit() && interaction.customId === "yetkili_basvuru_panel_form") {
            if (!interaction.guild || !interaction.member) {
                return interaction.reply({
                    content: "Bu işlem sadece sunucularda kullanılabilir.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            await interaction.reply({
                content: "Başvurunuz başarıyla alındı! Sonuçlar **DM** üzerinden bildirilecektir.",
                flags: MessageFlags.Ephemeral,
            });

            const gunlukSaat = interaction.fields.getTextInputValue("gunluk_saat");
            const dahaOnceYetkili = interaction.fields.getTextInputValue("daha_once_yetkili");
            const iletisim = interaction.fields.getTextInputValue("iletisim");
            const nedenYetkili = interaction.fields.getTextInputValue("neden_yetkili");

            const logChannel = client.guilds.cache
                .get(j2poncik.ServerID)
                ?.channels.cache.get(j2ponm.BasvuruLogChannel);

            if (!logChannel) {
                console.error("Yetkili başvuru log kanalı (BasvuruLogChannel) bulunamadı.");
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle("Yetkili Başvuru [BEKLEMEDE]")
                .setColor("#2b2d31")
                .setDescription(
                    [
                        `**Kullanıcı:** ${interaction.user} (\`${interaction.user.id}\`)`,
                        "",
                        "**・Günlük kaç saat aktif olabilirsin?**",
                        "```" + (gunlukSaat || "-") + "```",
                        "**・Daha önce yetkili oldunuz mu?**",
                        "```" + (dahaOnceYetkili || "-") + "```",
                        "**・İnsanlarla iletişiminiz nasıl?**",
                        "```" + (iletisim || "-") + "```",
                        "**・Neden yetkili olmak istiyorsunuz?**",
                        "```" + (nedenYetkili || "-") + "```",
                        "",
                        "**Not:** Onaylamak veya reddetmek için aşağıdaki butonları kullanınız.",
                    ].join("\n")
                )
                .addFields({ name: "Sunucu tag'ı", value: (await GuildTagService.memberHasGuildTag(client, interaction.member)) ? "Var" : "Yok", inline: true })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("yetkili_panel_onay")
                    .setLabel("Onayla")
                    .setStyle(ButtonStyle.Success)
                    .setEmoji(client.emoji("server_onay") || "✅"),
                new ButtonBuilder()
                    .setCustomId("yetkili_panel_red")
                    .setLabel("Reddet")
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji(client.emoji("server_carpi") || "❌")
            );

            const logMsg = await logChannel.send({ embeds: [embed], components: [row] }).catch(console.error);
            if (logMsg) {
                applicationStore.set(logMsg.id, {
                    applicantId: interaction.user.id,
                    guildId: interaction.guild.id,
                    gunlukSaat,
                    dahaOnceYetkili,
                    iletisim,
                    nedenYetkili,
                });
            }
        }

        if (
            interaction.isButton() &&
            (interaction.customId === "yetkili_panel_onay" || interaction.customId === "yetkili_panel_red")
        ) {
            const data = applicationStore.get(interaction.message.id);
            if (!data) {
                return interaction.reply({
                    content: "Bu başvuru zaten işlendi veya geçersiz.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            const guild = client.guilds.cache.get(data.guildId);
            const member = guild?.members.cache.get(data.applicantId);
            const isOnay = interaction.customId === "yetkili_panel_onay";

            const disabledRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("yetkili_panel_onay_done")
                    .setLabel("Onayla")
                    .setStyle(ButtonStyle.Success)
                    .setEmoji(client.emoji("server_onay") || "✅")
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId("yetkili_panel_red_done")
                    .setLabel("Reddet")
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji(client.emoji("server_carpi") || "❌")
                    .setDisabled(true)
            );

            if (isOnay) {
                if (member && j2ponm.StartAuthority) {
                    await member.roles.add(j2ponm.StartAuthority).catch(() => {});
                }
                try {
                    await (member?.user || client.users.cache.get(data.applicantId))?.send({
                        content: `${interaction.guild?.name || "Sunucu"} sunucusunda yetkili başvurunuz onaylandı!`,
                    });
                } catch (_) {}

                const updatedEmbed = new EmbedBuilder()
                    .setTitle("Yetkili Başvuru [KABUL EDİLDİ]")
                    .setColor("#2b2d31")
                    .setDescription(
                        [
                            `**Kullanıcı:** <@${data.applicantId}> (\`${data.applicantId}\`)`,
                            "",
                            "**・Günlük kaç saat aktif olabilirsin?**",
                            "```" + (data.gunlukSaat || "-") + "```",
                            "**・Daha önce yetkili oldunuz mu?**",
                            "```" + (data.dahaOnceYetkili || "-") + "```",
                            "**・İnsanlarla iletişiminiz nasıl?**",
                            "```" + (data.iletisim || "-") + "```",
                            "**・Neden yetkili olmak istiyorsunuz?**",
                            "```" + (data.nedenYetkili || "-") + "```",
                            "",
                            `**Not:** ${interaction.user} tarafından onaylandı.`,
                        ].join("\n")
                    )
                    .setTimestamp();

                await interaction.message.edit({ embeds: [updatedEmbed], components: [disabledRow] }).catch(() => {});
                await interaction.reply({
                    content: `Başvuru onaylandı. ${member ? `${member} kullanıcısına rol verildi ve DM gönderildi.` : ""}`,
                    flags: MessageFlags.Ephemeral,
                });
            } else {
                try {
                    await (member?.user || client.users.cache.get(data.applicantId))?.send({
                        content: `${interaction.guild?.name || "Sunucu"} sunucusunda yetkili başvurunuz reddedildi.`,
                    });
                } catch (_) {}

                const updatedEmbed = new EmbedBuilder()
                    .setTitle("Yetkili Başvuru [REDDEDİLDİ]")
                    .setColor("#2b2d31")
                    .setDescription(
                        [
                            `**Kullanıcı:** <@${data.applicantId}> (\`${data.applicantId}\`)`,
                            "",
                            "**・Günlük kaç saat aktif olabilirsin?**",
                            "```" + (data.gunlukSaat || "-") + "```",
                            "**・Daha önce yetkili oldunuz mu?**",
                            "```" + (data.dahaOnceYetkili || "-") + "```",
                            "**・İnsanlarla iletişiminiz nasıl?**",
                            "```" + (data.iletisim || "-") + "```",
                            "**・Neden yetkili olmak istiyorsunuz?**",
                            "```" + (data.nedenYetkili || "-") + "```",
                            "",
                            `**Not:** Başvuru ${interaction.user} tarafından reddedildi.`,
                        ].join("\n")
                    )
                    .setTimestamp();

                await interaction.message.edit({ embeds: [updatedEmbed], components: [disabledRow] }).catch(() => {});
                await interaction.reply({
                    content: "Başvuru reddedildi. Başvuru sahibine DM gönderildi.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            applicationStore.delete(interaction.message.id);
        }
    });
}
