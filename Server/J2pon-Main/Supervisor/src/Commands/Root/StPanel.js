const { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, EmbedBuilder, TextInputBuilder, TextInputStyle, PermissionsBitField, roleMention, MessageFlags } = require("discord.js");
const j2poncik = require("../../../../../../Global/Settings/System");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const { VoiceStat } = require("../../../../../../Global/Models");
const fetch = require("node-fetch");

// Components V2 (discord.js 14.18+) – yoksa content + row ile gönderilir
let ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize;
try {
    const v2 = require("discord.js");
    ContainerBuilder = v2.ContainerBuilder;
    TextDisplayBuilder = v2.TextDisplayBuilder;
    SeparatorBuilder = v2.SeparatorBuilder;
    SeparatorSpacingSize = v2.SeparatorSpacingSize;
} catch (_) {}

// Helper: normalize client.emoji(...) output for Builder.setEmoji
function parseEmoji(input, fallback) {
    try {
        if (!input) return fallback;
        if (typeof input === "string") {
            const m = input.match(/<a?:\w+:(\d+)>/);
            if (m) return { id: m[1] };
            return input;
        }
        if (typeof input === "object") {
            if (input.id) return { id: String(input.id) };
        }
    } catch (e) {}
    return fallback;
}

module.exports = {
    name: "stpanel",
    description: "Streamer Panel",
    category: "OWNER",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["streamerpanel"],
        usage: ".stpanel",
    },

    onLoad: function (client) {
        createStreamerPanel(client);
    },

    onCommand: async function (client, message, args) {
        if (!message.guild || !message.member) return;
        
        if (!j2ponm.OwnerRoles.some(j2ponlan => message.member.roles.cache.has(j2ponlan)) && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            message.react(`${client.emoji("server_carpi")}`);
            message.reply({ content: `Yeterli yetkin yok!` }).then((e) => setTimeout(() => { e.delete(); }, 5000));
            return;
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('streamerpanel')
                    .setLabel('Streamer Başvurusu Gönder')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji(parseEmoji(client.emoji("server_youtube"), '📹'))
            );

        const guildName = message.guild.name;
        const streamerMention = j2ponm.StreamerRole ? roleMention(j2ponm.StreamerRole) : 'Streamer';

        const titleContent = `## ${guildName} Streamer Başvuru Paneli`;
        const introContent = `Merhaba **${guildName}** sunucusunun değerli üyeleri!\n\nEğer bu toplulukta **Streamer** olarak yer almak istiyorsan aşağıdaki adımları takip etmen yeterli.`;
        const stepsContent = [
            '• İlk olarak **Speedtest** adresine girip hız testi yap. → https://www.speedtest.net',
            '• Test tamamlandığında çıkan bağlantıyı **Streamer Başvurusu Gönder** formuna ekle.',
            '• Gönder tuşuna bastıktan sonra başvurun otomatik olarak iletilir.'
        ].join('\n');
        const infoContent = `> ℹ️ Şartları sağladığın takdirde sana otomatik olarak ${streamerMention} rolü verilecektir.`;
        const warningContent = `> ⚠️ Tüm sürecin hızlı ilerlemesi için bağlantını doğru şekilde eklediğinden emin ol!`;

        if (ContainerBuilder && TextDisplayBuilder && SeparatorBuilder && SeparatorSpacingSize != null) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(titleContent),
                    new TextDisplayBuilder().setContent(introContent)
                )
                .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(stepsContent),
                    new TextDisplayBuilder().setContent(infoContent),
                    new TextDisplayBuilder().setContent(warningContent)
                );
            await message.channel.send({
                components: [container, row],
                flags: MessageFlags.IsComponentsV2,
            }).catch(async (err) => {
                console.error('StPanel (Components V2) gönderilemedi, content ile deniyor:', err?.message);
                const content = [titleContent, '', introContent, '', stepsContent, '', infoContent, '', warningContent].join('\n');
                const embed = new EmbedBuilder().setDescription(content).setThumbnail(message.client.user.displayAvatarURL({ size: 256 })).setColor(0x2F3136);
                await message.channel.send({ embeds: [embed], components: [row] });
            });
        } else {
            const content = [titleContent, '', introContent, '', stepsContent, '', infoContent, '', warningContent].join('\n');
            const embed = new EmbedBuilder().setDescription(content).setThumbnail(message.client.user.displayAvatarURL({ size: 256 })).setColor(0x2F3136);
            await message.channel.send({ embeds: [embed], components: [row] });
        }
    },
};

