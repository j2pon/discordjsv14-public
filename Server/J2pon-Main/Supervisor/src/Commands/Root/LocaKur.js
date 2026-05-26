const { Events, ApplicationCommandOptionType, ModalBuilder, EmbedBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ChannelType, PermissionsBitField } = require("discord.js");
const j2poncik = require("../../../../../../Global/Settings/System");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const özelPerms = require("../../../../../../Global/Schemas/specialcommand");

module.exports = {
    name: "locakur",
    description: "Özel oda ve komut oluşturur",
    category: "OWNER",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["locakur"],
        usage: ".locakur",
    },

    onLoad: function (client) {
        createLocaKurModal(client);
    },

    onCommand: async function (client, message, args, byj2ponembed) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ embeds: [byj2ponembed.setDescription(`${client.emoji("server_carpi")} Bu komutu kullanmak için yetkiniz bulunmamaktadır.`)] }).then((e) => setTimeout(() => { e.delete(); }, 5000));
        }

        const modal = new ModalBuilder()
            .setCustomId("locakur_modal")
            .setTitle("Özel Oda Oluştur");

        const rolSahibiInput = new TextInputBuilder()
            .setCustomId("rol_sahibi_id")
            .setLabel("Rol Sahibi İD")
            .setPlaceholder("Rol sahibinin Discord ID'sini girin")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const komutAdiInput = new TextInputBuilder()
            .setCustomId("komut_adi")
            .setLabel("Komut Adı (. olmadan)")
            .setPlaceholder("Örn: roladi")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const odaIsmiInput = new TextInputBuilder()
            .setCustomId("oda_ismi")
            .setLabel("Oda İsmi")
            .setPlaceholder("Oluşturulacak odanın ismini girin")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const rolIsmiInput = new TextInputBuilder()
            .setCustomId("rol_ismi")
            .setLabel("Rol İsmi")
            .setPlaceholder("Oluşturulacak rolün ismini girin")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(rolSahibiInput);
        const secondActionRow = new ActionRowBuilder().addComponents(komutAdiInput);
        const thirdActionRow = new ActionRowBuilder().addComponents(odaIsmiInput);
        const fourthActionRow = new ActionRowBuilder().addComponents(rolIsmiInput);

        modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);

        await message.reply({ content: `${client.emoji("server_loading")} Form açılıyor...`, ephemeral: true }).catch(() => {});
        
        // Modal'ı göstermek için interaction gerekiyor, bu yüzden bir button kullanacağız
        const button = require("discord.js").ButtonBuilder;
        const buttonStyle = require("discord.js").ButtonStyle;
        
        const createEmoji = client.emoji("appEmoji_create");
        const row = new ActionRowBuilder().addComponents(
            new button()
                .setCustomId("locakur_button")
                .setLabel("Formu Aç")
                .setStyle(buttonStyle.Primary)
        );
        
        if (createEmoji && createEmoji.id) {
            row.components[0].setEmoji({ id: createEmoji.id });
        }

        const msg = await message.channel.send({ 
            embeds: [byj2ponembed.setDescription(`${client.emoji("server_star")} Özel oda oluşturmak için aşağıdaki butona tıklayın.\n\n${client.emoji("server_info")} Form doldurulduktan sonra oda, rol ve özel komut otomatik olarak oluşturulacaktır.`)], 
            components: [row] 
        });

        const collector = msg.createMessageComponentCollector({ 
            filter: (i) => i.user.id === message.author.id,
            time: 60000 
        });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'locakur_button') {
                await interaction.showModal(modal);
            }
        });

        collector.on('end', () => {
            if (!msg.deleted) msg.delete().catch(() => {});
        });
    },
};

