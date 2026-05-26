const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");
const setup = require("../../../../../../Global/Settings/Setup.json");

module.exports = {
    name: "rolyonetim",
    description: "Detaylı rol yönetim sistemi",
    category: "ADMIN",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["rolyönetim", "rolepanel", "ry"],
        usage: ".rolyonetim",
    },

    onLoad: function (client) {},

    onCommand: async function (client, message, args, byj2ponembed) {
        try {
            // Yetki kontrolü
            if (!setup.RolePanelRoles.some(role => message.member.roles.cache.has(role)) && 
                !setup.OwnerRoles.some(role => message.member.roles.cache.has(role)) && 
                !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                
                const yetkiliRoller = setup.RolePanelRoles
                    .map(roleId => message.guild.roles.cache.get(roleId))
                    .filter(role => role)
                    .map(role => role.toString())
                    .join(', ');

                const yetkiEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Yetersiz Yetki')
                    .setDescription(`Bu komutu kullanabilmek için aşağıdaki rollerden birine sahip olmalısınız:\n\n${yetkiliRoller || 'Yeterli yetki bulunamadı'}`)
                    .setFooter({ 
                        text: message.guild.name,
                        iconURL: message.guild.iconURL()
                    })
                    .setTimestamp();

                return message.channel.send({ embeds: [yetkiEmbed] })
                    .then(msg => setTimeout(() => msg.delete(), 5000));
            }

            // Kullanıcının en yüksek rolünü bul
            const userHighestRole = message.member.roles.highest;

            // Verilebilecek rolleri filtrele
            const availableRoles = Array.from(message.guild.roles.cache.values())
                .filter(role => 
                    role.position < userHighestRole.position &&
                    !role.managed &&
                    role.id !== message.guild.id &&
                    !(setup.RolePanelBlacklist || []).includes(role.id)
                )
                .sort((a, b) => b.position - a.position);

            const rolesPerPage = 50;
            let currentPage = 0;
            const maxPages = Math.ceil(availableRoles.length / rolesPerPage);

            // Sayfa içeriğini oluşturan fonksiyon
            function generateEmbed(page) {
                const start = page * rolesPerPage;
                const end = start + rolesPerPage;
                const currentRoles = availableRoles.slice(start, end);

                return new EmbedBuilder()
                    .setTitle('Carmenta - Rol Yönetim Paneli')
                    .setColor('#9B59B6')
                    .setDescription(
                        currentRoles.map((role, index) => 
                            `${start + index + 1}. ${role} (${role.members.size} üye)`
                        ).join('\n')
                    )
                    .setFooter({ 
                        text: `Sayfa ${page + 1}/${maxPages} • ${message.member.displayName} tarafından istendi • 30 saniye sonra silinecek`,
                        iconURL: message.author.displayAvatarURL()
                    })
                    .setTimestamp();
            }

            // Butonları oluştur
            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('previous')
                        .setEmoji('⬅️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(currentPage === 0),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setEmoji('➡️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(currentPage === maxPages - 1)
                );

            // İlk mesajı gönder
            const panelMsg = await message.channel.send({
                embeds: [generateEmbed(currentPage)],
                components: maxPages > 1 ? [buttons] : []
            });

            // Buton collector'ı oluştur
            if (maxPages > 1) {
                const collector = panelMsg.createMessageComponentCollector({
                    filter: i => i.user.id === message.author.id,
                    time: 30000 // 30 saniye
                });

                collector.on('collect', async interaction => {
                    if (interaction.customId === 'previous') {
                        currentPage = Math.max(0, currentPage - 1);
                    } else if (interaction.customId === 'next') {
                        currentPage = Math.min(maxPages - 1, currentPage + 1);
                    }

                    // Butonları güncelle
                    buttons.components[0].setDisabled(currentPage === 0);
                    buttons.components[1].setDisabled(currentPage === maxPages - 1);

                    // Mesajı güncelle
                    await interaction.update({
                        embeds: [generateEmbed(currentPage)],
                        components: [buttons]
                    });
                });

                collector.on('end', () => {
                    if (panelMsg) {
                        buttons.components.forEach(button => button.setDisabled(true));
                        panelMsg.edit({ components: [buttons] }).catch(() => {});
                    }
                });
            }

            // İlk mesajda kullanıcı ID'si var mı kontrol et
            let initialTargetMember = null;
            if (args[0]) {
                // Mention kontrolü
                initialTargetMember = message.mentions.members.first();
                
                // Mention yoksa ID kontrolü
                if (!initialTargetMember) {
                    const userIdMatch = args[0].match(/^(\d{17,19})$/);
                    if (userIdMatch) {
                        try {
                            initialTargetMember = await message.guild.members.fetch(userIdMatch[1]).catch(() => null);
                        } catch (e) {}
                    }
                }
            }
            
            // Mesaj collector'ı
            const messageCollector = message.channel.createMessageCollector({ 
                filter: m => m.author.id === message.author.id, 
                time: 30000 // 30 saniye
            });

            messageCollector.on('collect', async m => {
                try {
                    // Mesaj içeriğini parse et - virgülle ayrılmış rol numaraları
                    const fullContent = m.content.trim();
                    
                    // Kullanıcı belirleme: İlk mesajda belirtilen kullanıcı veya komutu kullanan
                    let targetMember = initialTargetMember || message.member;
                    
                    // Mention kontrolü (mesaj içinde mention varsa onu kullan)
                    const mentionedMember = m.mentions.members.first();
                    if (mentionedMember) {
                        targetMember = mentionedMember;
                    }
                    
                    // Virgülle ayrılmış kısımları parse et
                    const parts = fullContent.split(',').map(p => p.trim()).filter(p => p);
                    const roleNumbers = [];
                    let foundUserId = null;
                    
                    // Her kısmı kontrol et
                    for (const part of parts) {
                        const trimmed = part.trim();
                        
                        // Mention kontrolü
                        const mentionMatch = trimmed.match(/<@!?(\d{17,19})>/);
                        if (mentionMatch) {
                            try {
                                const member = await message.guild.members.fetch(mentionMatch[1]).catch(() => null);
                                if (member) {
                                    targetMember = member;
                                    foundUserId = mentionMatch[1];
                                }
                            } catch (e) {}
                            continue;
                        }
                        
                        // Discord ID formatı kontrolü (17-19 hane) - bu kullanıcı ID'si olabilir
                        const discordIdMatch = trimmed.match(/^(\d{17,19})$/);
                        if (discordIdMatch && !foundUserId) {
                            // Son Discord ID formatındaki sayıyı kullanıcı ID'si olarak dene
                            try {
                                const member = await message.guild.members.fetch(discordIdMatch[1]).catch(() => null);
                                if (member) {
                                    targetMember = member;
                                    foundUserId = discordIdMatch[1];
                                    continue;
                                }
                            } catch (e) {}
                        }
                        
                        // Eksi ile başlayan veya küçük sayılar rol numarasıdır
                        const isRemove = trimmed.startsWith('-');
                        const cleanNum = isRemove ? trimmed.substring(1).trim() : trimmed;
                        const numMatch = cleanNum.match(/^(\d+)$/);
                        
                        if (numMatch) {
                            const num = parseInt(numMatch[1]);
                            // Eğer sayı küçükse (rol numarası) veya Discord ID formatında değilse
                            if (num > 0 && num <= 10000) {
                                roleNumbers.push({ num, isRemove });
                            }
                        }
                    }
                    
                    if (roleNumbers.length === 0) {
                        return; // Rol numarası yoksa sessizce çık
                    }
                    
                    const rolesToAdd = [];
                    const rolesToRemove = [];
                    
                    // Her rol numarasını işle
                    for (const roleEntry of roleNumbers) {
                        const { num: roleNum, isRemove } = roleEntry;
                        
                        // Liste index'i (1-based'den 0-based'e çevir)
                        const roleIndex = roleNum - 1;
                        const selectedRole = availableRoles[roleIndex];
                        
                        if (!selectedRole) continue;
                        
                        if (isRemove) {
                            rolesToRemove.push(selectedRole);
                        } else {
                            rolesToAdd.push(selectedRole);
                        }
                    }
                    
                    if (rolesToAdd.length === 0 && rolesToRemove.length === 0) {
                        return message.channel.send({
                            embeds: [new EmbedBuilder()
                                .setDescription('❌ Geçerli bir rol numarası bulunamadı!')
                                .setColor('#ff0000')
                            ]
                        }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
                    }
                    
                    // Rolleri işle
                    const addedRoles = [];
                    const removedRoles = [];
                    
                    // Kaldırılacak rolleri işle
                    for (const role of rolesToRemove) {
                        if (targetMember.roles.cache.has(role.id)) {
                            await targetMember.roles.remove(role).catch(() => {});
                            removedRoles.push(role);
                        }
                    }
                    
                    // Verilecek rolleri işle
                    for (const role of rolesToAdd) {
                        if (!targetMember.roles.cache.has(role.id)) {
                            await targetMember.roles.add(role).catch(() => {});
                            addedRoles.push(role);
                        }
                    }
                    
                    // Sonuç mesajı
                    let resultMessage = `${targetMember} kullanıcısına `;
                    const resultParts = [];
                    if (addedRoles.length > 0) {
                        resultParts.push(`${addedRoles.map(r => r.toString()).join(', ')} ${addedRoles.length === 1 ? 'rolü verildi' : 'rolleri verildi'}`);
                    }
                    if (removedRoles.length > 0) {
                        resultParts.push(`${removedRoles.map(r => r.toString()).join(', ')} ${removedRoles.length === 1 ? 'rolü alındı' : 'rolleri alındı'}`);
                    }
                    
                    if (resultParts.length === 0) {
                        return; // Hiçbir değişiklik yok
                    }
                    
                    resultMessage += resultParts.join(' ve ');
                    
                    // Log kanalına detaylı log gönder
                    const logChannel = message.guild.channels.cache.find(x => x.name === "ry_log");
                    if (logChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setTitle(`${client.emoji("server_star")} Toplu Rol İşlemi Gerçekleşti`)
                            .setColor(removedRoles.length > 0 && addedRoles.length === 0 ? '#ff0000' : addedRoles.length > 0 ? '#00ff00' : '#ffaa00')
                            .setDescription(`${message.member} tarafından ${targetMember} kullanıcısına toplu rol işlemi yapıldı!`)
                            .addFields(
                                { 
                                    name: `${client.emoji("server_info")} Yetkili Bilgileri`,
                                    value: `${client.emoji("server_nokta")} İsim: ${message.member.displayName}\n${client.emoji("server_nokta")} ID: ${message.member.id}\n${client.emoji("server_nokta")} Etiket: ${message.member.user.tag}`,
                                    inline: true
                                },
                                { 
                                    name: `${client.emoji("server_members")} Kullanıcı Bilgileri`,
                                    value: `${client.emoji("server_nokta")} İsim: ${targetMember.displayName}\n${client.emoji("server_nokta")} ID: ${targetMember.id}\n${client.emoji("server_nokta")} Etiket: ${targetMember.user.tag}`,
                                    inline: true
                                },
                                {
                                    name: `${client.emoji("server_info")} İşlem Detayları`,
                                    value: `${addedRoles.length > 0 ? `${client.emoji("server_onay")} Verilen Roller: ${addedRoles.map(r => r.toString()).join(', ')}\n` : ''}${removedRoles.length > 0 ? `${client.emoji("server_carpi")} Alınan Roller: ${removedRoles.map(r => r.toString()).join(', ')}\n` : ''}${client.emoji("server_nokta")} Kanal: ${message.channel}`,
                                    inline: false
                                },
                                {
                                    name: `${client.emoji("server_info")} Zaman Bilgisi`,
                                    value: `${client.emoji("server_nokta")} Tarih: <t:${Math.floor(Date.now() / 1000)}:F>\n${client.emoji("server_nokta")} Unix: <t:${Math.floor(Date.now() / 1000)}:R>`,
                                    inline: false
                                }
                            )
                            .setThumbnail(targetMember.displayAvatarURL({ dynamic: true, size: 256 }))
                            .setAuthor({
                                name: message.member.displayName,
                                iconURL: message.member.displayAvatarURL({ dynamic: true })
                            })
                            .setFooter({ 
                                text: `${message.guild.name} • ID: ${message.id}`,
                                iconURL: message.guild.iconURL()
                            })
                            .setTimestamp();

                        await logChannel.send({ embeds: [logEmbed] });
                    }

                    // İşlem başarılı mesajı
                    await message.channel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(resultMessage)
                                .setColor(removedRoles.length > 0 && addedRoles.length === 0 ? '#ff0000' : addedRoles.length > 0 ? '#00ff00' : '#ffaa00')
                        ]
                    }).then(msg => {
                        if (msg) setTimeout(() => msg.delete().catch(() => {}), 5000);
                    }).catch(() => {});

                } catch (error) {
                    console.error(error);
                    message.channel.send('Bir hata oluştu!').catch(() => {});
                }
            });

            messageCollector.on('end', collected => {
                if (collected.size === 0 && panelMsg) {
                    message.channel.send('Süre doldu, işlem iptal edildi.')
                        .then(msg => {
                            if (msg) setTimeout(() => msg.delete().catch(() => {}), 5000);
                        })
                        .catch(() => {});
                }
                if (panelMsg) panelMsg.delete().catch(() => {});
            });

            // Orijinal komutu sil
            if (message.deletable) message.delete().catch(() => {});

            // Paneli 30 saniye sonra sil
            setTimeout(() => {
                if (panelMsg) panelMsg.delete().catch(() => {});
            }, 30000);

        } catch (error) {
            console.error(error);
            return message.channel.send('Bir hata oluştu!');
        }
    }
};
