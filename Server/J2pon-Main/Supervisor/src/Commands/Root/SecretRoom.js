const { ApplicationCommandOptionType, ChannelType, PermissionsBitField, EmbedBuilder, UserSelectMenuBuilder, ActionRowBuilder, StringSelectMenuBuilder, Events, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags, AuditLogEvent } = require("discord.js");
const SpecialRoom = require("../../../../../../Global/Schemas/specialRoom");
const System = require("../../../../../../Global/Settings/System");
const { CronJob } = require("cron");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const mongoose = require("mongoose");

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

const delCh = {};
const waitTime = 120; // 2 dakika (saniye cinsinden)

module.exports = {
    name: "ozel-oda-panel",
    description: "Özel Oda Paneli",
    category: "OWNER",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["ozelodapanel", "secretroom", "ozeloda", "özelodapanel", "özeloda"],
        usage: ".secretroom",
    },

    onLoad: function (client) {
        client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
            if (oldState.channelId && (!newState.channelId || (newState.channelId && oldState.channelId !== newState.channelId))) {
                const data = await SpecialRoom.findOne({ channelID: oldState.channelId });
                const voiceChannel = client.channels.cache.get(oldState.channelId);
                if (data && voiceChannel) {
                    if (voiceChannel.members.size === 0) {
                        delCh["ch" + oldState.channelId] = true;
                        data.lastQuit = Date.now();
                        data.save();

                        setTimeout(async () => {
                            if (!delCh["ch" + oldState.channelId]) return;
                            await client.channels.cache.get(oldState.channelId)?.delete();
                            await SpecialRoom.findByIdAndDelete(data._id);

                            const odaSahibi = voiceChannel.guild?.members.cache.get(data.userID);
                            if (odaSahibi) await odaSahibi.send({ content: `Özel odanı **__2 Dakika__** boyunca kullanmadığın için silindi!` }).catch(err => { });
                        }, waitTime * 1000);
                    }
                }
            }

            if (newState.channelId && (!oldState.channelId || (oldState.channelId && oldState.channelId !== newState.channelId))) {
                if (delCh["ch" + newState.channelId]) {
                    delete delCh["ch" + newState.channelId];
                }

                if (!newState.member) return;
                const memberData = await SpecialRoom.findOne({ guildID: newState.guild.id, userID: newState.member.id });
                if ((memberData && memberData.channelID) && (newState.member.voice.channelId === memberData.channelID)) {
                    await SpecialRoom.findOneAndUpdate({ guildID: newState.guild.id, userID: newState.member.id }, { $set: { lastEntry: Date.now() } }, { upsert: true });
                }
            }
        });

        client.on(Events.ClientReady, async () => {
            // MongoDB bağlantısının hazır olmasını bekle
            if (mongoose.connection.readyState !== 1) {
                await new Promise((resolve) => {
                    if (mongoose.connection.readyState === 1) {
                        resolve();
                    } else {
                        mongoose.connection.once('connected', resolve);
                    }
                });
            }

            const channels = await SpecialRoom.find({ lastQuit: { $lte: Math.floor(Date.now() - (waitTime * 1000)) } });
            channels.forEach(async chData => {
                const chan = client.channels.cache.get(chData.channelID);
                if (!chan) return;
                await chan.delete();
                await SpecialRoom.findByIdAndDelete(chData._id);

                const odaSahibi = chan.guild?.members.cache.get(chData.userID);
                if (odaSahibi) await odaSahibi.send({ content: `Özel odanı **__2 Dakika__** boyunca kullanmadığın için silindi!` }).catch(err => { });
            });
        });

        client.on(Events.ChannelDelete, async (channel) => {
            const logs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete });
            const entry = logs.entries.find(log => log.targetId == channel.id && log.executorId == channel.client.user.id);
            if (entry) return;

            const channelData = await SpecialRoom.findOne({ guildID: channel.guild.id, channelID: channel.id });
            if (channelData) {
                await SpecialRoom.findOneAndDelete({ guildID: channel.guild.id, channelID: channel.id });

                const member = channel.guild.members.cache.get(channelData.userID);
                if (!member) return;
                try {
                    await member.send({
                        content: `${channel.name} isimli özel odan bir yetkili tarafından silindi.`
                    });
                } catch {
                    return;
                }
            }
        });

        client.on(Events.InteractionCreate, async i => {
            const emojiBul2 = async (emojiName) => {
                if (!emojiName) return "1102692516626710708";
                const emoji = client.emojis.cache.find(x => x.name.includes(emojiName));
                return emoji ? emoji.id : "1102692516626710708";
            };

            let ChannelData = await SpecialRoom.findOne({ guildID: i.guild.id, userID: i.member.id });

            if (i.customId === 'edit') {
                if (!ChannelData) return i.reply({ content: "Özel kanalınız bulunmadığı için bu özelliği kullanamazsınız.", ephemeral: true });
                var channel = i.guild.channels.cache.get(ChannelData.channelID);
                if (!channel) return i.reply({ content: "Kanal bulunamadı!", ephemeral: true });

                try {
                    let modal = await new ModalBuilder().setTitle(`${channel.name} Voice Penal`).setCustomId("voicePanelChannelEdit")
                        .setComponents(
                            new ActionRowBuilder().setComponents(new TextInputBuilder().setCustomId("channelName").setLabel("Yeni adı giriniz.").setPlaceholder(`${channel.name}`).setStyle(TextInputStyle.Short).setValue(`${channel.name}`)),
                            new ActionRowBuilder().setComponents(new TextInputBuilder().setCustomId("channelLimit").setLabel("Yeni limiti giriniz.").setPlaceholder(`${channel.userLimit}`).setStyle(TextInputStyle.Short).setValue(`${channel.userLimit}`)),
                            new ActionRowBuilder().setComponents(new TextInputBuilder().setCustomId("channelBitrate").setLabel("Yeni Bit Hızını Giriniz.").setPlaceholder(`8 ve katlarını giriniz`).setStyle(TextInputStyle.Short).setValue(`${channel.bitrate / 1000}`)),
                        );
                    await i.showModal(modal);
                } catch (error) {
                    console.log(error);
                }
            } else if (i.customId === 'lock') {
                if (!ChannelData) return i.reply({ content: "Özel kanalınız bulunmadığı için bu özelliği kullanamazsınız.", ephemeral: true });
                var channel = i.guild.channels.cache.get(ChannelData.channelID);
                if (!channel) return i.reply({ content: "Kanal bulunamadı!", ephemeral: true });
                await channel.permissionOverwrites.create(i.guild.roles.everyone, { Connect: false })
                    .then(x => i.reply({ content: `Ses Kanalını Başarıyla Kitledin!`, ephemeral: true }))
                    .catch(x => i.reply({ content: `Ses Kanalı Kitleme İşlemi Başarısız!`, ephemeral: true }));
            } else if (i.customId === 'unlock') {
                if (!ChannelData) return i.reply({ content: "Özel kanalınız bulunmadığı için bu özelliği kullanamazsınız.", ephemeral: true });
                var channel = i.guild.channels.cache.get(ChannelData.channelID);
                if (!channel) return i.reply({ content: "Kanal bulunamadı!", ephemeral: true });
                await channel.permissionOverwrites.create(i.guild.roles.everyone, { Connect: true })
                    .then(x => i.reply({ content: `Ses Kanalının Kilidini Başarıyla Açtın!`, ephemeral: true }))
                    .catch(x => i.reply({ content: `Ses Kanalının Kilit Açma İşlemi Başarısız!`, ephemeral: true }));
            } else if (i.customId === 'visible') {
                if (!ChannelData) return i.reply({ content: "Özel kanalınız bulunmadığı için bu özelliği kullanamazsınız.", ephemeral: true });
                var channel = i.guild.channels.cache.get(ChannelData.channelID);
                if (!channel) return i.reply({ content: "Kanal bulunamadı!", ephemeral: true });
                await channel.permissionOverwrites.create(i.guild.roles.everyone, { ViewChannel: true })
                    .then(x => i.reply({ content: `Ses Kanalının Gizliliği Kaldırma İşlemi Başarılı!`, ephemeral: true }))
                    .catch(x => i.reply({ content: `Ses Kanalının Gizliliği Kaldırma İşlemi Başarısız!`, ephemeral: true }));
            } else if (i.customId === 'invisible') {
                if (!ChannelData) return i.reply({ content: "Özel kanalınız bulunmadığı için bu özelliği kullanamazsınız.", ephemeral: true });
                var channel = i.guild.channels.cache.get(ChannelData.channelID);
                if (!channel) return i.reply({ content: "Kanal bulunamadı!", ephemeral: true });
                await channel.permissionOverwrites.create(i.guild.roles.everyone, { ViewChannel: false })
                    .then(x => i.reply({ content: `Ses Kanalının Gizleme İşlemi Başarılı!`, ephemeral: true }))
                    .catch(x => i.reply({ content: `Ses Kanalının Gizleme İşlemi Başarısız!`, ephemeral: true }));
            } else if (i.customId === 'add_user') {
                if (!ChannelData) return i.reply({ content: "Özel kanalınız bulunmadığı için bu özelliği kullanamazsınız.", ephemeral: true });
                var channel = i.guild.channels.cache.get(ChannelData.channelID);
                if (!channel) return i.reply({ content: "Kanal bulunamadı!", ephemeral: true });
                i.reply({
                    components: [
                        new ActionRowBuilder()
                            .addComponents(new UserSelectMenuBuilder().setCustomId('VoiceChannelPanelAddUSER').setPlaceholder('Kullanıcı ara.').setMinValues(1).setMaxValues(20))
                    ], ephemeral: true
                });
            } else if (i.customId === 'remove_user') {
                if (!ChannelData) return i.reply({ content: "Özel kanalınız bulunmadığı için bu özelliği kullanamazsınız.", ephemeral: true });
                var channel = i.guild.channels.cache.get(ChannelData.channelID);
                if (!channel) return i.reply({ content: "Kanal bulunamadı!", ephemeral: true });
                let menuOptions = channel.permissionOverwrites.cache
                    .filter(x => i.guild.members.cache.get(x.id))
                    .map(x => ({
                        label: i.guild.members.cache.get(x.id).user.username,
                        description: undefined,
                        value: x.id,
                        // ID yerine standart bir emoji kullan (hata riskini azaltmak için)
                        emoji: '👤'
                    }));
                i.reply({
                    components: [
                        new ActionRowBuilder()
                            .addComponents(new StringSelectMenuBuilder().setCustomId('VoiceChannelPanelRemoveUSER').setPlaceholder('Kullanıcı çıkarmak için tıkla.').setOptions(menuOptions.slice(0, 25)))
                    ], ephemeral: true
                });
            } else if (i.customId === 'channel_delete') {
                if (!ChannelData) return i.reply({ content: "Özel kanalınız bulunmadığı için bu özelliği kullanamazsınız.", ephemeral: true });
                var channel = i.guild.channels.cache.get(ChannelData.channelID);
                if (!channel) return i.reply({ content: "Kanal bulunamadı!", ephemeral: true });
                await i.deferUpdate();
                await SpecialRoom.findOneAndDelete({ guildID: i.guild.id, channelID: channel.id });
                channel.delete().catch(() => {});
            } else if (i.customId === 'created') {
                if (ChannelData) return i.reply({ content: `Özel odan zaten bulunuyor!`, ephemeral: true });
                if (!j2ponm.SecretRoomsCategory || !j2ponm.SecretRoomsCategory[0]) {
                    return i.reply({ content: `Secret Room kategori ayarlanmamış!`, ephemeral: true });
                }
                i.guild.channels.create({
                    name: "Carmenta Secret",
                    type: ChannelType.GuildVoice,
                    parent: j2ponm.SecretRoomsCategory[0],
                    permissionOverwrites: [
                        {
                            id: i.guild.roles.everyone,
                            allow: [PermissionsBitField.Flags.Speak],
                            deny: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.SendVoiceMessages]
                        },
                        {
                            id: i.member.user.id,
                            allow: [PermissionsBitField.Flags.MuteMembers, PermissionsBitField.Flags.DeafenMembers, PermissionsBitField.Flags.Stream, PermissionsBitField.Flags.Connect],
                        },
                    ],
                }).then(async channel => {
                    const editEmoji = await emojiBul2("appEmoji_duzenle");
                    const lockEmoji = await emojiBul2("appEmoji_kilitkapat");
                    const unlockEmoji = await emojiBul2("appEmoji_kilidac");
                    const invisibleEmoji = await emojiBul2("appEmoji_gorunmez");
                    const visibleEmoji = await emojiBul2("appEmoji_gorunur");
                    const addEmoji = await emojiBul2("appEmoji_ekle");
                    const removeEmoji = await emojiBul2("appEmoji_cikar");
                    const deleteEmoji = await emojiBul2("appEmoji_cop");
                    
                    channel.send({
                        content: `${i.member}`,
                        embeds: [
                            new EmbedBuilder()
                                .setAuthor({ name: i.member.user.username, iconURL: i.member.user.avatarURL() })
                                .setDescription(`${channel}, kanalının ayarlarını aşağıda ki butonlar ile değiştirebilirsiniz.`)
                                .setImage("https://cdn.discordapp.com/attachments/1089646025192517733/1117358565355692093/voicePanel.png")
                        ],
                        components: [
                            new ActionRowBuilder()
                                .setComponents(
                                    new ButtonBuilder().setCustomId("edit").setEmoji(editEmoji).setStyle(ButtonStyle.Secondary),
                                    new ButtonBuilder().setCustomId("lock").setEmoji(lockEmoji).setStyle(ButtonStyle.Secondary),
                                    new ButtonBuilder().setCustomId("unlock").setEmoji(unlockEmoji).setStyle(ButtonStyle.Secondary),
                                    new ButtonBuilder().setCustomId("invisible").setEmoji(invisibleEmoji).setStyle(ButtonStyle.Secondary),
                                ),
                            new ActionRowBuilder()
                                .setComponents(
                                    new ButtonBuilder().setCustomId("visible").setEmoji(visibleEmoji).setStyle(ButtonStyle.Secondary),
                                    new ButtonBuilder().setCustomId("add_user").setEmoji(addEmoji).setStyle(ButtonStyle.Secondary),
                                    new ButtonBuilder().setCustomId("remove_user").setEmoji(removeEmoji).setStyle(ButtonStyle.Secondary),
                                    new ButtonBuilder().setCustomId("channel_delete").setEmoji(deleteEmoji).setStyle(ButtonStyle.Secondary),
                                )
                        ]
                    }).then(async x => {
                        i.reply({ content: `**${channel.name}** isimli kanalın oluşturuldu. sana özel panel için ${x.url}`, ephemeral: true });
                        await SpecialRoom.findOneAndUpdate({ guildID: i.guild.id, userID: i.member.id }, { $set: { only: true, channelID: channel.id, date: Date.now() } }, { upsert: true });
                    });
                });
            } else if (i.customId === 'VoiceChannelPanelAddUSER') {
                await i.deferUpdate();
                let ChannelData = await SpecialRoom.findOne({ guildID: i.guild.id, userID: i.member.id });
                if (!ChannelData) return i.editReply({ content: "Özel kanalınız bulunmadığı için bu özelliği kullanamazsınız.", components: [], ephemeral: true });
                let channel = i.guild.channels.cache.get(ChannelData.channelID);
                if (!channel) return i.editReply({ content: "Kanal bulunamadı!", components: [], ephemeral: true });
                const selectedUsers = i.values;
                const selectedUserNames = selectedUsers.map(userId => {
                    const user = i.guild.members.cache.get(userId)?.user;
                    return user ? user.username : 'Bilinmeyen Kullanıcı';
                });
                selectedUsers.forEach(async x => {
                    const user = i.guild.members.cache.get(x)?.user;
                    if (user) await channel.permissionOverwrites.create(user, { 
                        ViewChannel: true, 
                        Connect: true, 
                        Speak: true,
                        UseVAD: true,
                        PrioritySpeaker: true
                    }).catch(() => {});
                });
                const replyMessage = `Aşağıda ki kullanıcıların kanala girişlerine izin verildi!\n${selectedUserNames.join(', ')}`;
                i.editReply({ content: replyMessage, components: [], ephemeral: true });
            } else if (i.customId === 'VoiceChannelPanelRemoveUSER') {
                await i.deferUpdate();
                let ChannelData = await SpecialRoom.findOne({ guildID: i.guild.id, userID: i.member.id });
                if (!ChannelData) return i.editReply({ content: "Özel kanalınız bulunmadığı için bu özelliği kullanamazsınız.", components: [], ephemeral: true });
                let channel = i.guild.channels.cache.get(ChannelData.channelID);
                if (!channel) return i.editReply({ content: "Kanal bulunamadı!", components: [], ephemeral: true });
                const selectedUsers = i.values;
                const selectedUserNames = selectedUsers.map(userId => {
                    const user = i.guild.members.cache.get(userId)?.user;
                    return user ? user.username : 'Bilinmeyen Kullanıcı';
                });
                selectedUsers.forEach(async x => {
                    const user = i.guild.members.cache.get(x)?.user;
                    if (user) await channel.permissionOverwrites.delete(user).catch(() => {});
                });
                const replyMessage = `Aşağıda ki kullanıcının kanala giriş izni başarıyla kaldırıldı!\n${selectedUserNames.join(', ')}`;
                i.editReply({ content: replyMessage, components: [], ephemeral: true });
            } else if (i.type === 5) { // Modal Submit
                if (i.customId === 'voicePanelChannelEdit') {
                    let ChannelData = await SpecialRoom.findOne({ guildID: i.guild.id, userID: i.member.id });
                    if (!ChannelData) return i.reply({ content: "Özel kanalınız bulunmadığı için bu özelliği kullanamazsınız.", ephemeral: true });
                    
                    const channelName = i.fields.getTextInputValue('channelName');
                    const channelLimit = i.fields.getTextInputValue('channelLimit');
                    const channelBitrate = i.fields.getTextInputValue('channelBitrate');
                    
                    if (!channelName || !channelLimit || !channelBitrate) {
                        return i.reply({ content: "Lütfen tüm alanları doldurun!", ephemeral: true });
                    }
                    
                    const bitrateValue = parseInt(channelBitrate) * 1000;
                    const limitValue = channelLimit === "0" || channelLimit.toLowerCase() === "unlimited" ? 0 : parseInt(channelLimit);
                    
                    if (isNaN(bitrateValue) || isNaN(limitValue)) {
                        return i.reply({ content: "Geçersiz değerler! Bitrate ve limit sayı olmalıdır.", ephemeral: true });
                    }
                    
                    var data = {
                        name: channelName,
                        bitrate: Math.min(Math.max(bitrateValue, 8000), 384000), // 8kbps - 384kbps arası
                        userLimit: Math.min(Math.max(limitValue, 0), 99) // 0-99 arası
                    };
                    
                    i.guild.channels.edit(ChannelData.channelID, data).then(x => { i.reply({ content: `Kanal Ayarları Güncellendi!`, ephemeral: true }) })
                        .catch(x => { console.log(x), i.reply({ content: `Kanal Ayarları Güncellenemedi!`, ephemeral: true }) });
                }
            }
        });
    },

    onCommand: async function (client, message, args) {
        const guildName = message.guild?.name || "Sunucu";
        const panelContent =
            `Merhaba! **${guildName}** Sunucusunun Özel Oda Sistemine Hoş Geldiniz!\n\n` +
            "Bu panel sayesinde kendi adınıza özel bir oda oluşturabilirsiniz. Sadece davet ettiğiniz kişilerin katılmasını sağlayabilir veya herkese açık hale getirerek daha geniş bir toplulukla sohbet edebilirsiniz.\n\n" +
            "• **Gizliliği önemsiyorsanız:** odanızı kilitleyip yalnızca belirli kişilerin erişimine açabilirsiniz.\n" +
            "• **Herkese açık yapmak istiyorsanız:** odanızı genel erişime açabilir, toplulukla iletişim kurabilirsiniz.\n\n" +
            "Aşağıdaki **Özel Oda Oluştur** düğmesine tıklayarak odanızı hemen oluşturabilirsiniz.\n\n" +
            "İyi sohbetler dileriz!\n\n" +
            "> • Sesli kanalın sohbet kısmından kanalına özel ayarlar paneline erişebilirsin.";

        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("created").setLabel("Özel Oda Oluştur").setStyle(ButtonStyle.Secondary));
        const fullText = panelContent;
        try {
            if (ContainerBuilder && SectionBuilder && TextDisplayBuilder && SeparatorBuilder && SeparatorSpacingSize != null && ThumbnailBuilder) {
                const container = new ContainerBuilder();
                // Use a single section with the full content to avoid duplicating text
                const section = new SectionBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(fullText))
                    .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.client.user.displayAvatarURL({ size: 256 })));
                container.addSectionComponents(section);
                container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true));
                // small blank line before buttons to create spacing
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent("\u200b"));
                if (container.addActionRowComponents) container.addActionRowComponents(row);
                await message.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
                return;
            } else {
                const panelEmbed = new EmbedBuilder()
                    .setDescription(fullText + "\n\u200b")
                    .setThumbnail(message.client.user.displayAvatarURL({ size: 256 }))
                    .setColor(0x2F3136);
                await message.channel.send({ embeds: [panelEmbed], components: [row] });
                return;
            }
        } catch (err) {
            console.error("[SecretRoom] Components V2 send failed, falling back to embed:", err?.message);
            const panelEmbed = new EmbedBuilder()
                .setDescription(fullText + "\n\u200b")
                .setThumbnail(message.client.user.displayAvatarURL({ size: 256 }))
                .setColor(0x2F3136);
            await message.channel.send({ embeds: [panelEmbed], components: [row] }).catch(() => {});
            return;
        }
    },
};