function createLocaKurModal(client) {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (interaction.customId === 'locakur_modal') {
            await interaction.deferReply({ ephemeral: true });

            const rolSahibiID = interaction.fields.getTextInputValue('rol_sahibi_id');
            const komutAdi = interaction.fields.getTextInputValue('komut_adi').toLowerCase().trim();
            const odaIsmi = interaction.fields.getTextInputValue('oda_ismi');
            const rolIsmi = interaction.fields.getTextInputValue('rol_ismi');

            // Validasyonlar
            if (!komutAdi || komutAdi.includes(' ') || komutAdi.includes('.')) {
                return interaction.editReply({ content: `${client.emoji("server_carpi")} Komut adı boşluk veya nokta içeremez!` });
            }

            if (komutAdi.length > 20) {
                return interaction.editReply({ content: `${client.emoji("server_carpi")} Komut adı 20 karakterden uzun olamaz!` });
            }

            if (!/^\d+$/.test(rolSahibiID)) {
                return interaction.editReply({ content: `${client.emoji("server_carpi")} Geçerli bir kullanıcı ID'si giriniz!` });
            }

            const rolSahibi = await interaction.guild.members.fetch(rolSahibiID).catch(() => null);
            if (!rolSahibi) {
                return interaction.editReply({ content: `${client.emoji("server_carpi")} Belirtilen ID'ye sahip kullanıcı bulunamadı!` });
            }

            // Özel komut kontrolü
            const data = await özelPerms.findOne({ guildID: interaction.guild.id });
            const permsData = data ? data.perms : [];
            if (permsData.some(veri => veri.permName === komutAdi)) {
                return interaction.editReply({ content: `${client.emoji("server_carpi")} Bu komut adı zaten kullanılıyor!` });
            }

            try {
                // Kategori ID'sini al (LocaCategory)
                const categoryId = j2ponm.LocaCategory?.[0];
                if (!categoryId) {
                    return interaction.editReply({ content: `${client.emoji("server_carpi")} Oda kategorisi bulunamadı! Lütfen Setup.json'da LocaCategory ayarlayın.` });
                }

                const category = interaction.guild.channels.cache.get(categoryId);
                if (!category) {
                    return interaction.editReply({ content: `${client.emoji("server_carpi")} Kategori bulunamadı!` });
                }

                // Rol oluştur
                const role = await interaction.guild.roles.create({
                    name: rolIsmi,
                    reason: `Özel oda için rol oluşturuldu - ${interaction.user.tag}`
                });

                // Oda oluştur (rol yetkileriyle)
                const voiceChannel = await interaction.guild.channels.create({
                    name: odaIsmi,
                    type: ChannelType.GuildVoice,
                    parent: categoryId,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.roles.everyone.id,
                            deny: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak, PermissionsBitField.Flags.UseVAD]
                        },
                        {
                            id: role.id,
                            allow: [
                                PermissionsBitField.Flags.Connect,
                                PermissionsBitField.Flags.Speak,
                                PermissionsBitField.Flags.UseVAD
                            ]
                        },
                        {
                            id: rolSahibiID,
                            allow: [
                                PermissionsBitField.Flags.MuteMembers,
                                PermissionsBitField.Flags.MoveMembers
                            ]
                        }
                    ],
                    reason: `Özel oda oluşturuldu - ${interaction.user.tag}`
                });

                // Özel komut oluştur
                const komutPushlancak = {
                    permName: komutAdi,
                    staffRoleID: [],
                    staffUserID: [rolSahibiID],
                    permID: [role.id]
                };

                await özelPerms.findOneAndUpdate(
                    { guildID: interaction.guild.id },
                    { $push: { perms: komutPushlancak } },
                    { upsert: true }
                );

                const embed = new EmbedBuilder()
                    .setColor(0x2b2d31)
                    .setTitle(`${client.emoji("server_onay")} Özel Oda Başarıyla Oluşturuldu!`)
                    .setDescription(`
                        ${client.emoji("server_star")} **Komut Adı:** \`.${komutAdi}\`
                        ${client.emoji("appEmoji_create")} **Oda İsmi:** ${voiceChannel.toString()}
                        ${client.emoji("appEmoji_ekle")} **Rol İsmi:** ${role.toString()}
                        ${client.emoji("server_members")} **Rol Sahibi:** <@${rolSahibiID}>
                        
                        ${client.emoji("server_info")} **Rol Sahibi Yetkileri:**
                        ${client.emoji("server_nokta")} Odada susturma yetkisi
                        ${client.emoji("server_nokta")} Odadan atma yetkisi
                        
                        ${client.emoji("server_ok")} Artık \`.${komutAdi} @kullanıcı\` komutu ile bu rolü verebilirsiniz.
                    `)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error('LocaKur hatası:', error);
                await interaction.editReply({ content: `${client.emoji("server_carpi")} Bir hata oluştu: ${error.message}` });
            }
        }
    });
}

