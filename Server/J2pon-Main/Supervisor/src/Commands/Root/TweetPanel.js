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
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const tweetMessages = require("../../../../../../Global/Schemas/tweetMessages");
const tweetReactions = require("../../../../../../Global/Schemas/tweetReactions");
const tweetComments = require("../../../../../../Global/Schemas/tweetComments");
const tweetThemes = require("../../../../../../Global/Schemas/tweetThemes");
const emojis = require("../../../../../../Global/Settings/Emojis.json");

let ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    ThumbnailBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    SectionBuilder;
try {
    const v2 = require("discord.js");
    ContainerBuilder = v2.ContainerBuilder;
    TextDisplayBuilder = v2.TextDisplayBuilder;
    SeparatorBuilder = v2.SeparatorBuilder;
    SeparatorSpacingSize = v2.SeparatorSpacingSize;
    ThumbnailBuilder = v2.ThumbnailBuilder;
    MediaGalleryBuilder = v2.MediaGalleryBuilder;
    MediaGalleryItemBuilder = v2.MediaGalleryItemBuilder;
    SectionBuilder = v2.SectionBuilder;
} catch (_) {}

const PREFIX_LIKE = "tweet_like_";
const PREFIX_DISLIKE = "tweet_dislike_";
const PREFIX_COMMENT = "tweet_comment_";
const PREFIX_VIEW_COMMENTS = "tweet_view_";
const THEME_COLORS = { dark: 0x15202B, light: 0xE1E8ED };

function getTweetRows(messageId, likeCount = 0, dislikeCount = 0) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(PREFIX_LIKE + messageId)
            .setLabel(String(likeCount))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(client.emoji("server_onay") || "👍"),
        new ButtonBuilder()
            .setCustomId(PREFIX_DISLIKE + messageId)
            .setLabel(String(dislikeCount))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(client.emoji("server_carpi") || "👎"),
        new ButtonBuilder()
            .setCustomId("tweet_info_" + messageId)
            .setLabel("Bilgi")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(client.emoji("server_info") || "ℹ️"),
        new ButtonBuilder()
            .setCustomId(PREFIX_COMMENT + messageId)
            .setLabel("Yorum Yap")
            .setStyle(ButtonStyle.Primary)
            .setEmoji(client.emoji("server_info") || "💬"),
        new ButtonBuilder()
            .setCustomId(PREFIX_VIEW_COMMENTS + messageId)
            .setLabel("Yorumları Gör")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(client.emoji("appEmoji_create") || "📋")
    );
}

async function getTweetCounts(messageId) {
    const [likes, dislikes] = await Promise.all([
        tweetReactions.countDocuments({ messageID: messageId, type: "like" }),
        tweetReactions.countDocuments({ messageID: messageId, type: "dislike" }),
    ]);
    return { likes, dislikes };
}

