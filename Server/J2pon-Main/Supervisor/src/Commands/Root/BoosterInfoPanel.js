const {
    Events,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    EmbedBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder,
    PermissionsBitField,
    MessageFlags,
} = require("discord.js");
let ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, SectionBuilder, ThumbnailBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder;
try {
    const v2 = require("discord.js");
    ContainerBuilder = v2.ContainerBuilder;
    TextDisplayBuilder = v2.TextDisplayBuilder;
    SeparatorBuilder = v2.SeparatorBuilder;
    SeparatorSpacingSize = v2.SeparatorSpacingSize;
    SectionBuilder = v2.SectionBuilder;
    ThumbnailBuilder = v2.ThumbnailBuilder;
    MediaGalleryBuilder = v2.MediaGalleryBuilder;
    MediaGalleryItemBuilder = v2.MediaGalleryItemBuilder;
} catch (_) {}

const j2poncik = require("../../../../../../Global/Settings/System");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const emojis = require("../../../../../../Global/Settings/Emojis.json");

// Menu.js ile aynı renk listesi (gösterilen label'lar)
const Colors = [
    "Siyah",
    "Beyaz",
    "Kirmizi",
    "Mavi",
    "Yeşil",
    "Kahverengi",
    "Mor",
    "Pembe",
];

module.exports = {
    name: "boosterinfopanel",
    description: "Booster panelini kanala gönderir (İsim Değiştir / Renk Değiştir).",
    category: "OWNER",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["boosterpanel", "booster-panel"],
        usage: ".boosterinfopanel",
    },

    onLoad: function (client) {
        registerBoosterPanelHandlers(client);
    },

    onCommand: async function (client, message, args) {
        if (!message.guild || !message.member) return;

        if (
            !j2ponm.OwnerRoles?.some((r) => message.member.roles.cache.has(r)) &&
            !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
        ) {
            message.react(`${client.emoji("server_carpi")}`);
            message.reply({ content: "Yeterli yetkin yok!" }).then((e) => setTimeout(() => e.delete(), 5000));
            return;
        }

        const guildName = message.guild.name;

        const titleContent = `${emojis.server_star} Merhaba! **${guildName}** Sunucusunun Booster Paneline Hoş Geldin!`;
        const descContent =
            "> Sunucumuzu boostlayan üyeler için özel ayrıcalıklar sunulmaktadır! Eğer **booster** isen aşağıdaki işlemleri gerçekleştirebilirsin:";
        const isimContent = [
            `**${emojis.j2pon_booster} İsim Değiştir:**`,
            "Sunucu kurallarına uygun şekilde kullanıcı adını değiştir.",
        ].join("\n");
        const renkContent = [
            `**${emojis.j2pon_bag} Renk Değiştir:**`,
            "Kendine özel bir renk seçerek adını renklendir.",
        ].join("\n");
        const warningContent = [`${emojis.server_info} Küfür, saldırgan veya uygunsuz isimler yasaktır.`].join("\n");

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
            .setCustomId("booster_panel_isim")
                .setLabel("İsim Değiştir")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(client.emoji("j2pon_booster") || "🦄"),
            new ButtonBuilder()
                .setCustomId("booster_panel_renk")
                .setLabel("Renk Değiştir")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(client.emoji("j2pon_bag") || "🧙‍♀️")
        );

        const fullText = [titleContent, "", descContent, "", isimContent, "", renkContent, "", warningContent].join("\n");

        if (ContainerBuilder && TextDisplayBuilder && SeparatorBuilder && SeparatorSpacingSize != null && SectionBuilder && ThumbnailBuilder) {
            try {
                const container = new ContainerBuilder();
                const section = new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(titleContent),
                        new TextDisplayBuilder().setContent(descContent)
                    )
                    .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.client.user.displayAvatarURL({ size: 256 })));
                container.addSectionComponents(section);
                container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true));
                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(isimContent),
                    new TextDisplayBuilder().setContent(renkContent),
                    new TextDisplayBuilder().setContent(warningContent)
                );
                if (container.addActionRowComponents) container.addActionRowComponents(row);
                await message.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
            } catch (err) {
                console.error("Booster panel (Components V2) gönderilemedi, content ile deniyor:", err?.message);
                const embed = new EmbedBuilder().setDescription(fullText).setThumbnail(message.client.user.displayAvatarURL({ size: 256 })).setColor(0x2F3136);
                await message.channel.send({ embeds: [embed], components: [row] }).catch(() => {});
            }
        } else {
            const embed = new EmbedBuilder().setDescription(fullText).setThumbnail(message.client.user.displayAvatarURL({ size: 256 })).setColor(0x2F3136);
            await message.channel.send({ embeds: [embed], components: [row] });
        }
    },
};

