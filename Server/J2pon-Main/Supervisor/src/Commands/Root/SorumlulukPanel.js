const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, Events } = require("discord.js");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const emojis = require("../../../../../../Global/Settings/Emojis.json");

module.exports = {
    name: "sorumlulukpanel",
    description: "Sorumluluk Panel Sistemi",
    category: "OWNER",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["sorumluluk-panel", "sorumluluk"],
        usage: ".sorumlulukpanel",
    },

    onLoad: function (client) {
        client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isStringSelectMenu() || interaction.customId !== 'sorumluluk_select') return;

            try {
                const selectedRoles = interaction.values;
                const member = interaction.member;

                const logChannel = interaction.guild.channels.cache.get(j2ponm.Sorumluluk.LogKanal);
                const onayChannel = interaction.guild.channels.cache.get(j2ponm.Sorumluluk.OnayKanal);

                if (!logChannel || !onayChannel) {
                    console.error('Log veya onay kanalı bulunamadı!');
                    return interaction.reply({
                        content: 'Bir hata oluştu! Lütfen yetkililere bildirin.',
                        ephemeral: true
                    });
                }

                // Yetkili kontrolü
                const yetkiSeviyeleri = [
                    {
                        roles: j2ponm.Sorumluluk.YetkiSeviyeleri.AltYetki.Roller,
                        required: j2ponm.Sorumluluk.YetkiSeviyeleri.AltYetki.GerekliSorumluluk
                    },
                    {
                        roles: j2ponm.Sorumluluk.YetkiSeviyeleri.OrtaYetki.Roller,
                        required: j2ponm.Sorumluluk.YetkiSeviyeleri.OrtaYetki.GerekliSorumluluk
                    },
                    {
                        roles: j2ponm.Sorumluluk.YetkiSeviyeleri.UstYetki.Roller,
                        required: j2ponm.Sorumluluk.YetkiSeviyeleri.UstYetki.GerekliSorumluluk
                    }
                ];

                // Kullanıcının yetkisini kontrol et
                let userYetkiSeviyesi = yetkiSeviyeleri.find(seviye =>
                    seviye.roles.some(roleId => interaction.member.roles.cache.has(roleId))
                );

                // Yetkisi yoksa
                if (!userYetkiSeviyesi) {
                    return interaction.reply({
                        content: "Bu menüyü kullanmak için yetkili olmanız gerekmektedir!",
                        ephemeral: true
                    });
                }

                // Seçilen sorumluluk sayısını kontrol et
                if (selectedRoles.length !== userYetkiSeviyesi.required) {
                    return interaction.reply({
                        content: `Yetki seviyenize göre tam olarak ${userYetkiSeviyesi.required} adet sorumluluk seçmelisiniz! (Şu an: ${selectedRoles.length})`,
                        ephemeral: true
                    });
                }

                const onayEmbed = new EmbedBuilder()
                    .setColor('#2F3136')
                    .setAuthor({ name: 'Sorumluluk Onay Sistemi', iconURL: interaction.guild.iconURL() })
                    .setDescription(`
${member} kullanıcısı aşağıdaki sorumlulukları almak istiyor:

${selectedRoles.map(roleId => {
                    const rol = interaction.guild.roles.cache.get(roleId);
                    const staffRoles = j2ponm.Sorumluluk.StaffRoles;
                    const alanLideriId = Object.keys(staffRoles).reduce((acc, key) => {
                        const entry = staffRoles[key];
                        if (entry && entry.responsible === roleId && entry.leader) return entry.leader;
                        return acc;
                    }, null);
                    return `${emojis.server_nokta} ${rol}${alanLideriId ? ` (<@&${alanLideriId}>)` : ''}`;
                }).join('\n')}

Onaylamak için ${emojis.server_onay} emojisine tıklayın.

Reddetmek için ${emojis.server_carpi} emojisine tıklayın.

${emojis.server_info} **Yalnızca** yukarıda etiketlenen alan liderleri tepki verebilir.`)
                    .setTimestamp();

                // Alan liderlerini etiketleme (Setup.json StaffRoles'tan dinamik)
                const staffRoles = j2ponm.Sorumluluk.StaffRoles;
                const alanLiderleri = selectedRoles.map(roleId => {
                    for (const key of Object.keys(staffRoles)) {
                        const entry = staffRoles[key];
                        if (entry && entry.responsible === roleId && entry.leader) return entry.leader;
                    }
                    return null;
                }).filter(Boolean);

                /** Bu talepteki sorumluluklar için onay/red verebilecek lider rol ID'leri (tekrarsız) */
                const allowedLeaderRoleIds = [...new Set(alanLiderleri)];

                // Seçim tamamlandıysa onay sürecine geç
                await interaction.reply({
                    content: `Sorumluluk talebiniz yetkililere iletildi. Lütfen onay sürecini bekleyiniz.`,
                    ephemeral: true
                });

                const onayMsg = await onayChannel.send({
                    content: alanLiderleri.map(liderId => `<@&${liderId}>`).join(' '),
                    embeds: [onayEmbed]
                }).catch(console.error);

                if (!onayMsg) {
                    console.error('Onay mesajı gönderilemedi!');
                    return;
                }

                // Emoji ID'lerini parse et
                const onayEmojiId = emojis.server_onay.match(/\d+/)?.[0];
                const redEmojiId = emojis.server_carpi.match(/\d+/)?.[0];
                
                // Sadece Emojis.json'dan gelen emojileri ekle
                if (onayEmojiId) await onayMsg.react(onayEmojiId).catch(console.error);
                if (redEmojiId) await onayMsg.react(redEmojiId).catch(console.error);

                // Onay/Red işlemi için collector (lider kontrolü collect içinde — üye cache dışı kalabilir)
                const filter = (reaction, user) => {
                    if (user.bot) return false;
                    const emojiId = reaction.emoji.id?.toString();
                    const emojiString = reaction.emoji.toString();
                    const isOnay = (onayEmojiId && emojiId === onayEmojiId) ||
                                   emojiString === emojis.server_onay;
                    const isRed = (redEmojiId && emojiId === redEmojiId) ||
                                 emojiString === emojis.server_carpi;
                    return isOnay || isRed;
                };

                const collector = onayMsg.createReactionCollector({ filter, time: 24 * 60 * 60 * 1000 }); // 24 saat

                collector.on('collect', async (reaction, user) => {
                    const guildMember = await interaction.guild.members.fetch(user.id).catch(() => null);
                    const isAreaLeader =
                        guildMember &&
                        allowedLeaderRoleIds.length > 0 &&
                        allowedLeaderRoleIds.some((roleId) => guildMember.roles.cache.has(roleId));

                    if (!isAreaLeader) {
                        await reaction.users.remove(user.id).catch(() => {});
                        return;
                    }

                    const emojiId = reaction.emoji.id?.toString();
                    const emojiString = reaction.emoji.toString();
                    
                    // Onay kontrolü - sadece Emojis.json'dan gelen emoji
                    const isOnay = (onayEmojiId && emojiId === onayEmojiId) ||
                                   emojiString === emojis.server_onay;
                    
                    if (isOnay) {
                        // Rolleri verme
                        for (const roleId of selectedRoles) {
                            await member.roles.add(roleId).catch(console.error);
                        }

                        // Log kanalına bilgi gönderme
                        const logEmbed = new EmbedBuilder()
                            .setColor('Green')
                            .setAuthor({ name: 'Sorumluluk Talebi Onaylandı', iconURL: interaction.guild.iconURL() })
                            .setDescription(`
${emojis.server_nokta} **Kullanıcı:** ${member} (\`${member.id}\`)
${emojis.server_nokta} **Onaylayan:** ${user} (\`${user.id}\`)
${emojis.server_nokta} **Verilen Sorumluluklar:**
${selectedRoles.map(roleId => {
                                const rol = interaction.guild.roles.cache.get(roleId);
                                return `${emojis.server_nokta} ${rol}`;
                            }).join('\n')}
${emojis.server_nokta} **Onay Tarihi:** <t:${Math.floor(Date.now() / 1000)}:F>`)
                            .setTimestamp();

                        await logChannel.send({ embeds: [logEmbed] });

                        // Onay mesajını güncelle
                        const updatedEmbed = EmbedBuilder.from(onayMsg.embeds[0])
                            .setColor('Green')
                            .setDescription(onayMsg.embeds[0].description + `\n\n${emojis.server_onay} Bu talep ${user} tarafından onaylandı.`);

                        await onayMsg.edit({ embeds: [updatedEmbed], components: [] });
                        await onayMsg.reactions.removeAll();

                        // Her sorumluluk için kendi alan liderine bildirim (Setup.json StaffRoles'tan dinamik)
                        const staffRoles = j2ponm.Sorumluluk.StaffRoles;
                        for (const roleId of selectedRoles) {
                            let alanLideriId = null;
                            for (const key of Object.keys(staffRoles)) {
                                const entry = staffRoles[key];
                                if (entry && entry.responsible === roleId && entry.leader) {
                                    alanLideriId = entry.leader;
                                    break;
                                }
                            }
                            if (alanLideriId) {
                                const rol = interaction.guild.roles.cache.get(roleId);
                                await logChannel.send({
                                    content: `<@&${alanLideriId}>, ${member} kullanıcısı ${rol} sorumluluğunu aldı. Kendisiyle iletişime geçebilirsiniz.`,
                                    allowedMentions: { roles: [alanLideriId] }
                                });
                            }
                        }

                    } else {
                        // Red log'u gönder
                        const redLogEmbed = new EmbedBuilder()
                            .setColor('Red')
                            .setAuthor({ name: 'Sorumluluk Talebi Reddedildi', iconURL: interaction.guild.iconURL() })
                            .setDescription(`
${emojis.server_nokta} **Kullanıcı:** ${member} (\`${member.id}\`)
${emojis.server_nokta} **Reddeden:** ${user} (\`${user.id}\`)
${emojis.server_nokta} **İstenen Sorumluluklar:**
${selectedRoles.map(roleId => {
                                const rol = interaction.guild.roles.cache.get(roleId);
                                return `${emojis.server_nokta} ${rol}`;
                            }).join('\n')}
${emojis.server_nokta} **Red Tarihi:** <t:${Math.floor(Date.now() / 1000)}:F>`)
                            .setTimestamp();

                        await logChannel.send({ embeds: [redLogEmbed] });

                        // Red mesajını güncelle
                        const updatedEmbed = EmbedBuilder.from(onayMsg.embeds[0])
                            .setColor('Red')
                            .setDescription(onayMsg.embeds[0].description + `\n\n${emojis.server_carpi} Bu talep ${user} tarafından reddedildi.`);

                        await onayMsg.edit({ embeds: [updatedEmbed], components: [] });
                        await onayMsg.reactions.removeAll();
                    }

                    collector.stop();
                });

            } catch (error) {
                console.error('Sorumluluk işlem hatası:', error);
                if (!interaction.replied) {
                    await interaction.reply({
                        content: 'Bir hata oluştu! Lütfen daha sonra tekrar deneyin.',
                        ephemeral: true
                    }).catch(console.error);
                }
            }
        });
    },

    onCommand: async function (client, message, args) {
        const j2poncik = require("../../../../../../Global/Settings/System");
        
        // Developer kontrolü
        if (!j2poncik.BotsOwners.includes(message.author.id)) {
            return message.reply({ content: "Bu komut sadece developer'lar tarafından kullanılabilir!" }).then((e) => setTimeout(() => { e.delete(); }, 5000));
        }

        // Setup kontrolü
        if (!j2ponm.Sorumluluk || !j2ponm.Sorumluluk.StaffRoles) {
            return message.reply({ content: "Sorumluluk sistemi setup.json'da yapılandırılmamış! Lütfen setup.json dosyasını kontrol edin." }).then((e) => setTimeout(() => { e.delete(); }, 10000));
        }

        const staffRoles = j2ponm.Sorumluluk.StaffRoles;
        const sorumlulukRolleri = [];

        // Tüm sorumluluk rolleri ve liderlerini topla
        Object.keys(staffRoles).forEach(key => {
            if (staffRoles[key].responsible && staffRoles[key].leader) {
                const rol = message.guild.roles.cache.get(staffRoles[key].responsible);
                if (rol) {
                    sorumlulukRolleri.push({
                        value: staffRoles[key].responsible,
                        label: rol.name,
                        description: `Alan Lideri: ${message.guild.roles.cache.get(staffRoles[key].leader)?.name || 'Bulunamadı'}`
                    });
                }
            }
        });

        if (sorumlulukRolleri.length === 0) {
            return message.reply({ content: "Hiç sorumluluk rolü bulunamadı! Lütfen setup.json'da sorumluluk rolleri tanımlayın." }).then((e) => setTimeout(() => { e.delete(); }, 10000));
        }

        // Yetki seviyelerine göre max değer belirle
        const yetkiSeviyeleri = [
            {
                roles: j2ponm.Sorumluluk.YetkiSeviyeleri.AltYetki.Roller,
                required: j2ponm.Sorumluluk.YetkiSeviyeleri.AltYetki.GerekliSorumluluk,
                name: "Alt Yetki",
                text: "Alt Yetki"
            },
            {
                roles: j2ponm.Sorumluluk.YetkiSeviyeleri.OrtaYetki.Roller,
                required: j2ponm.Sorumluluk.YetkiSeviyeleri.OrtaYetki.GerekliSorumluluk,
                name: "Orta Yetki",
                text: "Orta Yetki"
            },
            {
                roles: j2ponm.Sorumluluk.YetkiSeviyeleri.UstYetki.Roller,
                required: j2ponm.Sorumluluk.YetkiSeviyeleri.UstYetki.GerekliSorumluluk,
                name: "Üst Yetki",
                text: "Üst Yetki"
            }
        ];

        const maxRequired = Math.max(...yetkiSeviyeleri.map(s => s.required));

        const selectMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('sorumluluk_select')
                .setPlaceholder('Sorumluluk seçin (Yetki seviyenize göre seçim yapın)')
                .setMinValues(1)
                .setMaxValues(maxRequired)
                .addOptions(sorumlulukRolleri)
        );

        const embed = new EmbedBuilder()
            .setTitle(`${emojis.server_star} Merhaba \`\`\`Carmenta \`\`\` Sorumluluk Seçim Paneline hoş geldiniz.`)
            .setDescription(`
sunucumuzun sorumluluk seçim sistemine hoş geldiniz.

${emojis.server_nokta} Bu panel üzerinden yetkili seviyenize uygun sorumlulukları seçebilirsiniz.

${emojis.server_nokta} Seçtiğiniz sorumluluklar ile ilgili görevleri yerine getirerek puan kazanabilirsiniz.

${emojis.server_nokta} Lütfen aşağıdaki yetki seviyelerine göre sorumluluk seçiminizi yapınız.

**Yetki Seviyeleri ve Sorumluluk Hakları:**

${yetkiSeviyeleri.map(seviye => {
                const rolesList = seviye.roles.map(roleId => {
                    const rol = message.guild.roles.cache.get(roleId);
                    return rol ? `**${rol}**` : roleId;
                }).join(', ');
                return `**${seviye.text}**\n${emojis.server_nokta} ${rolesList}`;
            }).join('\n\n')}

**Önemli Not:** 

Seçtiğiniz sorumluluklar yönetici ekibimiz tarafından onaylanacaktır. Onay sürecinde yeni bir seçim yapamazsınız.`)
            .setColor('#2F3136')
            .setFooter({ 
                text: '• Carmenta Sorumluluk Sistemi •',
                iconURL: message.guild.iconURL({ dynamic: true })
            });

        await message.channel.send({ embeds: [embed], components: [selectMenu] });
    },
};