async function updateTweetMessage(message, doc) {
    const { likes, dislikes } = await getTweetCounts(doc.messageID);
    const color = THEME_COLORS[doc.theme] ?? THEME_COLORS.dark;
    try {
        if (ContainerBuilder && SectionBuilder && TextDisplayBuilder && SeparatorBuilder && SeparatorSpacingSize != null) {
            const container = new ContainerBuilder();
            const section = new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${doc.content}\n\n*@${doc.authorHandle}*`)
                )
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(null));
            container.addSectionComponents(section);
            if (doc.imageUrl && /^https?:\/\//i.test(doc.imageUrl) && MediaGalleryBuilder && MediaGalleryItemBuilder) {
                const mg = new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(doc.imageUrl));
                container.addMediaGalleryComponents(mg);
            }
            container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false));
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`👍 ${likes}  •  👎 ${dislikes}`));
            const rows = getTweetRows(doc.messageID, likes, dislikes);
            if (container.addActionRowComponents && rows) container.addActionRowComponents(rows);
            await message.edit({ components: [container] }).catch(() => {});
            return;
        }
    } catch (e) {
        // fallback to embed
    }
    const embed = new EmbedBuilder()
        .setColor(color)
        .setAuthor({
            name: doc.authorName,
            iconURL: null,
        })
        .setDescription(`${doc.content}\n\n*@${doc.authorHandle}*`)
        .setTimestamp(doc.createdAt)
        .setFooter({ text: `👍 ${likes}  •  👎 ${dislikes}` });
    if (doc.imageUrl && /^https?:\/\//i.test(doc.imageUrl)) embed.setImage(doc.imageUrl);
    await message.edit({ embeds: [embed], components: [getTweetRows(doc.messageID, likes, dislikes)] }).catch(() => {});
}

module.exports = {
    name: "tweetpanel",
    description: "Tweet paneli - sunucuda tweet paylaşımı",
    category: "OWNER",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["tweet-panel", "tweetpanel"],
        usage: ".tweetpanel",
    },

    onLoad: function (client) {
        client.on(Events.InteractionCreate, async (interaction) => {
            if (interaction.isButton() && interaction.customId === "tweet_yeni_tweet") {
                if (!interaction.guild || !interaction.member) {
                    return interaction.reply({ content: "Bu işlem sadece sunucularda kullanılabilir.", ephemeral: true });
                }
                const modal = new ModalBuilder()
                    .setCustomId("tweet_modal")
                    .setTitle("Yeni Tweet");
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("tweet_content")
                            .setLabel("Tweet İçeriği *")
                            .setPlaceholder("Tweet İçeriğini Giriniz")
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                            .setMaxLength(2000)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("tweet_image")
                            .setLabel("Tweet Görseli (URL)")
                            .setPlaceholder("https://example.com/image.png")
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                            .setMaxLength(500)
                    )
                );
                await interaction.showModal(modal);
                return;
            }

            if (interaction.isButton() && interaction.customId === "tweet_tema_degistir") {
                if (!interaction.guild || !interaction.member) {
                    return interaction.reply({ content: "Bu işlem sadece sunucularda kullanılabilir.", ephemeral: true });
                }
                const guildId = interaction.guild.id;
                const userId = interaction.user.id;
                let rec = await tweetThemes.findOne({ userID: userId, guildID: guildId });
                const nextTheme = rec?.theme === "light" ? "dark" : "light";
                if (!rec) await tweetThemes.create({ userID: userId, guildID: guildId, theme: nextTheme });
                else {
                    rec.theme = nextTheme;
                    await rec.save();
                }
                const label = nextTheme === "light" ? "Açık (beyaz)" : "Koyu";
                return interaction.reply({
                    content: `Tema değiştirildi: **${label}**. Yeni attığınız tweetler bu temada görünecek.`,
                    ephemeral: true,
                });
            }

            if (interaction.isModalSubmit() && interaction.customId === "tweet_modal") {
                if (!interaction.guild || !interaction.member) {
                    return interaction.reply({ content: "Bu işlem sadece sunucularda kullanılabilir.", ephemeral: true });
                }
                const content = interaction.fields.getTextInputValue("tweet_content").trim();
                const imageUrl = (interaction.fields.getTextInputValue("tweet_image") || "").trim();
                if (!content) return interaction.reply({ content: "Tweet içeriği boş olamaz.", ephemeral: true });

                const guildId = interaction.guild.id;
                const channelId = j2ponm.TweetPanelChannel || interaction.channel.id;
                const channel = interaction.guild.channels.cache.get(channelId) || interaction.channel;

                let themeRec = await tweetThemes.findOne({ userID: interaction.user.id, guildID: guildId });
                const theme = themeRec?.theme === "light" ? "light" : "dark";
                const color = THEME_COLORS[theme];

                const authorName = interaction.member.nickname || interaction.user.username || "Kullanıcı";
                const authorHandle = interaction.user.username.replace(/\s/g, "").slice(0, 20) || "user";

                // Try to send using Components V2
                let msg = null;
                try {
                    if (ContainerBuilder && SectionBuilder && TextDisplayBuilder && SeparatorBuilder && SeparatorSpacingSize != null) {
                        const container = new ContainerBuilder();
                        const section = new SectionBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(`${content}\n\n*@${authorHandle}*`)
                            )
                            .setThumbnailAccessory(new ThumbnailBuilder().setURL(interaction.user.displayAvatarURL({ size: 64 })));
                        container.addSectionComponents(section);
                        if (imageUrl && /^https?:\/\//i.test(imageUrl) && MediaGalleryBuilder && MediaGalleryItemBuilder) {
                            const mg = new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(imageUrl));
                            container.addMediaGalleryComponents(mg);
                        }
                        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false));
                        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`👍 0  •  👎 0`));
                        const row = getTweetRows("PLACEHOLDER", 0, 0);
                        if (container.addActionRowComponents && row) container.addActionRowComponents(row);
                        msg = await channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
                    }
                } catch (e) {
                    msg = null;
                }
                if (!msg) {
                    const embed = new EmbedBuilder()
                        .setColor(color)
                        .setAuthor({
                            name: authorName,
                            iconURL: interaction.user.displayAvatarURL({ size: 64 }),
                        })
                        .setDescription(`${content}\n\n*@${authorHandle}*`)
                        .setTimestamp()
                        .setFooter({ text: "👍 0  •  👎 0" });
                    if (imageUrl && /^https?:\/\//i.test(imageUrl)) embed.setImage(imageUrl);
                    const row = getTweetRows("PLACEHOLDER", 0, 0);
                    msg = await channel.send({ embeds: [embed], components: [row] }).catch(() => null);
                }
                if (!msg) return interaction.reply({ content: "Tweet gönderilemedi.", ephemeral: true });

                const messageId = msg.id;
                await tweetMessages.create({
                    guildID: guildId,
                    channelID: channel.id,
                    messageID: messageId,
                    authorID: interaction.user.id,
                    authorName,
                    authorHandle,
                    content,
                    imageUrl: imageUrl || "",
                    theme,
                });

                const rowReal = getTweetRows(messageId, 0, 0);
                try {
                    if (ContainerBuilder && SectionBuilder && TextDisplayBuilder && SeparatorBuilder && SeparatorSpacingSize != null) {
                        const containerReal = new ContainerBuilder();
                        const sectionReal = new SectionBuilder()
                            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${content}\n\n*@${authorHandle}*`))
                            .setThumbnailAccessory(new ThumbnailBuilder().setURL(interaction.user.displayAvatarURL({ size: 64 })));
                        containerReal.addSectionComponents(sectionReal);
                        if (imageUrl && /^https?:\/\//i.test(imageUrl) && MediaGalleryBuilder && MediaGalleryItemBuilder) {
                            const mgReal = new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(imageUrl));
                            containerReal.addMediaGalleryComponents(mgReal);
                        }
                        containerReal.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false));
                        containerReal.addTextDisplayComponents(new TextDisplayBuilder().setContent(`👍 0  •  👎 0`));
                        if (containerReal.addActionRowComponents && rowReal) containerReal.addActionRowComponents(rowReal);
                        await msg.edit({ components: [containerReal] }).catch(() => {});
                    } else {
                        await msg.edit({ components: [rowReal] }).catch(() => {});
                    }
                } catch (e) {
                    await msg.edit({ components: [rowReal] }).catch(() => {});
                }

                await interaction.reply({
                    content: "Tweetiniz paylaşıldı. ⚠️ Bu form Carmenta uygulamasına gönderilir; şifre veya hassas bilgi paylaşmadığınızdan emin olun.",
                    ephemeral: true,
                });
                return;
            }

            if (interaction.isButton() && (interaction.customId.startsWith(PREFIX_LIKE) || interaction.customId.startsWith(PREFIX_DISLIKE))) {
                const messageId = interaction.customId.startsWith(PREFIX_LIKE)
                    ? interaction.customId.slice(PREFIX_LIKE.length)
                    : interaction.customId.slice(PREFIX_DISLIKE.length);
                const type = interaction.customId.startsWith(PREFIX_LIKE) ? "like" : "dislike";
                const doc = await tweetMessages.findOne({ messageID: messageId });
                if (!doc) return interaction.reply({ content: "Tweet bulunamadı.", ephemeral: true });
                await tweetReactions.deleteMany({ messageID: messageId, userID: interaction.user.id });
                await tweetReactions.create({ messageID: messageId, userID: interaction.user.id, type });
                const message = await interaction.channel.messages.fetch(messageId).catch(() => null);
                if (message) await updateTweetMessage(message, doc);
                return interaction.reply({ content: type === "like" ? "Beğendiniz." : "Beğenmediniz.", ephemeral: true });
            }

            if (interaction.isButton() && interaction.customId.startsWith("tweet_info_")) {
                const messageId = interaction.customId.slice("tweet_info_".length);
                const doc = await tweetMessages.findOne({ messageID: messageId });
                if (!doc) return interaction.reply({ content: "Tweet bulunamadı.", ephemeral: true });
                return interaction.reply({
                    content: `**Tweet bilgisi**\nYazar: **${doc.authorName}** (@${doc.authorHandle})\nTema: ${doc.theme === "light" ? "Açık (beyaz)" : "Koyu"}\nTarih: <t:${Math.floor(new Date(doc.createdAt).getTime() / 1000)}:F>`,
                    ephemeral: true,
                });
            }

            if (interaction.isButton() && interaction.customId.startsWith(PREFIX_COMMENT)) {
                const messageId = interaction.customId.slice(PREFIX_COMMENT.length);
                const doc = await tweetMessages.findOne({ messageID: messageId });
                if (!doc) return interaction.reply({ content: "Tweet bulunamadı.", ephemeral: true });
                const modal = new ModalBuilder()
                    .setCustomId("tweet_comment_modal_" + messageId)
                    .setTitle("Yorum Yap");
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("comment_text")
                            .setLabel("Yorumunuz")
                            .setPlaceholder("Yorumunuzu yazın...")
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                            .setMaxLength(500)
                    )
                );
                await interaction.showModal(modal);
                return;
            }

            if (interaction.isModalSubmit() && interaction.customId.startsWith("tweet_comment_modal_")) {
                const messageId = interaction.customId.replace("tweet_comment_modal_", "");
                const text = interaction.fields.getTextInputValue("comment_text").trim();
                if (!text) return interaction.reply({ content: "Yorum boş olamaz.", ephemeral: true });
                const doc = await tweetMessages.findOne({ messageID: messageId });
                if (!doc) return interaction.reply({ content: "Tweet bulunamadı.", ephemeral: true });
                await tweetComments.create({
                    messageID: messageId,
                    userID: interaction.user.id,
                    userTag: interaction.user.tag,
                    content: text,
                });
                await interaction.reply({ content: "Yorumunuz eklendi.", ephemeral: true });
                return;
            }

            if (interaction.isButton() && interaction.customId.startsWith(PREFIX_VIEW_COMMENTS)) {
                const messageId = interaction.customId.slice(PREFIX_VIEW_COMMENTS.length);
                const comments = await tweetComments.find({ messageID: messageId }).sort({ createdAt: 1 }).limit(20).lean();
                if (comments.length === 0) return interaction.reply({ content: "Henüz yorum yok.", ephemeral: true });
                const list = comments.map((c, i) => `${i + 1}. **${(c.userTag || "Anonim").slice(0, 20)}:** ${c.content.slice(0, 80)}${c.content.length > 80 ? "..." : ""}`).join("\n");
                return interaction.reply({
                    content: `**Yorumlar:**\n${list}`,
                    ephemeral: true,
                });
            }
        });
    },

    onCommand: async function (client, message, args) {
        if (!message.guild || !message.member) return;
        if (!j2ponm.OwnerRoles.some((r) => message.member.roles.cache.has(r)) && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            message.react("❌");
            message.reply({ content: "Yeterli yetkin yok!" }).then((e) => setTimeout(() => e.delete().catch(() => {}), 5000));
            return;
        }

        const guildName = message.guild.name;
        const channelId = j2ponm.TweetPanelChannel || message.channel.id;
        const channel = message.guild.channels.cache.get(channelId) || message.channel;

        const panelContent =
            `## ${emojis.j2pon_zil} ${guildName} Sunucusunun Tweet Paneli\n\n` +
            "Bu panel üzerinden sunucuda kendi tweetlerinizi paylaşabilir, diğer kullanıcıların gönderilerini beğenebilir veya yorum yapabilirsiniz.\n\n" +
            "• Yeni tweet oluşturmak için **Yeni Tweet** butonuna tıklayın.\n" +
            "• Tema renginizi değiştirmek için **Tema Değiştir** butonunu kullanın.\n\n" +
            `${emojis.server_info} Bu form Carmenta uygulamasına gönderilecek. Şifre veya hassas bilgi paylaşmadığınızdan emin olun.`;

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("tweet_yeni_tweet")
                .setLabel("Yeni Tweet")
                .setStyle(ButtonStyle.Primary)
                .setEmoji(client.emoji("appEmoji_duzenle") || "🐦"),
            new ButtonBuilder()
                .setCustomId("tweet_tema_degistir")
                .setLabel("Tema Değiştir")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(client.emoji("appEmoji_gorunur") || "🌙")
        );

        try {
            if (ContainerBuilder && SectionBuilder && TextDisplayBuilder && SeparatorBuilder && SeparatorSpacingSize != null) {
                const container = new ContainerBuilder();
                const section = new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(panelContent)
                    )
                    .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.client.user.displayAvatarURL({ size: 256 })));
                container.addSectionComponents(section);
                container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true));
                if (container.addActionRowComponents) container.addActionRowComponents(row);
                await channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
            } else {
                const panelEmbed = new EmbedBuilder()
                    .setDescription(panelContent)
                    .setThumbnail(message.client.user.displayAvatarURL({ size: 256 }))
                    .setColor(0x2F3136);
                await channel.send({ embeds: [panelEmbed], components: [row] });
            }
        } catch (e) {
            const panelEmbed = new EmbedBuilder()
                .setDescription(panelContent)
                .setThumbnail(message.client.user.displayAvatarURL({ size: 256 }))
                .setColor(0x2F3136);
            await channel.send({ embeds: [panelEmbed], components: [row] }).catch(() => {});
        }
        await message.reply({ content: "Tweet paneli gönderildi." }).then((e) => setTimeout(() => e.delete().catch(() => {}), 5000));
    },
};
