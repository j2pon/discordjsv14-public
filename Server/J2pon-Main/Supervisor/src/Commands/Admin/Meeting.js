const { ActionRowBuilder, PermissionsBitField, StringSelectMenuBuilder, EmbedBuilder } = require("discord.js");
const setup = require("../../../../../../Global/Settings/Setup.json");

module.exports = {
    name: "toplantı",
    description: "Toplantı başlatırsınız.",
    category: "ADMIN",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["toplanti","toplantı-başlat","toplantbaşlat"],
        usage: ".toplantı", 
    },

    onLoad: function (client) { },

    onCommand: async function (client, message, args, byj2ponembed) {
        // Yetki kontrolü
        if (!setup.OwnerRoles.some(role => message.member.roles.cache.has(role)) && 
            !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ content: "Yetkin bulunmamakta dostum." }).then((e) => setTimeout(() => { e.delete(); }, 5000));
        }

        // Ses kanalı kontrolü
        if (!message.member.voice.channel || !setup.MeetingChannel.includes(message.member.voice.channel.id)) {
            return message.reply({ content: "Bu komutu başlatabilmek için toplantı kanalında olmalısın." });
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('toplanti')
                    .setPlaceholder(`Toplantı başlatmak için menüleri kullanın!`)
                    .addOptions([
                        { label: 'Toplantı Başlat', description: `Toplantıyı Bulunduğunuz Ses Kanalında Başlatır Ve Rol Dağıtır!`, value: 'toplantibaslat', emoji: '🟢' },
                        { label: 'Toplantı Duyuru', description: `Yetkilileri DM Üzerinden Ses Kanalına Davet Eder!`, value: 'toplantiduyuru', emoji: '📣' },
                    ]),
            );

        let msg = await message.reply({ 
            components: [row], 
            content: `Aşağıdaki menüden toplantı başlatıp veya yetkililere DM üzerinden mesaj gönderebilirsiniz.`
        });

        const collector = msg.createMessageComponentCollector({ 
            filter: i => i.user.id === message.member.id, 
            time: 30000, 
            max: 1 
        });

        collector.on('collect', async (interaction) => {
            if (!interaction.isStringSelectMenu()) return;
            
            try {
                let value = interaction.values[0];
                
                switch (value) {
                    case "toplantibaslat":
                        // ConfirmerRoles'ün ilk rolünün pozisyonunu al
                        const confirmerRole = message.guild.roles.cache.get(setup.ConfirmerRoles[0]);
                        if (!confirmerRole) {
                            return interaction.reply({ content: "Confirmer rolü bulunamadı!", ephemeral: true });
                        }

                        // Sesteki ve seste olmayan kullanıcıları filtrele
                        const voiceuser = message.guild.members.cache.filter(member => 
                            member.roles.cache.has(setup.ConfirmerRoles[0]) && 
                            member.voice.channel && 
                            !member.user.bot
                        );

                        const nvoiceuser = message.guild.members.cache.filter(member => 
                            member.roles.cache.has(setup.ConfirmerRoles[0]) && 
                            !member.voice.channel && 
                            !member.user.bot
                        );

                        const mazeret = message.guild.roles.cache.get(setup.MazeretRole)?.members.size || 0;

                        await interaction.reply({ 
                            content: `${interaction.member}`, 
                            embeds: [byj2ponembed.setDescription(
                                `**Katıldı Rolü Verilecek Sayısı ${voiceuser.size}**\n` +
                                `**Katıldı Rolü Alınacak Sayısı ${nvoiceuser.size}**\n` +
                                `> **Mazeretli Kişi Sayısı ${mazeret}**\n\n` +
                                `**Toplantıda Olan ${voiceuser.size} Kişiye Katıldı Rolü Veriliyor..**`
                            )] 
                        });

                        await interaction.message.delete();

                        // Rol verme işlemi
                        let index = 0;
                        for (const [id, member] of voiceuser) {
                            setTimeout(async () => {
                                try {
                                    await member.roles.add(setup.JoinedRole);
                                } catch (err) {
                                    console.error(`${member.user.tag} kullanıcısına rol verilemedi:`, err);
                                }
                            }, index * 1000);
                            index++;
                        }
                        break;

                    case "toplantiduyuru":
                        // Seste olmayan yetkilileri bul
                        const nnvoiceuser = interaction.guild.members.cache.filter(member => {
                            const isNotInMeetingChannel = !member.voice.channel || 
                                !setup.MeetingChannel.includes(member.voice.channel.id);
                            const isNotBot = !member.user.bot;
                            const hasRole = setup.OwnerRoles.some(role => member.roles.cache.has(role)) ||
                                setup.ManagmentRoles.some(role => member.roles.cache.has(role)) ||
                                setup.StartAuthority.some(role => member.roles.cache.has(role)) ||
                                setup.ProblemSolversRoles.some(role => member.roles.cache.has(role));

                            return isNotInMeetingChannel && isNotBot && hasRole;
                        });

                        if (nnvoiceuser.size === 0) {
                            return interaction.reply({ 
                                embeds: [byj2ponembed.setDescription(`Sunucudaki Tüm Yetkililer Seste Bulunuyor!`)] 
                            });
                        }

                        const mesaj = await interaction.reply({ 
                            embeds: [byj2ponembed.setDescription(
                                `Seste Olmayan ${nnvoiceuser.size} Kişiye DM Üzerinden Duyuru Geçiliyor! Lütfen Biraz Bekleyiniz.`
                            )] 
                        });
                        
                        await interaction.message.delete();

                        // DM gönderme işlemi
                        let dmIndex = 0;
                        for (const [id, member] of nnvoiceuser) {
                            setTimeout(async () => {
                                try {
                                    await member.send(
                                        `Yetkili Olduğun \`${interaction.guild.name}\` Sunucusunda Toplantı Başlıyor! ` +
                                        `Toplantıda Bulunmadığın İçin Sana Bu Mesajı Gönderiyorum, ` +
                                        `Eğer Toplantıya Katılmazsan Uyarı Alıcaksın!`
                                    );
                                    await mesaj.edit(`> **${member} Kişisine DM Üzerinden Duyuru Yapıldı!**`);
                                } catch (err) {
                                    console.error(`DM gönderilemedi ${member.user.tag}:`, err);
                                    await interaction.channel.send(
                                        `${member} Yetkili Olduğun \`${interaction.guild.name}\` Sunucusunda ` +
                                        `Toplantı Başlıyor, Toplantıda Bulunmadığın İçin Sana Bu Mesajı Gönderiyorum, ` +
                                        `Eğer Toplantıya Katılmazsan Uyarı Alıcaksın!`
                                    );
                                    await mesaj.edit({ 
                                        embeds: [byj2ponembed.setDescription(
                                            `${member} Kişisinin DM'i Kapalı Olduğundan Kanalda Duyuru Yapıldı!`
                                        )] 
                                    });
                                }
                            }, dmIndex * 5000);
                            dmIndex++;
                        }
                        break;
                }
            } catch (error) {
                console.error("Toplantı komutunda hata:", error);
                await interaction.reply({ 
                    content: "Bir hata oluştu, lütfen daha sonra tekrar deneyin!", 
                    ephemeral: true 
                });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                msg.edit({ content: "Zaman aşımına uğradı!", components: [] }).catch(() => {});
            }
        });
    },
};