function registerBoosterPanelHandlers(client) {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (interaction.isButton() && interaction.customId === "booster_panel_isim") {
            if (!interaction.guild || !interaction.member) {
                return interaction.reply({
                    content: "Bu işlem sadece sunucularda kullanılabilir.",
                    flags: MessageFlags.Ephemeral,
                });
            }
            const booster = j2ponm.BoosterRole;
            if (!booster) {
                return interaction.reply({
                    content: "Booster rolü bulunamadı!",
                    flags: MessageFlags.Ephemeral,
                });
            }
            if (!interaction.member.roles.cache.has(booster)) {
                return interaction.reply({
                    content: "Bu işlemi kullanabilmek için booster rolüne sahip olmalısın!",
                    flags: MessageFlags.Ephemeral,
                });
            }
            const modal = new ModalBuilder()
                .setCustomId("booster_panel_isim_modal")
                .setTitle("İsim Değiştir");
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId("booster_nick")
                        .setLabel("Yeni kullanıcı adınız")
                        .setPlaceholder("Örn: Can")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                        .setMinLength(2)
                        .setMaxLength(32)
                )
            );
            await interaction.showModal(modal);
        }

        if (interaction.isModalSubmit() && interaction.customId === "booster_panel_isim_modal") {
            if (!interaction.guild || !interaction.member) {
                return interaction.reply({
                    content: "Bu işlem sadece sunucularda kullanılabilir.",
                    flags: MessageFlags.Ephemeral,
                });
            }
            const booster = j2ponm.BoosterRole;
            if (!booster || !interaction.member.roles.cache.has(booster)) {
                return interaction.reply({
                    content: "Bu işlem için booster rolüne sahip olmalısın!",
                    flags: MessageFlags.Ephemeral,
                });
            }
            let isim = interaction.fields.getTextInputValue("booster_nick")?.trim() || "";
            isim = isim
                .split(/\s+/)
                .map((arg) => arg.charAt(0).replace("i", "İ").toUpperCase() + arg.slice(1))
                .join(" ");
            if (isim.length < 2) {
                return interaction.reply({
                    content: "İsim en az 2 karakter olmalıdır!",
                    flags: MessageFlags.Ephemeral,
                });
            }
            const ozelharf = /([^a-zA-ZIıİiÜüĞğŞşÖöÇç0-9 ]+)/gi;
            if (isim.match(ozelharf)) {
                return interaction.reply({
                    content: "Bu isimde özel karakterler bulunmamalıdır. Lütfen tekrar dene!",
                    flags: MessageFlags.Ephemeral,
                });
            }
            const prefix = j2ponm.ServerUntagged || "";
            const j2poncikNick = `${prefix} ${isim}`.trim();
            await interaction.member.setNickname(j2poncikNick).catch(() => {});
            return interaction.reply({
                content: `Başarıyla ismin \`${j2poncikNick}\` olarak değiştirildi!`,
                flags: MessageFlags.Ephemeral,
            });
        }

        if (interaction.isButton() && interaction.customId === "booster_panel_renk") {
            if (!interaction.guild || !interaction.member) {
                return interaction.reply({
                    content: "Bu işlem sadece sunucularda kullanılabilir.",
                    flags: MessageFlags.Ephemeral,
                });
            }
            const booster = j2ponm.BoosterRole;
            const isOwner =
                j2ponm.OwnerRoles?.some((r) => interaction.member.roles.cache.has(r)) ||
                interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

            if (!booster && !isOwner) {
                return interaction.reply({
                    content: "Booster rolü yapılandırılmamış.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            if (!interaction.member.roles.cache.has(booster) && !isOwner) {
                return interaction.reply({
                    content: "Renk seçmek için booster, yönetici veya bot sahibi olmalısın!",
                    flags: MessageFlags.Ephemeral,
                });
            }
            const guild = client.guilds.cache.get(j2poncik.ServerID) || interaction.guild;
            const renkSelect = new StringSelectMenuBuilder()
                .setCustomId("booster_panel_renk_select")
                .setPlaceholder("Renk rollerini seçmek için tıkla!")
                .setMinValues(1)
                .setMaxValues(1);
            const emojiBul = (emojiName) => {
                if (!emojiName) return null;
                const emoji = client.emojis?.cache?.find((x) => x.name && x.name.includes(emojiName));
                if (emoji?.id && /^\d+$/.test(emoji.id)) return { id: emoji.id };
                return null;
            };
            Colors.forEach((color) => {
                const value = color.toLowerCase().replace("ç", "c").replace("ı", "i").replace("ö", "o").replace("ğ", "g").replace("ü", "u").replace("ş", "s").replace("İ", "i");
                const option = { label: color, value };
                const emoji = emojiBul(value);
                if (emoji) option.emoji = emoji;
                renkSelect.addOptions([option]);
            });
            renkSelect.addOptions([{ label: "Rol İstemiyorum.", value: "renkRoleRemove" }]);
            const row = new ActionRowBuilder().addComponents(renkSelect);
            return interaction.reply({
                content: "Renk seçmek için bir seçenek belirleyin:",
                components: [row],
                flags: MessageFlags.Ephemeral,
            });
        }

        if (interaction.isStringSelectMenu() && interaction.customId === "booster_panel_renk_select") {
            if (!interaction.guild || !interaction.member) {
                return interaction.reply({
                    content: "Bu işlem sadece sunucularda kullanılabilir.",
                    flags: MessageFlags.Ephemeral,
                });
            }
            const booster = j2ponm.BoosterRole;
            const isOwner =
                j2ponm.OwnerRoles?.some((r) => interaction.member.roles.cache.has(r)) ||
                interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

            if (!interaction.member.roles.cache.has(booster) && !isOwner) {
                return interaction.reply({
                    content: "Rollerin güncellenirken bir sorun meydana geldi (Booster, yönetici veya bot sahibi olmalısın).",
                    flags: MessageFlags.Ephemeral,
                });
            }
            const guild = client.guilds.cache.get(j2poncik.ServerID) || interaction.guild;

            // Renk rolleri Setup.json'dan ID ile çekilir.
            // Örnek beklenen yapı:
            // "ColorRoles": { "siyah": "ROLE_ID", "beyaz": "ROLE_ID", ... }
            const colorRolesConfig = j2ponm.ColorRoles || {};

            const normalize = (str) =>
                (str || "")
                    .toLowerCase()
                    .replace(/ç/g, "c")
                    .replace(/ğ/g, "g")
                    .replace(/ı/g, "i")
                    .replace(/ö/g, "o")
                    .replace(/ş/g, "s")
                    .replace(/ü/g, "u");

            const roleByColor = (key) => {
                const id = colorRolesConfig[key];
                if (id && guild.roles.cache.has(id)) {
                    return guild.roles.cache.get(id);
                }
                // ID bulunamazsa isimden fallback
                return guild.roles.cache.find((x) => normalize(x.name).includes(key));
            };

            const siyah = roleByColor("siyah");
            const beyaz = roleByColor("beyaz");
            const kirmizi = roleByColor("kirmizi");
            const mavi = roleByColor("mavi");
            const yesil = roleByColor("yesil");
            const kahverengi = roleByColor("kahverengi");
            const mor = roleByColor("mor");
            const pembe = roleByColor("pembe");

            const colorMap = new Map([
                ["siyah", siyah],
                ["beyaz", beyaz],
                ["kirmizi", kirmizi],
                ["mavi", mavi],
                ["yesil", yesil],
                ["kahverengi", kahverengi],
                ["mor", mor],
                ["pembe", pembe],
            ]);
            const renkroller = [siyah, beyaz, kirmizi, mavi, yesil, kahverengi, mor, pembe].filter(Boolean);
            const selectedValue = interaction.values[0];
            const roleToAdd = colorMap.get(selectedValue);

            if (selectedValue === "renkRoleRemove") {
                await interaction.member.roles.remove(renkroller).catch(() => {});
            } else if (roleToAdd) {
                await interaction.member.roles.remove(renkroller).catch(() => {});
                await interaction.member.roles.add(roleToAdd).catch(() => {});
            }

            return interaction.reply({
                content: "Başarıyla rolleriniz güncellendi!",
                flags: MessageFlags.Ephemeral,
            });
        }
    });
}
