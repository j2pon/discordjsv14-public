const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, Events } = require("discord.js");
const moment = require("moment");
moment.locale("tr");
const penals = require("../../../../../../Global/Schemas/penals");
const ceza = require("../../../../../../Global/Schemas/ceza");
const j2poncik = require("../../../../../../Global/Settings/System");

module.exports = {
    name: "siciltemizle",
    description: "Kullanıcının sicilini temizler (Developer Komutu)",
    category: "OWNER",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["sicil-temizle", "siciltemizle"],
        usage: ".siciltemizle <@user/ID>",
    },

    onLoad: function (client) {
        client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;

            // Kullanıcı seçimi için handler
            if (interaction.customId === "sicil_temizle_user_select") {
                const userId = interaction.values[0];
                const user = await client.users.fetch(userId).catch(() => null);
                if (!user) {
                    return interaction.reply({ content: "Kullanıcı bulunamadı!", ephemeral: true });
                }

                const cezalar = await penals.find({ guildID: interaction.guild.id, userID: userId }).sort({ date: -1 });
                
                if (cezalar.length === 0) {
                    return interaction.reply({ 
                        content: `${client.emoji("server_onay")} ${user.toString()} üyesinin sicili zaten temiz!`, 
                        ephemeral: true 
                    });
                }

                // Ceza listesi embed'i
                const formattedData = cezalar.slice(0, 10).map((x) =>
                    `#${x.id} **[${x.type}]** ${moment(x.date).format("LLL")} - \`${x.reason.length > 50 ? x.reason.substring(0, 47) + '...' : x.reason}\``
                ).join("\n");

                const userTag = user.tag || user.username;
                const embed = new EmbedBuilder()
                    .setAuthor({ name: `${userTag} (${user.id}) Sicil Listesi`, iconURL: user.displayAvatarURL({ dynamic: true }) })
                    .setDescription(formattedData + (cezalar.length > 10 ? `\n\n... ve ${cezalar.length - 10} ceza daha` : ""))
                    .setColor("Orange")
                    .setFooter({ text: `Toplam ${cezalar.length} ceza kaydı bulunuyor` });

                // Select menu için cezaları hazırla (max 25 seçim)
                const cezaOptions = cezalar.slice(0, 25).map((x) => ({
                    value: `${x.id}`,
                    label: `${x.type} (#${x.id})`,
                    description: `${x.reason.length > 50 ? x.reason.substring(0, 47) + '...' : x.reason} - ${moment(x.date).format("DD/MM/YYYY")}`
                }));

                const commandUserId = interaction.user.id;
                const selectMenu = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(`sicil_temizle_select_${userId}_${commandUserId}`)
                        .setPlaceholder('Silinecek cezaları seçin (Çoklu seçim)')
                        .setMinValues(1)
                        .setMaxValues(cezaOptions.length > 25 ? 25 : cezaOptions.length)
                        .addOptions(cezaOptions)
                );

                const buttons = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`sicil_temizle_all_${userId}_${commandUserId}`)
                        .setLabel('Tümünü Sil')
                        .setStyle(ButtonStyle.Danger)
                    .setEmoji(client.emoji("appEmoji_cop") || '🗑️'),
                    new ButtonBuilder()
                        .setCustomId(`sicil_temizle_cancel_${userId}_${commandUserId}`)
                        .setLabel('İptal')
                        .setStyle(ButtonStyle.Secondary)
                    .setEmoji(client.emoji("server_carpi") || '❌')
                );

                await interaction.reply({ 
                    embeds: [embed], 
                    components: cezaOptions.length > 0 ? [selectMenu, buttons] : [buttons],
                    ephemeral: true 
                });
            }

            // Tümünü sil butonu
            if (interaction.customId?.startsWith("sicil_temizle_all_")) {
                const parts = interaction.customId.split("_");
                const userId = parts[3];
                const commandUserId = parts[4];
                
                if (interaction.user.id !== commandUserId) {
                    return interaction.reply({ content: "Bu işlemi sadece komutu kullanan kişi yapabilir!", ephemeral: true });
                }

                await interaction.deferReply({ ephemeral: true });

                const cezalar = await penals.find({ guildID: interaction.guild.id, userID: userId });
                const deletedCount = cezalar.length;

                if (deletedCount === 0) {
                    return interaction.editReply({ content: "Silinecek ceza bulunamadı!" });
                }

                // Tüm cezaları sil
                await penals.deleteMany({ guildID: interaction.guild.id, userID: userId });

                // Ceza şemasından da temizle
                const cezaData = await ceza.findOne({ guildID: interaction.guild.id, userID: userId });
                if (cezaData) {
                    await ceza.deleteOne({ guildID: interaction.guild.id, userID: userId });
                }

                const user = await client.users.fetch(userId).catch(() => null);
                await interaction.editReply({ 
                    content: `${client.emoji("server_onay")} ${user ? user.toString() : userId} kullanıcısının **${deletedCount}** adet ceza kaydı başarıyla silindi!` 
                });
            }

            // Seçili cezaları sil
            if (interaction.customId?.startsWith("sicil_temizle_select_")) {
                const parts = interaction.customId.split("_");
                const userId = parts[3];
                const commandUserId = parts[4];
                
                if (interaction.user.id !== commandUserId) {
                    return interaction.reply({ content: "Bu işlemi sadece komutu kullanan kişi yapabilir!", ephemeral: true });
                }

                await interaction.deferReply({ ephemeral: true });

                const selectedIds = interaction.values.map(id => parseInt(id));
                const deletedCount = selectedIds.length;

                // Seçili cezaları sil
                await penals.deleteMany({ 
                    guildID: interaction.guild.id, 
                    userID: userId, 
                    id: { $in: selectedIds } 
                });

                // Eğer tüm cezalar silindiyse ceza kaydını da sil
                const remainingPenals = await penals.find({ guildID: interaction.guild.id, userID: userId });
                if (remainingPenals.length === 0) {
                    const cezaData = await ceza.findOne({ guildID: interaction.guild.id, userID: userId });
                    if (cezaData) {
                        await ceza.deleteOne({ guildID: interaction.guild.id, userID: userId });
                    }
                }

                const user = await client.users.fetch(userId).catch(() => null);
                await interaction.editReply({ 
                    content: `${client.emoji("server_onay")} ${user ? user.toString() : userId} kullanıcısının **${deletedCount}** adet seçili ceza kaydı başarıyla silindi!` 
                });

                // Mesajı güncelle
                const remainingCezalar = await penals.find({ guildID: interaction.guild.id, userID: userId }).sort({ date: -1 });
                
                if (remainingCezalar.length === 0) {
                    const embed = new EmbedBuilder()
                        .setDescription(`${client.emoji("server_onay")} ${user ? user.toString() : userId} üyesinin sicili artık temiz!`)
                        .setColor("Green");
                    
                    await interaction.message.edit({ 
                        embeds: [embed], 
                        components: [] 
                    });
                } else {
                    const formattedData = remainingCezalar.slice(0, 10).map((x) =>
                        `#${x.id} **[${x.type}]** ${moment(x.date).format("LLL")} - \`${x.reason.length > 50 ? x.reason.substring(0, 47) + '...' : x.reason}\``
                    ).join("\n");

                    const userTag = user.tag || user.username;
                    const embed = new EmbedBuilder()
                        .setAuthor({ name: `${userTag} (${user.id}) Sicil Listesi`, iconURL: user.displayAvatarURL({ dynamic: true }) })
                        .setDescription(formattedData + (remainingCezalar.length > 10 ? `\n\n... ve ${remainingCezalar.length - 10} ceza daha` : ""))
                        .setColor("Orange")
                        .setFooter({ text: `Toplam ${remainingCezalar.length} ceza kaydı bulunuyor` });

                    const cezaOptions = remainingCezalar.slice(0, 25).map((x) => ({
                        value: `${x.id}`,
                        label: `${x.type} (#${x.id})`,
                        description: `${x.reason.length > 50 ? x.reason.substring(0, 47) + '...' : x.reason} - ${moment(x.date).format("DD/MM/YYYY")}`
                    }));

                    const selectMenu = new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId(`sicil_temizle_select_${userId}_${commandUserId}`)
                            .setPlaceholder('Silinecek cezaları seçin (Çoklu seçim)')
                            .setMinValues(1)
                            .setMaxValues(cezaOptions.length > 25 ? 25 : cezaOptions.length)
                            .addOptions(cezaOptions)
                    );

                    const buttons = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`sicil_temizle_all_${userId}_${commandUserId}`)
                            .setLabel('Tümünü Sil')
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji('🗑️'),
                        new ButtonBuilder()
                            .setCustomId(`sicil_temizle_cancel_${userId}_${commandUserId}`)
                            .setLabel('İptal')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('❌')
                    );

                    await interaction.message.edit({ 
                        embeds: [embed], 
                        components: cezaOptions.length > 0 ? [selectMenu, buttons] : [buttons]
                    });
                    
                    // Eğer mesaj ephemeral değilse, yeni collector başlat
                    if (!interaction.message.ephemeral) {
                        const filter = (i) => i.user.id === commandUserId;
                        const collector = interaction.message.createMessageComponentCollector({ filter, time: 30000 });
                        
                        collector.on('end', async (collected, reason) => {
                            if (reason === 'time') {
                                try {
                                    await interaction.message.delete();
                                } catch (err) {}
                            }
                        });
                    }
                }
            }

            // İptal butonu
            if (interaction.customId?.startsWith("sicil_temizle_cancel_")) {
                const parts = interaction.customId.split("_");
                const commandUserId = parts[4];
                
                if (interaction.user.id !== commandUserId) {
                    return interaction.reply({ content: "Bu işlemi sadece komutu kullanan kişi yapabilir!", ephemeral: true });
                }

                await interaction.update({ 
                    content: "İşlem iptal edildi.", 
                    components: [],
                    embeds: []
                });
            }
        });
    },

    onCommand: async function (client, message, args) {
        // Developer kontrolü
        if (!j2poncik.BotsOwners.includes(message.author.id)) {
            return message.reply({ content: "Bu komut sadece developer'lar tarafından kullanılabilir!" }).then((e) => setTimeout(() => { e.delete(); }, 5000));
        }

        let member = message.mentions.users.first() || message.guild.members.cache.get(args[0])?.user;
        let user = null;
        
        if (!member && args[0]) {
            // ID ile kullanıcı bulmayı dene
            try {
                user = await client.users.fetch(args[0]);
                member = user;
            } catch (err) {
                return message.reply({ content: "Kullanıcı bulunamadı! Lütfen geçerli bir kullanıcı ID'si veya etiket girin." }).then((e) => setTimeout(() => { e.delete(); }, 5000));
            }
        }
        
        // User objesini normalize et
        if (member) {
            user = member.user || member; // Eğer GuildMember ise .user, değilse direkt member
        }

        if (!user) {
            // Eğer kullanıcı belirtilmemişse, menüden seçim yap
            const guildMembers = message.guild.members.cache
                .filter(m => !m.user.bot)
                .map(m => ({
                    value: m.user.id,
                    label: `${m.user.tag}`,
                    description: `${m.user.id}`
                }))
                .slice(0, 25);

            if (guildMembers.length === 0) {
                return message.reply({ content: "Listelenecek kullanıcı bulunamadı!" }).then((e) => setTimeout(() => { e.delete(); }, 5000));
            }

            const selectMenu = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("sicil_temizle_user_select")
                    .setPlaceholder('Sicilini temizlemek istediğiniz kullanıcıyı seçin')
                    .setMinValues(1)
                    .setMaxValues(1)
                    .addOptions(guildMembers)
            );

            const embed = new EmbedBuilder()
                .setDescription("Sicilini temizlemek istediğiniz kullanıcıyı aşağıdaki menüden seçin.")
                .setColor("Blue");

            const msg = await message.reply({ embeds: [embed], components: [selectMenu] });
            
            // 30 saniye timeout
            const filter = (i) => i.user.id === message.author.id;
            const collector = msg.createMessageComponentCollector({ filter, time: 30000 });
            
            collector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                    try {
                        await msg.delete();
                    } catch (err) {}
                }
            });
            
            return msg;
        }

        // Kullanıcı belirtilmişse direkt işleme başla
        const cezalar = await penals.find({ guildID: message.guild.id, userID: user.id }).sort({ date: -1 });
        
        if (cezalar.length === 0) {
            return message.reply({ 
                embeds: [new EmbedBuilder().setDescription(`${client.emoji("server_onay")} ${user.toString()} üyesinin sicili zaten temiz!`).setColor("Green")]
            }).then((e) => setTimeout(() => { e.delete(); }, 5000));
        }

        // Ceza listesi embed'i
        const formattedData = cezalar.slice(0, 10).map((x) =>
            `#${x.id} **[${x.type}]** ${moment(x.date).format("LLL")} - \`${x.reason.length > 50 ? x.reason.substring(0, 47) + '...' : x.reason}\``
        ).join("\n");

        const userTag = user.tag || user.username;
        const embed = new EmbedBuilder()
            .setAuthor({ name: `${userTag} (${user.id}) Sicil Listesi`, iconURL: user.displayAvatarURL({ dynamic: true }) })
            .setDescription(formattedData + (cezalar.length > 10 ? `\n\n... ve ${cezalar.length - 10} ceza daha` : ""))
            .setColor("Orange")
            .setFooter({ text: `Toplam ${cezalar.length} ceza kaydı bulunuyor` });

        // Select menu için cezaları hazırla (max 25 seçim)
        const cezaOptions = cezalar.slice(0, 25).map((x) => ({
            value: `${x.id}`,
            label: `${x.type} (#${x.id})`,
            description: `${x.reason.length > 50 ? x.reason.substring(0, 47) + '...' : x.reason} - ${moment(x.date).format("DD/MM/YYYY")}`
        }));

        const commandUserId = message.author.id;
        const selectMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`sicil_temizle_select_${user.id}_${commandUserId}`)
                .setPlaceholder('Silinecek cezaları seçin (Çoklu seçim)')
                .setMinValues(1)
                .setMaxValues(cezaOptions.length > 25 ? 25 : cezaOptions.length)
                .addOptions(cezaOptions)
        );

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`sicil_temizle_all_${user.id}_${commandUserId}`)
                .setLabel('Tümünü Sil')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🗑️'),
            new ButtonBuilder()
                .setCustomId(`sicil_temizle_cancel_${user.id}_${commandUserId}`)
                .setLabel('İptal')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('❌')
        );

        const msg = await message.reply({ 
            embeds: [embed], 
            components: cezaOptions.length > 0 ? [selectMenu, buttons] : [buttons]
        });
        
        // 30 saniye timeout
        const filter = (i) => i.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 30000 });
        
        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                try {
                    await msg.delete();
                } catch (err) {}
                }
        });
    },
};

