const { ApplicationCommandOptionType, PermissionsBitField, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, codeBlock } = require("discord.js");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const system = require("../../../../../../Global/Settings/System");
const moment = require("moment");
moment.locale("tr");

// Global cooldown için Map (sese davet butonu için 30 dakika)
const inviteCooldown = new Map();
const INVITE_COOLDOWN_MS = 30 * 60 * 1000; // 30 dakika

// Discord mesaj karakter limiti (güvenli sınır)
const MESSAGE_CHAR_LIMIT = 1900;
const EMBED_DESC_LIMIT = 4000;

module.exports = {
    name: "ysay",
    description: "Yetkililerin ses denetimleri için kullanırsınız.",
    category: "OWNER",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["yses", "yetkilisay", "yetkili-say", "y-say"],
        usage: ".ysay",
    },

    onLoad: function (client) { },

    onCommand: async function (client, message, args) {

        if (!message.guild) return;
        if (!system.BotsOwners.includes(message.author.id)) {
            message.react(`${client.emoji("server_carpi")}`);
            message.reply({ content: `${client.emoji("server_carpi")} Bu komutu sadece bot sahipleri kullanabilir!` }).then((e) => setTimeout(() => { e.delete(); }, 5000));
            return;
        }

        // Emojiler
        const onayEmoji = client.emoji("server_onay");
        const carpiEmoji = client.emoji("server_carpi");
        const loadingEmoji = client.emoji("server_loading");
        const infoEmoji = client.emoji("server_info");
        const membersEmoji = client.emoji("server_members");

        // Yetkili filtreleri
        const ToplamYetkili = message.guild.members.cache.filter(m => 
            j2ponm.ConfirmerRoles.some(x => m.roles.cache.has(x))
        );
        
        const AktifOlanYetkili = message.guild.members.cache.filter(m => 
            j2ponm.ConfirmerRoles.some(x => m.roles.cache.has(x)) && 
            m.presence && 
            m.presence.status !== 'offline'
        );
        
        // Offline kontrolü: presence yoksa veya status offline ise
        const AktifOlmayanYetkili = message.guild.members.cache.filter(m => 
            j2ponm.ConfirmerRoles.some(x => m.roles.cache.has(x)) && 
            (!m.presence || m.presence.status === 'offline')
        );
        
        const SesteOlanYetkili = message.guild.members.cache.filter(m => 
            j2ponm.ConfirmerRoles.some(x => m.roles.cache.has(x)) && 
            m.voice && 
            m.voice.channel
        );
        
        const SesteOlmayanYetkili = message.guild.members.cache.filter(m => 
            j2ponm.ConfirmerRoles.some(x => m.roles.cache.has(x)) && 
            (!m.voice || !m.voice.channel)
        );

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('yetkilisay')
                    .setPlaceholder(`Menüden bir işlem seçin!`)
                    .addOptions([
                        { label: 'Yetkilileri listele', value: 'yetkilikontrol', emoji: '📋' },
                        { label: 'Yetkilileri sese davet et', value: 'yetkilisesdavet', emoji: '📢' },
                        { label: 'Sesteki yetkilileri listele', value: 'sestekiyetkililer', emoji: '🔉' },
                        { label: 'Seste olmayan yetkilileri listele', value: 'sesteolmayanyetkililer', emoji: '🔇' },
                    ]),
            );

        const yetkililerembed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(`${infoEmoji} Yetkili İstatistikleri`)
            .setDescription(`Menüyü kullanarak gerekli işlemleri yerine getirebilirsiniz.`)
            .addFields(
                { name: `${membersEmoji} Toplam Yetkili`, value: `\`${ToplamYetkili.size}\``, inline: true },
                { name: `${onayEmoji} Çevrimiçi`, value: `\`${AktifOlanYetkili.size}\``, inline: true },
                { name: `${carpiEmoji} Çevrimdışı`, value: `\`${AktifOlmayanYetkili.size}\``, inline: true },
                { name: `🔊 Seste Olan`, value: `\`${SesteOlanYetkili.size}\``, inline: true },
                { name: `🔇 Seste Olmayan`, value: `\`${SesteOlmayanYetkili.size}\``, inline: true },
            )
            .setFooter({ text: `${message.guild.name}`, iconURL: message.guild.iconURL({ dynamic: true }) })
            .setTimestamp();

        const byj2pon = await message.reply({ embeds: [yetkililerembed], components: [row] });
        const filter = i => i.user.id == message.author.id;
        let collector = await byj2pon.createMessageComponentCollector({ filter, time: 60000 });

        collector.on("collect", async (interaction) => {
            
            // ═══════════════════════════════════════════════════
            // YETKİLİLERİ LİSTELE
            // ═══════════════════════════════════════════════════
            if (interaction.values[0] === "yetkilikontrol") {
                await interaction.deferUpdate();
                
                if (ToplamYetkili.size === 0) {
                    return interaction.channel.send({ content: `${carpiEmoji} Hiç yetkili bulunamadı!` });
                }

                const uyeListe = [];
                ToplamYetkili.forEach(member => { 
                    const isOnline = member.presence && member.presence.status !== 'offline';
                    const isInVoice = member.voice && member.voice.channel;
                    const onlineStatus = isOnline ? `${onayEmoji} Çevrimiçi` : `${carpiEmoji} Çevrimdışı`;
                    const voiceStatus = isInVoice ? `🔊 ${member.voice.channel.name}` : `🔇 Seste değil`;
                    uyeListe.push(`**${member.user.tag}**\n└ ${onlineStatus} | ${voiceStatus}`);
                });
                
                // Embed description limiti için parçala
                const embedChunks = chunkifyByLength(uyeListe, EMBED_DESC_LIMIT, '\n\n');
                
                for (let index = 0; index < embedChunks.length; index++) {
                    const embed = new EmbedBuilder()
                        .setColor('#5865F2')
                        .setTitle(`📋 Yetkili Listesi ${embedChunks.length > 1 ? `(${index + 1}/${embedChunks.length})` : ''}`)
                        .setDescription(embedChunks[index])
                        .setFooter({ text: `Toplam: ${ToplamYetkili.size} yetkili` });
                    
                    await interaction.channel.send({ embeds: [embed] });
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            // ═══════════════════════════════════════════════════
            // YETKİLİLERİ SESE DAVET ET (Global Cooldown + DM)
            // ═══════════════════════════════════════════════════
            if (interaction.values[0] === "yetkilisesdavet") {
                await interaction.deferUpdate();
                
                // Global cooldown kontrolü
                const guildId = message.guild.id;
                const lastUsed = inviteCooldown.get(guildId);
                const now = Date.now();
                
                if (lastUsed && (now - lastUsed) < INVITE_COOLDOWN_MS) {
                    const remainingTime = INVITE_COOLDOWN_MS - (now - lastUsed);
                    const minutes = Math.ceil(remainingTime / 60000);
                    return interaction.channel.send({ 
                        content: `${carpiEmoji} Bu özellik global cooldown'da! **${minutes} dakika** sonra tekrar kullanabilirsiniz.` 
                    });
                }
                
                // Seste olmayan yetkilileri yeniden kontrol et
                const sesteOlmayanlar = message.guild.members.cache.filter(m => 
                    j2ponm.ConfirmerRoles.some(x => m.roles.cache.has(x)) && 
                    (!m.voice || !m.voice.channel)
                );
                
                if (sesteOlmayanlar.size === 0) {
                    return interaction.channel.send({ content: `${onayEmoji} Tüm yetkililer zaten seste!` });
                }

                // Cooldown'u başlat
                inviteCooldown.set(guildId, now);
                
                await interaction.channel.send({ 
                    content: `${loadingEmoji} **Seste olmayan ${sesteOlmayanlar.size} yetkiliye DM gönderiliyor...**` 
                });

                // DM gönderim sonuçlarını takip et
                const dmBasarili = []; // DM başarılı gönderilen
                const dmBasarisiz = []; // DM kapalı olanlar

                // DM mesajı
                const dmMessage = `**Merhaba!** 👋\n\n\`${message.member.user.tag}\` tarafından **${message.guild.name}** sunucusunda herhangi bir ses kanalında aktiflik göstermen için çağırılıyorsun.\n\nMüsaitsen kayıt kanallarına, Public'te sohbet etmeye veya AFK ses kanalına girmen gerekmektedir.\n\n**İyi günler dileriz!** 🎧`;

                // Her yetkiliye DM gönder
                for (const [memberId, member] of sesteOlmayanlar) {
                    try {
                        await member.send({ content: dmMessage });
                        dmBasarili.push(member);
                    } catch (error) {
                        // DM gönderilemedi (DM kapalı veya başka sebep)
                        dmBasarisiz.push(member);
                    }
                    // Rate limit için kısa bekleme
                    await new Promise(resolve => setTimeout(resolve, 500));
                }

                // Özet embed
                const ozetEmbed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle(`${infoEmoji} Sese Davet Sonuçları`)
                    .setDescription(`**${sesteOlmayanlar.size}** yetkiliye davet gönderildi.`)
                    .addFields(
                        { name: `${onayEmoji} DM Gönderildi`, value: `\`${dmBasarili.length}\` kişi`, inline: true },
                        { name: `${carpiEmoji} DM'i Kapalı`, value: `\`${dmBasarisiz.length}\` kişi`, inline: true },
                    )
                    .setFooter({ text: `Bu özellik 30 dakika sonra tekrar kullanılabilir.` })
                    .setTimestamp();

                await interaction.channel.send({ embeds: [ozetEmbed] });

                // Sonuç listesini oluştur
                const sonucListesi = [];

                // DM başarılı olanlar
                for (const member of dmBasarili) {
                    sonucListesi.push(`${member} - ${onayEmoji} **DM Gönderildi**`);
                }

                // DM başarısız olanlar (kanala da etiketle)
                for (const member of dmBasarisiz) {
                    sonucListesi.push(`${member} - ${carpiEmoji} **DM'i Kapalı** - Sese Gelir misin?`);
                }

                // Mesaj limiti için parçala ve gönder
                const messageChunks = chunkifyByLength(sonucListesi, MESSAGE_CHAR_LIMIT, '\n');
                
                for (let i = 0; i < messageChunks.length; i++) {
                    await interaction.channel.send({ content: messageChunks[i] });
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                await interaction.channel.send({ 
                    content: `${onayEmoji} **Sese davet işlemi tamamlandı!**` 
                });
            }

            // ═══════════════════════════════════════════════════
            // SESTEKİ YETKİLİLERİ LİSTELE
            // ═══════════════════════════════════════════════════
            if (interaction.values[0] === "sestekiyetkililer") {
                await interaction.deferUpdate();
                
                // Yeniden kontrol et
                const sesteOlanlar = message.guild.members.cache.filter(m => 
                    j2ponm.ConfirmerRoles.some(x => m.roles.cache.has(x)) && 
                    m.voice && 
                    m.voice.channel
                );
                
                if (sesteOlanlar.size === 0) {
                    return interaction.channel.send({ content: `${carpiEmoji} Şu anda ses kanallarında yetkili bulunmuyor!` });
                }

                // Kanallara göre grupla
                const kanalGruplari = new Map();
                sesteOlanlar.forEach(member => {
                    const channelName = member.voice.channel.name;
                    const channelId = member.voice.channel.id;
                    if (!kanalGruplari.has(channelId)) {
                        kanalGruplari.set(channelId, { name: channelName, members: [] });
                    }
                    kanalGruplari.get(channelId).members.push(member.user.tag);
                });

                // Field'ları oluştur
                const fields = [];
                kanalGruplari.forEach((data, channelId) => {
                    const memberList = data.members.map(tag => `• ${tag}`).join('\n');
                    fields.push({
                        name: `🔉 ${data.name} (${data.members.length} kişi)`,
                        value: memberList || 'Boş',
                        inline: false
                    });
                });

                // Field limiti (25) ve value limiti (1024) için parçala
                const fieldChunks = chunkifyFields(fields);

                for (let i = 0; i < fieldChunks.length; i++) {
                    const embed = new EmbedBuilder()
                        .setColor('#57F287')
                        .setTitle(`${onayEmoji} Seste Olan Yetkililer ${fieldChunks.length > 1 ? `(${i + 1}/${fieldChunks.length})` : ''}`)
                        .setDescription(i === 0 ? `Toplam **${sesteOlanlar.size}** yetkili ses kanallarında.` : null)
                        .setFooter({ text: `${message.guild.name}`, iconURL: message.guild.iconURL({ dynamic: true }) })
                        .setTimestamp();

                    fieldChunks[i].forEach(field => {
                        // Field value'su 1024'ü aşarsa parçala
                        if (field.value.length > 1024) {
                            const valueChunks = splitString(field.value, 1024);
                            valueChunks.forEach((chunk, idx) => {
                                embed.addFields({
                                    name: idx === 0 ? field.name : `${field.name} (devam)`,
                                    value: chunk,
                                    inline: false
                                });
                            });
                        } else {
                            embed.addFields(field);
                        }
                    });

                    await interaction.channel.send({ embeds: [embed] });
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            // ═══════════════════════════════════════════════════
            // SESTE OLMAYAN YETKİLİLERİ LİSTELE
            // ═══════════════════════════════════════════════════
            if (interaction.values[0] === "sesteolmayanyetkililer") {
                await interaction.deferUpdate();
                
                // Yeniden kontrol et
                const sesteOlmayanlar = message.guild.members.cache.filter(m => 
                    j2ponm.ConfirmerRoles.some(x => m.roles.cache.has(x)) && 
                    (!m.voice || !m.voice.channel)
                );
            
                if (sesteOlmayanlar.size === 0) {
                    return interaction.channel.send({ content: `${onayEmoji} Harika! Tüm yetkililer şu anda seste.` });
                }
            
                const uyeListe = [];
                sesteOlmayanlar.forEach(member => { 
                    const isOnline = member.presence && member.presence.status !== 'offline';
                    const status = isOnline ? onayEmoji : carpiEmoji;
                    uyeListe.push(`${status} **${member.user.tag}**`);
                });
            
                // Embed description limiti için parçala
                const embedChunks = chunkifyByLength(uyeListe, EMBED_DESC_LIMIT, '\n');
                
                for (let index = 0; index < embedChunks.length; index++) {
                    const embed = new EmbedBuilder()
                        .setColor('#ED4245')
                        .setTitle(`${carpiEmoji} Seste Olmayan Yetkililer ${embedChunks.length > 1 ? `(${index + 1}/${embedChunks.length})` : ''}`)
                        .setDescription(embedChunks[index])
                        .setFooter({ text: `Toplam: ${sesteOlmayanlar.size} yetkili seste değil` });
                    
                    await interaction.channel.send({ embeds: [embed] });
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        });

        collector.on("end", async () => {
            try {
                const disabledRow = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('yetkilisay_disabled')
                            .setPlaceholder('Menü süresi doldu!')
                            .setDisabled(true)
                            .addOptions([{ label: 'Süre doldu', value: 'disabled' }])
                    );
                await byj2pon.edit({ components: [disabledRow] }).catch(() => {});
            } catch (e) {}
        });
    },
};

// Yardımcı fonksiyon: Diziyi eleman sayısına göre parçala
function chunkify(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

// Yardımcı fonksiyon: Diziyi karakter limitine göre parçala (görselliği bozmadan)
function chunkifyByLength(arr, maxLength, separator = '\n') {
    const chunks = [];
    let currentChunk = [];
    let currentLength = 0;

    for (const item of arr) {
        const itemLength = item.length + separator.length;
        
        // Eğer bu item eklendiğinde limit aşılacaksa yeni chunk başlat
        if (currentLength + itemLength > maxLength && currentChunk.length > 0) {
            chunks.push(currentChunk.join(separator));
            currentChunk = [];
            currentLength = 0;
        }
        
        currentChunk.push(item);
        currentLength += itemLength;
    }

    // Son chunk'ı ekle
    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(separator));
    }

    return chunks;
}

// Yardımcı fonksiyon: Field'ları parçala (max 25 field per embed)
function chunkifyFields(fields, maxFields = 20) {
    const chunks = [];
    for (let i = 0; i < fields.length; i += maxFields) {
        chunks.push(fields.slice(i, i + maxFields));
    }
    return chunks;
}

// Yardımcı fonksiyon: String'i belirli uzunlukta parçala
function splitString(str, maxLength) {
    const chunks = [];
    const lines = str.split('\n');
    let currentChunk = '';

    for (const line of lines) {
        if ((currentChunk + '\n' + line).length > maxLength && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = line;
        } else {
            currentChunk = currentChunk ? currentChunk + '\n' + line : line;
        }
    }

    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}
