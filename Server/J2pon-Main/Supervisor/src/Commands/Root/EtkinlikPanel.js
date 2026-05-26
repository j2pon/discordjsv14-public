const {
    Events,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    EmbedBuilder,
    TextInputBuilder,
    TextInputStyle,
    ChannelType,
} = require("discord.js");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const etkinlikState = require("../../../../../../Global/Schemas/etkinlikState");

function canUseEtkinlikPanel(member) {
    if (!member || !j2ponm.Sorumluluk?.StaffRoles?.etkinlik) return false;
    const leaderRoleId = j2ponm.Sorumluluk.StaffRoles.etkinlik.leader;
    const responsibleRoleId = j2ponm.Sorumluluk.StaffRoles.etkinlik.responsible;
    return (leaderRoleId && member.roles.cache.has(leaderRoleId)) ||
        (responsibleRoleId && member.roles.cache.has(responsibleRoleId));
}

module.exports = {
    name: "etkinlikpanel",
    description: "Etkinlik Yönetim Paneli - sadece Etkinlik Lideri kullanabilir",
    category: "OWNER",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["etkinlik-panel", "etkinlikpanel"],
        usage: ".etkinlikpanel",
    },

    onLoad: function (client) {
        client.on(Events.InteractionCreate, async (interaction) => {
            if (interaction.isButton() && interaction.customId === "etkinlik_baslat") {
                if (!interaction.guild || !interaction.member) {
                    return interaction.reply({ content: "Bu işlem sadece sunucularda kullanılabilir.", ephemeral: true });
                }
                if (!canUseEtkinlikPanel(interaction.member)) {
                    return interaction.reply({ content: "Bu paneli sadece **Etkinlik Lideri** kullanabilir.", ephemeral: true });
                }
                const state = await etkinlikState.findOne({ guildID: interaction.guild.id });
                if (state?.activeChannelID) {
                    return interaction.reply({
                        content: "Zaten aktif bir etkinlik var. Önce **Etkinlik Bitir** ile sonlandırın.",
                        ephemeral: true,
                    });
                }
                const modal = new ModalBuilder()
                    .setCustomId("etkinlik_modal")
                    .setTitle("Etkinlik Başlat");
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("etkinlik_name")
                            .setLabel("Etkinlik adı")
                            .setPlaceholder("Örn: Oyun Gecesi")
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                            .setMaxLength(100)
                    )
                );
                await interaction.showModal(modal);
                return;
            }

            if (interaction.isModalSubmit() && interaction.customId === "etkinlik_modal") {
                if (!interaction.guild || !interaction.member) {
                    return interaction.reply({ content: "Bu işlem sadece sunucularda kullanılabilir.", ephemeral: true });
                }
                if (!canUseEtkinlikPanel(interaction.member)) {
                    return interaction.reply({ content: "Bu işlemi sadece **Etkinlik Lideri** yapabilir.", ephemeral: true });
                }
                const name = interaction.fields.getTextInputValue("etkinlik_name").trim();
                if (!name) return interaction.reply({ content: "Etkinlik adı boş olamaz.", ephemeral: true });

                const guildId = interaction.guild.id;
                const categories = Array.isArray(j2ponm.ActivityCategorys) ? j2ponm.ActivityCategorys : [];
                if (categories.length === 0) {
                    return interaction.reply({
                        content: "Sunucuda **ActivityCategorys** (Eğlence Kategorisi) ayarlı değil. Setup üzerinden ekleyin.",
                        ephemeral: true,
                    });
                }

                const parentId = categories[0];
                const parent = interaction.guild.channels.cache.get(parentId);
                if (!parent || parent.type !== ChannelType.GuildCategory) {
                    return interaction.reply({
                        content: "Etkinlik kategorisi bulunamadı veya geçersiz. ActivityCategorys kontrol edin.",
                        ephemeral: true,
                    });
                }

                const channel = await interaction.guild.channels.create({
                    name: name,
                    type: ChannelType.GuildVoice,
                    parent: parentId,
                }).catch(() => null);
                if (!channel) {
                    return interaction.reply({ content: "Etkinlik kanalı oluşturulurken hata oluştu.", ephemeral: true });
                }

                await etkinlikState.findOneAndUpdate(
                    { guildID: guildId },
                    { $set: { activeChannelID: channel.id, positionBeforeUp: null } },
                    { upsert: true, new: true }
                );

                await interaction.reply({
                    content: `**${name}** etkinliği başlatıldı. Eğlence kategorisi içinde kanal oluşturuldu.`,
                    ephemeral: true,
                });
                return;
            }

            if (interaction.isButton() && interaction.customId === "etkinlik_bitir") {
                if (!interaction.guild || !interaction.member) {
                    return interaction.reply({ content: "Bu işlem sadece sunucularda kullanılabilir.", ephemeral: true });
                }
                if (!canUseEtkinlikPanel(interaction.member)) {
                    return interaction.reply({ content: "Bu paneli sadece **Etkinlik Lideri** kullanabilir.", ephemeral: true });
                }
                const state = await etkinlikState.findOne({ guildID: interaction.guild.id });
                if (!state?.activeChannelID) {
                    return interaction.reply({ content: "Aktif etkinlik yok. Önce **Etkinlik Başlat** ile bir etkinlik oluşturun.", ephemeral: true });
                }
                const channel = await interaction.guild.channels.fetch(state.activeChannelID).catch(() => null);
                if (channel) await channel.delete().catch(() => {});
                await etkinlikState.findOneAndUpdate(
                    { guildID: interaction.guild.id },
                    { $set: { activeChannelID: null, positionBeforeUp: null } }
                );
                return interaction.reply({ content: "Etkinlik sonlandırıldı.", ephemeral: true });
            }

            if (interaction.isButton() && interaction.customId === "etkinlik_yukari") {
                if (!interaction.guild || !interaction.member) {
                    return interaction.reply({ content: "Bu işlem sadece sunucularda kullanılabilir.", ephemeral: true });
                }
                if (!canUseEtkinlikPanel(interaction.member)) {
                    return interaction.reply({ content: "Bu paneli sadece **Etkinlik Lideri** kullanabilir.", ephemeral: true });
                }
                const categories = Array.isArray(j2ponm.ActivityCategorys) ? j2ponm.ActivityCategorys : [];
                if (categories.length === 0) {
                    return interaction.reply({ content: "ActivityCategorys ayarlı değil.", ephemeral: true });
                }
                const category = await interaction.guild.channels.fetch(categories[0]).catch(() => null);
                if (!category || category.type !== ChannelType.GuildCategory) {
                    return interaction.reply({ content: "Etkinlik kategorisi bulunamadı.", ephemeral: true });
                }
                const positionBeforeUp = category.position;
                await category.setPosition(0).catch(() => null);
                await etkinlikState.findOneAndUpdate(
                    { guildID: interaction.guild.id },
                    { $set: { positionBeforeUp } },
                    { upsert: true }
                );
                return interaction.reply({ content: "Etkinlik kategorisi en üste alındı.", ephemeral: true });
            }

            if (interaction.isButton() && interaction.customId === "etkinlik_asagi") {
                if (!interaction.guild || !interaction.member) {
                    return interaction.reply({ content: "Bu işlem sadece sunucularda kullanılabilir.", ephemeral: true });
                }
                if (!canUseEtkinlikPanel(interaction.member)) {
                    return interaction.reply({ content: "Bu paneli sadece **Etkinlik Lideri** kullanabilir.", ephemeral: true });
                }
                const state = await etkinlikState.findOne({ guildID: interaction.guild.id });
                if (state?.positionBeforeUp == null) {
                    return interaction.reply({
                        content: "Kategori önce **Etkinlik Yukarı** ile yukarı alınmamış. Eski konum bilinmiyor.",
                        ephemeral: true,
                    });
                }
                const categories = Array.isArray(j2ponm.ActivityCategorys) ? j2ponm.ActivityCategorys : [];
                if (categories.length === 0) {
                    return interaction.reply({ content: "ActivityCategorys ayarlı değil.", ephemeral: true });
                }
                const category = await interaction.guild.channels.fetch(categories[0]).catch(() => null);
                if (!category || category.type !== ChannelType.GuildCategory) {
                    return interaction.reply({ content: "Etkinlik kategorisi bulunamadı.", ephemeral: true });
                }
                await category.setPosition(state.positionBeforeUp).catch(() => null);
                await etkinlikState.findOneAndUpdate(
                    { guildID: interaction.guild.id },
                    { $set: { positionBeforeUp: null } }
                );
                return interaction.reply({ content: "Etkinlik kategorisi eski yerine alındı.", ephemeral: true });
            }
        });
    },

    onCommand: async function (client, message, args) {
        if (!message.guild || !message.member) return;
        if (!canUseEtkinlikPanel(message.member)) {
            message.react("❌");
            message.reply({ content: "Bu komutu sadece **Etkinlik Lideri** kullanabilir!" }).then((e) => setTimeout(() => e.delete().catch(() => {}), 5000));
            return;
        }

        const guildName = message.guild.name;
        const panelContent =
            `## 📢 ${guildName} Sunucusunun Etkinlik Yönetim Paneli\n\n` +
            "Buradan etkinlik başlatabilir veya sonlandırabilirsiniz.\n\n" +
            "• **Etkinlik Başlat:** Yeni bir etkinlik oluşturur.\n" +
            "• **Etkinlik Bitir:** Aktif etkinliği sonlandırır.\n" +
            "• **Etkinlik Yukarı:** Etkinlik kategorisini en üste çeker.\n" +
            "• **Etkinlik Aşağı:** Etkinlik kategorisini eski haline getirir.";

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
            .setCustomId("etkinlik_baslat")
                .setLabel("Etkinlik Başlat")
                .setStyle(ButtonStyle.Success)
                .setEmoji(client.emoji("server_onay") || "🚀"),
            new ButtonBuilder()
                .setCustomId("etkinlik_bitir")
                .setLabel("Etkinlik Bitir")
                .setStyle(ButtonStyle.Danger)
                .setEmoji(client.emoji("server_red") || "🚀"),
            new ButtonBuilder()
                .setCustomId("etkinlik_yukari")
                .setLabel("Etkinlik Yukarı")
                .setStyle(ButtonStyle.Primary)
                .setEmoji(client.emoji("j2pon_ust") || "🚀"),
            new ButtonBuilder()
                .setCustomId("etkinlik_asagi")
                .setLabel("Etkinlik Aşağı")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(client.emoji("j2pon_alt") || "🚀")
        );

        const panelEmbed = new EmbedBuilder()
            .setDescription(panelContent)
            .setThumbnail(message.client.user.displayAvatarURL({ size: 256 }))
            .setColor(0x2F3136);
        await message.channel.send({ embeds: [panelEmbed], components: [row] });
        await message.reply({ content: "Etkinlik paneli gönderildi." }).then((e) => setTimeout(() => e.delete().catch(() => {}), 5000));
    },
};
