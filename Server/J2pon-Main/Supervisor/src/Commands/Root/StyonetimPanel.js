const {
    Events,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    UserSelectMenuBuilder,
    StringSelectMenuBuilder,
    PermissionsBitField,
    ChannelType,
    EmbedBuilder,
} = require("discord.js");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const streamerRoomOwner = require("../../../../../../Global/Schemas/streamerRoomOwner");
const streamerRoomStreamPerms = require("../../../../../../Global/Schemas/streamerRoomStreamPerms");

const LEAVE_DELAY_MS = 15000;
const streamerCategoryIds = Array.isArray(j2ponm.StreamerCategory) ? j2ponm.StreamerCategory : (j2ponm.StreamerCategory ? [j2ponm.StreamerCategory] : []);
const ownerLeaveTimeouts = new Map();

function isStreamerChannel(voiceChannel) {
    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) return false;
    const parentId = voiceChannel.parentId;
    return parentId && streamerCategoryIds.includes(parentId);
}

function canUsePanel(member) {
    if (!member || !j2ponm.StreamerRole) return false;
    return member.roles.cache.has(j2ponm.StreamerRole);
}

function formatDuration(ms) {
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    const hour = Math.floor(min / 60);
    if (hour > 0) return `${hour} saat ${min % 60} dakika`;
    if (min > 0) return `${min} dakika ${sec % 60} saniye`;
    return `${sec} saniye`;
}

async function clearOwnershipAndPerms(guild, channelID) {
    const ownerDoc = await streamerRoomOwner.findOneAndDelete({ channelID });
    if (!ownerDoc) return;
    const perms = await streamerRoomStreamPerms.find({ channelID });
    const channel = guild.channels.cache.get(channelID);
    if (channel) {
        for (const p of perms) {
            try {
                await channel.permissionOverwrites.delete(p.userID);
            } catch (_) {}
        }
    }
    await streamerRoomStreamPerms.deleteMany({ channelID });
}