function createStreamerPanel(client) {
    client.on(Events.InteractionCreate, async interaction => {
        if (interaction.isButton() && interaction.customId === 'streamerpanel') {
            if (!interaction.guild || !interaction.member) {
                return interaction.reply({ content: `Bu komut sadece sunucularda kullanılabilir.`, flags: MessageFlags.Ephemeral });
            }
            
            if (j2ponm.StreamerRole && interaction.member.roles.cache.has(j2ponm.StreamerRole)) {
                return interaction.reply({ content: `Zaten streamer rolünüz bulunmakta.`, flags: MessageFlags.Ephemeral });
            }

            const modal = new ModalBuilder()
                .setCustomId("streamer-appeal")
                .setTitle("Başvuru Paneli")
                .addComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId("speedTest")
                                .setLabel("SpeedTest Result URL")
                                .setPlaceholder("https://www.speedtest.net/result/13042119778")
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                        )
                );

            await interaction.showModal(modal);
        }

        if (interaction.isModalSubmit() && interaction.customId === 'streamer-appeal') {
            if (!interaction.guild || !interaction.member) {
                return interaction.reply({ content: `Bu komut sadece sunucularda kullanılabilir.`, flags: MessageFlags.Ephemeral });
            }

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const resultURL = interaction.fields.getTextInputValue('speedTest');
            
            if (!resultURL || !resultURL.includes('https://www.speedtest.net/result/')) {
                return interaction.editReply({ content: `${client.emoji("server_carpi")} Lütfen geçerli bir SpeedTest sonucu linki giriniz.` });
            }

            try {
                const result = await scrappeOoklaData(resultURL);
                
                if (!result || !result.upload) {
                    return interaction.editReply({ content: `${client.emoji("server_carpi")} SpeedTest sonucu alınamadı. Lütfen geçerli bir link giriniz.` });
                }

                const voiceData = await VoiceStat.findOne({ guildID: j2poncik.ServerID, userID: interaction.user.id });
                const totalVoice = voiceData ? voiceData.TotalStat : 0;

                if (result.upload < 4) {
                    return interaction.editReply({ content: `${client.emoji("server_carpi")} Streamer rolü almak için en az 4 Mbps yükleme hızına sahip olmalısınız.` });
                }

                if (totalVoice < 3600000) {
                    return interaction.editReply({ content: `${client.emoji("server_carpi")} Streamer rolü almak için en az 1 saat ses kanallarında vakit geçirmelisiniz.` });
                }

                if (j2ponm.StreamerRole && interaction.member.roles.cache.has(j2ponm.StreamerRole)) {
                    return interaction.editReply({ content: `${client.emoji("server_carpi")} Zaten streamer rolünüz bulunmakta.` });
                }

                if (!j2ponm.StreamerRole) {
                    return interaction.editReply({ content: `${client.emoji("server_carpi")} Streamer rolü ayarlanmamış. Lütfen yönetici ile iletişime geçin.` });
                }

                await interaction.member.roles.add(j2ponm.StreamerRole);
                await interaction.editReply({ content: `${client.emoji("server_onay")} Streamer başvurunuz sistemimiz tarafından kabul edildi ve streamer rolü üzerinize verildi.` });

                const channel = client.guilds.cache.get(j2poncik.ServerID)?.channels.cache.find(c => c.name === "st-basvuru-log" || c.name === "streamer-basvuru-log");
                
                if (channel) {
                    const embed = new EmbedBuilder()
                        .setColor('#5865F2')
                        .setImage(`${resultURL}.png`)
                        .setFooter({ text: `${interaction.guild.name} | Created By J2pon` })
                        .setDescription(`${interaction.user} streamer başvurusu yaptı otomatik olarak kabul edildi!`);

                    const mentions = [];
                    if (j2ponm.StreamerResponsible) mentions.push(`<@&${j2ponm.StreamerResponsible}>`);

                    const contentText = `${interaction.member} ${mentions.join(' ')}`.trim();
                    await channel.send({ 
                        content: contentText || undefined, 
                        embeds: [embed] 
                    });
                }
            } catch (error) {
                console.error('Streamer panel error:', error);
                return interaction.editReply({ content: `${client.emoji("server_carpi")} Bir hata oluştu. Lütfen daha sonra tekrar deneyin.` });
            }
        }
    });
}

async function scrappeOoklaData(url) {
    try {
        const resultId = url.match(/\/result\/(\d+)/)?.[1];
        if (!resultId) {
            throw new Error('Geçersiz SpeedTest URL');
        }

        // Speedtest.net'in yeni API endpoint'i
        const apiUrl = `https://www.speedtest.net/api/js/result-data?id=${resultId}`;
        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Referer': 'https://www.speedtest.net/'
            }
        });

        if (!response.ok) {
            // Alternatif yöntem: HTML'den veri çekme
            const htmlUrl = `https://www.speedtest.net/result/${resultId}`;
            const htmlResponse = await fetch(htmlUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            
            if (!htmlResponse.ok) {
                throw new Error('SpeedTest API hatası');
            }

            const html = await htmlResponse.text();
            
            // HTML'den JSON verisini çıkar
            const jsonMatch = html.match(/window\.OOKLA\.INIT_DATA\s*=\s*({.+?});/s);
            if (!jsonMatch) {
                throw new Error('SpeedTest verisi bulunamadı');
            }

            const data = JSON.parse(jsonMatch[1]);
            const result = data.result || data;

            // Veri formatını kontrol et ve dönüştür
            let download = 0;
            let upload = 0;
            let ping = 0;

            if (result.download) {
                download = typeof result.download === 'object' && result.download.bandwidth 
                    ? (result.download.bandwidth * 8) / 1000000 
                    : (result.download || 0);
            }

            if (result.upload) {
                upload = typeof result.upload === 'object' && result.upload.bandwidth 
                    ? (result.upload.bandwidth * 8) / 1000000 
                    : (result.upload || 0);
            }

            if (result.ping) {
                ping = typeof result.ping === 'object' && result.ping.latency 
                    ? result.ping.latency 
                    : (result.ping || 0);
            }

            return { download, upload, ping };
        }

        const data = await response.json();
        const result = data.result || data;
        
        // Veri formatını kontrol et ve dönüştür
        let download = 0;
        let upload = 0;
        let ping = 0;

        if (result.download) {
            download = typeof result.download === 'object' && result.download.bandwidth 
                ? (result.download.bandwidth * 8) / 1000000 
                : (result.download || 0);
        }

        if (result.upload) {
            upload = typeof result.upload === 'object' && result.upload.bandwidth 
                ? (result.upload.bandwidth * 8) / 1000000 
                : (result.upload || 0);
        }

        if (result.ping) {
            ping = typeof result.ping === 'object' && result.ping.latency 
                ? result.ping.latency 
                : (result.ping || 0);
        }

        return { download, upload, ping };
    } catch (error) {
        console.error('SpeedTest scrape error:', error);
        return null;
    }
}

