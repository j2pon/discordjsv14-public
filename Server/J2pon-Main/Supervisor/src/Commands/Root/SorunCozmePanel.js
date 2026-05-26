const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, MessageFlags } = require("discord.js");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const emojis = require("../../../../../../Global/Settings/Emojis.json");
const j2poncik = require("../../../../../../Global/Settings/System");
const sorunCozmeStats = require("../../../../../../Global/Schemas/sorunCozmeStats");

let ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize;
try {
    const v2 = require("discord.js");
    ContainerBuilder = v2.ContainerBuilder;
    TextDisplayBuilder = v2.TextDisplayBuilder;
    SeparatorBuilder = v2.SeparatorBuilder;
    SeparatorSpacingSize = v2.SeparatorSpacingSize;
} catch (_) {}

// Cooldown sistemi ve aktif sorun çözme oturumları için Map'ler
const cooldowns = new Map();
const activeSessions = new Map(); // key: voiceChannelId, value: { startedAt, starterId }

module.exports = {
    name: "scpanel",
    description: "Sorun Çözme Panel Sistemi",
    category: "OWNER",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["sorun-cozme-panel", "soruncozme"],
        usage: ".scpanel",
    },

    onLoad: function (client) {
        client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isButton()) return;

            const customId = interaction.customId;

            // Mevcut "sorun çözücü çağır" butonu
            if (customId === 'sorun_cozucu_cagir') {
                try {
                    const member = interaction.member;
                    const userId = member.id;

                    // Cooldown kontrolü (15 dakika = 900000 ms)
                    const cooldownTime = 15 * 60 * 1000; // 15 dakika
                    const now = Date.now();
                    const cooldownEnd = cooldowns.get(userId);

                    if (cooldownEnd && now < cooldownEnd) {
                        const remainingTime = Math.ceil((cooldownEnd - now) / 1000 / 60); // dakika cinsinden
                        return interaction.reply({
                            content: `${emojis.server_carpi} Butona bastıktan sonra **${remainingTime} dakika** sonra tekrar kullanabilirsiniz.`,
                            flags: MessageFlags.Ephemeral,
                        });
                    }

                    if (!member.voice.channel) {
                        return interaction.reply({
                            content: `${emojis.server_carpi} Sorun çözücü çağırmak için önce bir sesli kanala katılmanız gerekmektedir.`,
                            flags: MessageFlags.Ephemeral,
                        });
                    }

                    const problemSolversRoles = j2ponm.ProblemSolversRoles || [];
                    if (problemSolversRoles.length === 0) {
                        return interaction.reply({
                            content: `${emojis.server_carpi} Sorun çözücü rolleri setup.json'da tanımlanmamış!`,
                            flags: MessageFlags.Ephemeral,
                        });
                    }

                    const sorunCozucuMentions = problemSolversRoles.map(roleId => `<@&${roleId}>`).join(' ');

                    const logChannelId = j2ponm.SorunCozmeLogChannel;
                    let logChannel = logChannelId ? interaction.guild.channels.cache.get(logChannelId) : null;

                    if (!logChannel) {
                        const troubleshootingCategory = j2ponm.TroubleshootingCategory?.[0];
                        if (troubleshootingCategory) {
                            const category = interaction.guild.channels.cache.get(troubleshootingCategory);
                            if (category && category.children) {
                                logChannel = category.children.cache
                                    .filter(ch => ch.isTextBased())
                                    .first();
                            }
                        }
                    }

                    if (!logChannel) {
                        logChannel = interaction.channel;
                    }

                    const logEmbed = new EmbedBuilder()
                        .setColor('#2F3136')
                        .setAuthor({
                            name: 'Sorun Çözücü Çağrıldı',
                            iconURL: interaction.guild.iconURL({ dynamic: true })
                        })
                        .setDescription(`
${emojis.server_info} **Kullanıcı:** ${member} (\`${member.id}\`)
${emojis.server_info} **Sesli Kanal:** ${member.voice.channel} (\`${member.voice.channel.id}\`)
${emojis.server_info} **Tarih:** <t:${Math.floor(Date.now() / 1000)}:F>

${member} kullanıcısı sesli kanalda sorun çözücü çağırdı. Lütfen ilgili kanala giderek yardımcı olun.`)
                        .setTimestamp();

                    await logChannel.send({
                        content: sorunCozucuMentions,
                        embeds: [logEmbed],
                        allowedMentions: { roles: problemSolversRoles }
                    }).catch(console.error);

                    cooldowns.set(userId, now + cooldownTime);

                    await interaction.reply({
                        content: `${emojis.server_onay} Sorun çözücü başarıyla çağrıldı! Sorun çözme ekibi size yardımcı olmak için ilgili kanala gelecektir.`,
                        flags: MessageFlags.Ephemeral,
                    });

                    setTimeout(() => {
                        cooldowns.delete(userId);
                    }, cooldownTime);
                } catch (error) {
                    console.error('Sorun çözme işlem hatası:', error);
                    if (!interaction.replied) {
                        await interaction.reply({
                            content: `${emojis.server_carpi} Bir hata oluştu! Lütfen daha sonra tekrar deneyin.`,
                            flags: MessageFlags.Ephemeral,
                        }).catch(console.error);
                    }
                }
                return;
            }

            // Sorun çözme başlat / bitir
            if (customId !== 'sorun_cozme_baslat' && customId !== 'sorun_cozme_bitir') return;

            try {
                const member = interaction.member;
                const voiceChannel = member.voice.channel;

                // Yalnızca sorun çözme sorumlusu & lideri kullanabilsin
                const staffRoles = j2ponm.Sorumluluk?.StaffRoles?.sorunCozucu || {};
                const allowedRoleIds = [staffRoles.responsible, staffRoles.leader].filter(Boolean);
                const hasPermission = allowedRoleIds.some((id) => member.roles.cache.has(id));

                if (!hasPermission) {
                    return interaction.reply({
                        content: `${emojis.server_carpi} Bu butonu sadece **sorun çözme sorumlusu** ve **lideri** kullanabilir.`,
                        flags: MessageFlags.Ephemeral,
                    });
                }

                if (!voiceChannel) {
                    return interaction.reply({
                        content: `${emojis.server_carpi} Sorun çözme başlatmak/bbitirmek için bir sesli kanalda olmanız gerekmektedir.`,
                        flags: MessageFlags.Ephemeral,
                    });
                }

                const key = voiceChannel.id;
                const now = Date.now();

                // Başlat
                if (customId === 'sorun_cozme_baslat') {
                    if (activeSessions.has(key)) {
                        return interaction.reply({
                            content: `${emojis.server_carpi} Bu ses kanalında zaten aktif bir sorun çözme oturumu var.`,
                            flags: MessageFlags.Ephemeral,
                        });
                    }

                    activeSessions.set(key, { startedAt: now, starterId: member.id });

                    return interaction.reply({
                        content: `${emojis.server_onay} Sorun çözme oturumu **başlatıldı**. Süre sayacı çalışıyor.`,
                        ephemeral: true,
                    });
                }

                // Bitir
                const session = activeSessions.get(key);
                if (!session) {
                    return interaction.reply({
                        content: `${emojis.server_carpi} Bu ses kanalında aktif bir sorun çözme oturumu bulunamadı.`,
                        flags: MessageFlags.Ephemeral,
                    });
                }

                activeSessions.delete(key);

                const durationMs = now - session.startedAt;
                const durationMinutes = Math.max(1, Math.round(durationMs / 1000 / 60));

                // Sorun çözme boyunca seste bulunan kişiler (bitirirken kanaldaki herkes)
                const voiceMembers = Array.from(voiceChannel.members.values())
                    .filter((m) => !m.user.bot)
                    .map((m) => `${emojis.server_members} ${m} (\`${m.id}\`)`)
                    .join('\n') || `${emojis.server_nokta} Kimse bulunamadı.`;

                // Log kanalını al
                const logChannelId = j2ponm.SorunCozmeLogChannel;
                let logChannel = logChannelId ? interaction.guild.channels.cache.get(logChannelId) : null;
                if (!logChannel) {
                    logChannel = interaction.channel;
                }

                const starter = interaction.guild.members.cache.get(session.starterId) || member;

                // Stat: sorun çözme
                await sorunCozmeStats.findOneAndUpdate(
                    { guildID: interaction.guild.id, userID: starter.id },
                    {
                        $inc: { count: 1 },
                        $push: {
                            sessions: {
                                channelId: voiceChannel.id,
                                durationMs,
                                date: Date.now(),
                            },
                        },
                    },
                    { upsert: true, new: true }
                );

                const logEmbed = new EmbedBuilder()
                    .setColor(0x2F3136)
                    .setAuthor({
                        name: 'Sorun Çözme Oturumu Tamamlandı',
                        iconURL: interaction.guild.iconURL({ dynamic: true }) || undefined,
                    })
                    .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 256 }) || undefined)
                    .setDescription(`
${emojis.server_star} **Sorun Çözme Özeti**

${emojis.server_info} **Sorun çözme başlatan yetkili:** ${starter} (\`${starter.id}\`)
${emojis.server_info} **Sorun çözme süresi:** \`${durationMinutes} dakika\`
${emojis.server_info} **Ses kanalı:** ${voiceChannel} (\`${voiceChannel.id}\`)
${emojis.server_info} **Tarih & Saat:** <t:${Math.floor(now / 1000)}:F>
`)
                    .addFields(
                        {
                            name: `${emojis.server_members} Sorun çözme odasında olanlar`,
                            value: voiceMembers,
                            inline: false,
                        },
                    )
                    .setFooter({ text: 'Sorun Çözme Log Sistemi', iconURL: interaction.client.user.displayAvatarURL({ size: 128 }) })
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] }).catch(console.error);

                return interaction.reply({
                    content: `${emojis.server_onay} Sorun çözme oturumu **bitirildi** ve log kanala gönderildi.`,
                    flags: MessageFlags.Ephemeral,
                });
            } catch (error) {
                console.error('Sorun çözme başlat/bitir hata:', error);
                if (!interaction.replied) {
                    await interaction.reply({
                        content: `${emojis.server_carpi} Bir hata oluştu! Lütfen daha sonra tekrar deneyin.`,
                        flags: MessageFlags.Ephemeral,
                    }).catch(console.error);
                }
            }
        });
    },

    onCommand: async function (client, message, args) {
        const j2poncik = require("../../../../../../Global/Settings/System");

        if (!j2poncik.BotsOwners.includes(message.author.id)) {
            return message.reply({ content: "Bu komut sadece developer'lar tarafından kullanılabilir!" }).then((e) => setTimeout(() => { e.delete(); }, 5000));
        }

        const titleContent = "## Merhaba! Sorun Çözme Paneline Hoş Geldiniz!";
        const introContent = [
            "Bu panel aracılığıyla sunucudaki sorunlarınızı kolayca bildirebilir ve bir sorun çözücü çağırabilirsiniz.",
            "Destek ekibimiz, çağrınızı gördükten kısa süre içinde sizinle ilgilenecektir.",
        ].join(" ");
        const oneriContent = [
            `${emojis.server_info} **Öneri:**`,
            "> Lütfen çağrı göndermeden önce sorununuzu kısa ve net şekilde ifade edin.",
            "> Bu, ekibin size daha hızlı yardımcı olmasını sağlar.",
        ].join("\n");
        const ctaContent = `> ${emojis.j2pon_alt} Sorununuzu bildirmek için aşağıdaki düğmeye tıklayın.`;

        const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("sorun_cozucu_cagir")
                .setLabel("Sorun Çözücü Çağır")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(client.emoji("j2pon_zil") || "🛟"),
            new ButtonBuilder()
                .setCustomId("sorun_cozme_baslat")
                .setLabel("Sorun Çözme Başlat")
                .setStyle(ButtonStyle.Success)
                .setEmoji(emojis.server_onay || "✅"),
            new ButtonBuilder()
                .setCustomId("sorun_cozme_bitir")
                .setLabel("Sorun Çözme Bitir")
                .setStyle(ButtonStyle.Danger)
                .setEmoji(emojis.server_carpi || "⛔")
        );

        const fullText = [titleContent, "", introContent, "", oneriContent, "", ctaContent].join("\n");

        if (ContainerBuilder && TextDisplayBuilder && SeparatorBuilder && SeparatorSpacingSize != null) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(titleContent),
                    new TextDisplayBuilder().setContent(introContent)
                )
                .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(oneriContent),
                    new TextDisplayBuilder().setContent(ctaContent)
                );
            await message.channel
                .send({
                    components: [container, buttonRow],
                    flags: MessageFlags.IsComponentsV2,
                })
                .catch(async (err) => {
                    console.error("Sorun çözme panel (Components V2) gönderilemedi, content ile deniyor:", err?.message);
                    const embed = new EmbedBuilder().setDescription(fullText).setThumbnail(message.client.user.displayAvatarURL({ size: 256 })).setColor(0x2F3136);
                    await message.channel.send({ embeds: [embed], components: [buttonRow] });
                });
        } else {
            const embed = new EmbedBuilder().setDescription(fullText).setThumbnail(message.client.user.displayAvatarURL({ size: 256 })).setColor(0x2F3136);
            await message.channel.send({ embeds: [embed], components: [buttonRow] });
        }
    },
};