module.exports = {
    name: "styonetimpanel",
    description: "Streamer Yönetim Paneli - odası sahiplenme, yayın izni",
    category: "OWNER",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["streameryonetimpanel", "styonetim", "streamer-yonetim"],
        usage: ".styonetimpanel",
    },

    onLoad: function (client) {
        client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
            const leftChannelId = oldState.channelId;
            const member = oldState.member;
            if (!leftChannelId || !member) return;

            const ownerDoc = await streamerRoomOwner.findOne({ channelID: leftChannelId });
            if (!ownerDoc || ownerDoc.userID !== member.id) return;

            const existing = ownerLeaveTimeouts.get(leftChannelId);
            if (existing) clearTimeout(existing);

            const timeoutId = setTimeout(async () => {
                ownerLeaveTimeouts.delete(leftChannelId);
                await clearOwnershipAndPerms(oldState.guild, leftChannelId);
            }, LEAVE_DELAY_MS);
            ownerLeaveTimeouts.set(leftChannelId, timeoutId);
        });

        client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
            const joinedChannelId = newState.channelId;
            const member = newState.member;
            if (!joinedChannelId || !member) return;

            const existing = ownerLeaveTimeouts.get(joinedChannelId);
            if (existing) {
                const ownerDoc = await streamerRoomOwner.findOne({ channelID: joinedChannelId });
                if (ownerDoc && ownerDoc.userID === member.id) {
                    clearTimeout(existing);
                    ownerLeaveTimeouts.delete(joinedChannelId);
                }
            }
        });

        client.on(Events.InteractionCreate, async (interaction) => {
            if (interaction.isButton() && interaction.customId === "styonetim_sahiplen") {
                if (!interaction.guild || !interaction.member) {
                    return interaction.reply({ content: "Bu işlem sadece sunucularda kullanılabilir.", ephemeral: true });
                }
                if (!canUsePanel(interaction.member)) {
                    return interaction.reply({ content: "Bu paneli yalnızca streamer rollerine sahip kullanıcılar kullanabilir.", ephemeral: true });
                }
                const voiceChannel = interaction.member.voice?.channel;
                if (!voiceChannel || !isStreamerChannel(voiceChannel)) {
                    return interaction.reply({ content: "Sadece **Streamer** kategorisindeki bir ses kanalında olmalısınız.", ephemeral: true });
                }
                const existing = await streamerRoomOwner.findOne({ channelID: voiceChannel.id });
                if (existing && existing.userID !== interaction.user.id) {
                    return interaction.reply({ content: `Bu odanın sahibi zaten <@${existing.userID}> kullanıcısı.`, ephemeral: true });
                }
                await streamerRoomOwner.findOneAndUpdate(
                    { channelID: voiceChannel.id },
                    { $set: { guildID: interaction.guild.id, userID: interaction.user.id, ownedAt: new Date() } },
                    { upsert: true }
                );
                const cancel = ownerLeaveTimeouts.get(voiceChannel.id);
                if (cancel) {
                    clearTimeout(cancel);
                    ownerLeaveTimeouts.delete(voiceChannel.id);
                }
                return interaction.reply({ content: `**${voiceChannel.name}** odasını sahiplendiniz. 15 saniye odadan ayrı kalırsanız sahiplik düşer.`, ephemeral: true });
            }

            if (interaction.isButton() && interaction.customId === "styonetim_yayin_ver") {
                if (!interaction.guild || !interaction.member) {
                    return interaction.reply({ content: "Bu işlem sadece sunucularda kullanılabilir.", ephemeral: true });
                }
                if (!canUsePanel(interaction.member)) {
                    return interaction.reply({ content: "Bu paneli yalnızca streamer rollerine sahip kullanıcılar kullanabilir.", ephemeral: true });
                }
                const voiceChannel = interaction.member.voice?.channel;
                if (!voiceChannel || !isStreamerChannel(voiceChannel)) {
                    return interaction.reply({ content: "Sadece Streamer kategorisindeki bir ses kanalında olmalısınız.", ephemeral: true });
                }
                const ownerDoc = await streamerRoomOwner.findOne({ channelID: voiceChannel.id });
                if (!ownerDoc || ownerDoc.userID !== interaction.user.id) {
                    return interaction.reply({ content: "Bu butonu yalnızca odanın sahibi kullanabilir. Önce **Odayı Sahiplen** ile odanızı sahiplenin.", ephemeral: true });
                }
                const membersInChannel = voiceChannel.members.filter(m => m.id !== interaction.user.id);
                if (membersInChannel.size === 0) {
                    return interaction.reply({ content: "Odada sizin dışınızda kimse yok. Yayın izni vermek için odada birini seçmelisiniz.", ephemeral: true });
                }
                return interaction.reply({
                    content: "Yayın izni vermek istediğiniz kullanıcıyı seçin:",
                    components: [
                        new ActionRowBuilder().addComponents(
                            new UserSelectMenuBuilder()
                                .setCustomId("styonetim_yayin_ver_select")
                                .setPlaceholder("Kullanıcı seçin")
                                .setMinValues(1)
                                .setMaxValues(1)
                        )
                    ],
                    ephemeral: true,
                });
            }

            if (interaction.isUserSelectMenu() && interaction.customId === "styonetim_yayin_ver_select") {
                const targetId = interaction.values[0];
                const voiceChannel = interaction.member.voice?.channel;
                if (!voiceChannel || !isStreamerChannel(voiceChannel)) {
                    return interaction.update({ content: "Artık bu odada değilsiniz veya kanal streamer kategorisinde değil.", components: [] });
                }
                const ownerDoc = await streamerRoomOwner.findOne({ channelID: voiceChannel.id });
                if (!ownerDoc || ownerDoc.userID !== interaction.user.id) {
                    return interaction.update({ content: "Oda sahipliği değişti veya siz artık sahip değilsiniz.", components: [] });
                }
                const memberInChannel = voiceChannel.members.get(targetId);
                if (!memberInChannel) {
                    return interaction.update({ content: "Seçilen kullanıcı bu odada değil.", components: [] });
                }
                await voiceChannel.permissionOverwrites.create(targetId, {
                    allow: [PermissionsBitField.Flags.Stream],
                }).catch(() => {});
                await streamerRoomStreamPerms.findOneAndUpdate(
                    { channelID: voiceChannel.id, userID: targetId },
                    { $set: { guildID: interaction.guild.id, channelID: voiceChannel.id, userID: targetId } },
                    { upsert: true }
                );
                const user = interaction.guild.members.cache.get(targetId)?.user;
                return interaction.update({ content: `**${user?.username || targetId}** kullanıcısına yayın izni verildi.`, components: [] });
            }

            if (interaction.isButton() && interaction.customId === "styonetim_yayin_kaldir") {
                if (!interaction.guild || !interaction.member) {
                    return interaction.reply({ content: "Bu işlem sadece sunucularda kullanılabilir.", ephemeral: true });
                }
                if (!canUsePanel(interaction.member)) {
                    return interaction.reply({ content: "Bu paneli yalnızca streamer rollerine sahip kullanıcılar kullanabilir.", ephemeral: true });
                }
                const voiceChannel = interaction.member.voice?.channel;
                if (!voiceChannel || !isStreamerChannel(voiceChannel)) {
                    return interaction.reply({ content: "Sadece Streamer kategorisindeki bir ses kanalında olmalısınız.", ephemeral: true });
                }
                const ownerDoc = await streamerRoomOwner.findOne({ channelID: voiceChannel.id });
                if (!ownerDoc || ownerDoc.userID !== interaction.user.id) {
                    return interaction.reply({ content: "Bu butonu yalnızca odanın sahibi kullanabilir.", ephemeral: true });
                }
                const permitted = await streamerRoomStreamPerms.find({ channelID: voiceChannel.id });
                if (permitted.length === 0) {
                    return interaction.reply({ content: "Bu odada yayın izni verilmiş kimse yok.", ephemeral: true });
                }
                const options = permitted.slice(0, 25).map(p => {
                    const m = interaction.guild.members.cache.get(p.userID);
                    return { label: m?.user?.username || p.userID, value: p.userID };
                });
                return interaction.reply({
                    content: "Yayın iznini kaldırmak istediğiniz kullanıcıyı seçin:",
                    components: [
                        new ActionRowBuilder().addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId("styonetim_yayin_kaldir_select")
                                .setPlaceholder("Kullanıcı seçin")
                                .addOptions(options)
                        )
                    ],
                    ephemeral: true,
                });
            }

            if (interaction.isStringSelectMenu() && interaction.customId === "styonetim_yayin_kaldir_select") {
                const targetId = interaction.values[0];
                const voiceChannel = interaction.member.voice?.channel;
                if (!voiceChannel || !isStreamerChannel(voiceChannel)) {
                    return interaction.update({ content: "Artık bu odada değilsiniz.", components: [] });
                }
                const ownerDoc = await streamerRoomOwner.findOne({ channelID: voiceChannel.id });
                if (!ownerDoc || ownerDoc.userID !== interaction.user.id) {
                    return interaction.update({ content: "Oda sahipliği değişti.", components: [] });
                }
                await voiceChannel.permissionOverwrites.delete(targetId).catch(() => {});
                await streamerRoomStreamPerms.findOneAndDelete({ channelID: voiceChannel.id, userID: targetId });
                const user = interaction.guild.members.cache.get(targetId)?.user;
                return interaction.update({ content: `**${user?.username || targetId}** kullanıcısının yayın izni kaldırıldı.`, components: [] });
            }

            if (interaction.isButton() && interaction.customId === "styonetim_oda_bilgi") {
                if (!interaction.guild || !interaction.member) {
                    return interaction.reply({ content: "Bu işlem sadece sunucularda kullanılabilir.", ephemeral: true });
                }
                if (!canUsePanel(interaction.member)) {
                    return interaction.reply({ content: "Bu paneli yalnızca streamer rollerine sahip kullanıcılar kullanabilir.", ephemeral: true });
                }
                const voiceChannel = interaction.member.voice?.channel;
                if (!voiceChannel || !isStreamerChannel(voiceChannel)) {
                    return interaction.reply({ content: "Sadece Streamer kategorisindeki bir ses kanalında olmalısınız.", ephemeral: true });
                }
                const ownerDoc = await streamerRoomOwner.findOne({ channelID: voiceChannel.id });
                const permitted = await streamerRoomStreamPerms.find({ channelID: voiceChannel.id });
                let text = `**Oda: ${voiceChannel.name}**\n\n`;
                if (!ownerDoc) {
                    text += "**Sahip:** Sahipsiz\n";
                } else {
                    const ownerMember = interaction.guild.members.cache.get(ownerDoc.userID);
                    const ownerName = ownerMember?.user?.username || ownerDoc.userID;
                    const activeMs = Date.now() - new Date(ownerDoc.ownedAt).getTime();
                    text += `**Sahip:** ${ownerName} (<@${ownerDoc.userID}>)\n`;
                    text += `**Aktif süre:** ${formatDuration(activeMs)}\n\n`;
                }
                text += "**Yayın izni olanlar:**\n";
                if (permitted.length === 0) {
                    text += "• Kimse yok\n";
                } else {
                    for (const p of permitted) {
                        const m = interaction.guild.members.cache.get(p.userID);
                        text += `• ${m?.user?.username || p.userID}\n`;
                    }
                }
                return interaction.reply({ content: text, ephemeral: true });
            }
        });
    },

    onCommand: async function (client, message, args) {
        if (!message.guild || !message.member) return;
        if (!j2ponm.OwnerRoles.some(r => message.member.roles.cache.has(r)) && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            message.react("❌");
            message.reply({ content: "Yeterli yetkin yok!" }).then((e) => setTimeout(() => e.delete().catch(() => {}), 5000));
            return;
        }

        const guildName = message.guild.name;
        const panelContent =
            `Merhaba **${guildName}** Streamer Yönetim Paneline Hoşgeldin!\n\n` +
            "Bu panel, yayıncıların kendi ses odalarını ve izinlerini yönetmeleri için tasarlanmıştır.\n" +
            "Aşağıdaki butonlar aracılığıyla odanızı düzenleyebilir veya kullanıcı izinlerini kontrol edebilirsiniz.\n\n" +
            "**Fonksiyonlar:**\n" +
            "• **Odayı Sahiplen:** Yayıncı odasını üzerinize alır.\n" +
            "• **Yayın İzni Ver:** Seçtiğiniz kullanıcıya yayın izni tanımlar.\n" +
            "• **Yayın İzni Kaldır:** Kullanıcıdan yayın iznini geri alır.\n" +
            "• **Oda Bilgisi Al:** Mevcut oda bilgilerini görüntüler.\n\n" +
            "> ℹ️ Yalnızca streamer rollerine sahip kullanıcılar bu paneli kullanabilir.";

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("styonetim_sahiplen")
                .setLabel("Odayı Sahiplen")
                .setStyle(ButtonStyle.Secondary)
                    .setEmoji(client.emoji("appEmoji_kilitkapat") || "🔒"),
            new ButtonBuilder()
                .setCustomId("styonetim_yayin_ver")
                .setLabel("Yayın İzni Ver")
                .setStyle(ButtonStyle.Secondary)
                    .setEmoji(client.emoji("server_youtube") || "📹"),
            new ButtonBuilder()
                .setCustomId("styonetim_yayin_kaldir")
                .setLabel("Yayın İzni Kaldır")
                .setStyle(ButtonStyle.Secondary)
                    .setEmoji(client.emoji("server_carpi") || "🚫"),
            new ButtonBuilder()
                .setCustomId("styonetim_oda_bilgi")
                .setLabel("Oda Bilgisi Al")
                .setStyle(ButtonStyle.Secondary)
                    .setEmoji(client.emoji("server_info") || "ℹ️")
        );

        const embed = new EmbedBuilder()
            .setDescription(panelContent)
            .setThumbnail(message.client.user.displayAvatarURL({ size: 256 }))
            .setColor(0x2F3136);
        await message.channel.send({ embeds: [embed], components: [row] });
        await message.reply({ content: "Streamer yönetim paneli gönderildi." }).then((e) => setTimeout(() => e.delete().catch(() => {}), 5000));
    },
};
