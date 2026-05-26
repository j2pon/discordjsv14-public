const { Client, ApplicationCommandType,PermissionsBitField,SelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRow , ActionRowBuilder, Formatters,seelct, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags} = require("discord.js");
const guard = require("../../../../../J2pon-Guard/Schemas/Guard");
const j2poncik = require("../../../../../../Global/Settings/System");

module.exports = {
    name: "güvenli",
    description: "Güvenliye eklersiniz.",
    category: "OWNER",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["wl","whitelist","g"],
      usage: ".güvenli @kullanıcı", 
    },
  

    onLoad: function (client) { },

    onCommand: async function (client, message, args, byj2ponembed) {
        try {
            const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
            if (!member) return message.reply({content:`Hata: Birini Etiketlemeyi Unuttun!\n**Not:** Güvenli kategori listelerine eklediğin kişilerin yaptıklarından sorumlu değilizdir.`,ephemeral:true});
            
            const menu = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId("güvenli")
                        .setPlaceholder("Kategori Seçin!")
                        .setOptions([
                            {label:"Full",description:"Taç sahibi seviyesinde izinlere sahip olur.",value:"full"},
                            {label:"Sunucu Ayarları",description:"URL hariç sunucu profiline tam izinli erişim.",value:"server"},
                            {label:"Rolleri Yönet",description:"Rollere tam izinli erişim ve yönetim.",value:"role"},
                            {label:"Kanalları Yönet",description:"Kanallara tam izinli erişim ve yönetim.",value:"channel"},
                            {label:"Ban ve Kick",description:"Sağ tık Yasakla/At işlemlere tam izin.",value:"bankick"},
                            {label:"Emoji ve Sticker",description:"Tam izinli Emoji ve Sticker yönetimi.",value:"emojisticker"},
                            {label:"Chat Guard",description:"Chatte reklam/küfür erişimi.",value:"chatguard"},
                            {label:"Limitli Whitelist",description:"Sağ tık işlemler için limitli yetki verir.",value:"limited"},
                        ])
                );
            
            message.channel.send({content:`${member} kullanıcısını eklemek/çıkarmak istediğin **Güvenli Kişiler** kategorisini aşağıda butonları kullanarak seçiniz!`,components:[menu]}).then(async intMsg => {
                const filter = d => d.user.id == message.author.id;
                const collector = intMsg.createMessageComponentCollector({ filter: filter,  errors: ["time"], time: 30000*10 });
                
                collector.on('collect', async (menu) => {
                    try {
                        const selectedCategory = menu.values[0];
                        
                        // Limitli whitelist için özel işlem - deferUpdate yapmadan modal göster
                        if (selectedCategory === "limited") {
                            const guardWhitelistData = await guard.findOne({guildID:menu.guild.id}) || await guard.create({guildID:menu.guild.id});
                            const existingLimited = guardWhitelistData.limitedWhitelistMembers?.find(x => x.userId === member.id);
                            
                            if (existingLimited) {
                                // Kullanıcı zaten listede, kaldırma veya limit güncelleme
                                const limits = existingLimited.limits || {};
                                const removeButton = new ActionRowBuilder().addComponents(
                                    new ButtonBuilder().setCustomId("limited_remove").setLabel("Kaldır").setStyle(ButtonStyle.Danger),
                                    new ButtonBuilder().setCustomId("limited_update").setLabel("Limit Güncelle").setStyle(ButtonStyle.Primary),
                                    new ButtonBuilder().setCustomId("limited_cancel").setLabel("İptal").setStyle(ButtonStyle.Secondary)
                                );
                                
                                const getResetTime = (resetAt) => {
                                    if (!resetAt || resetAt <= Date.now()) return "Sıfırlandı";
                                    return `<t:${Math.floor(resetAt / 1000)}:R>`;
                                };
                                
                                const limitsText = `**Ban:** ${limits.ban?.used || 0}/${limits.ban?.limit || 0} (Reset: ${getResetTime(limits.ban?.resetAt)})\n**Kick:** ${limits.kick?.used || 0}/${limits.kick?.limit || 0} (Reset: ${getResetTime(limits.kick?.resetAt)})\n**Timeout:** ${limits.timeout?.used || 0}/${limits.timeout?.limit || 0} (Reset: ${getResetTime(limits.timeout?.resetAt)})\n**Rol Verme:** ${limits.role_add?.used || 0}/${limits.role_add?.limit || 0} (Reset: ${getResetTime(limits.role_add?.resetAt)})\n**Rol Alma:** ${limits.role_remove?.used || 0}/${limits.role_remove?.limit || 0} (Reset: ${getResetTime(limits.role_remove?.resetAt)})`;
                                
                                await menu.reply({
                                    content: `${member} kullanıcısı zaten limitli whitelist'te!\n\n**Mevcut Limitler ve Kullanımlar:**\n${limitsText}\n\nNe yapmak istersiniz?`,
                                    components: [removeButton],
                                    flags: MessageFlags.Ephemeral
                                });
                                
                                const filterx = d => d.user.id == message.author.id;
                                const collectorx = menu.channel.createMessageComponentCollector({ filter: filterx, time: 30000*10 });
                                
                                collectorx.on("collect", async button => {
                                    if (button.customId === "limited_remove") {
                                        await guard.findOneAndUpdate(
                                            {guildID: button.guild.id},
                                            {$pull: {limitedWhitelistMembers: {userId: member.id}}},
                                            {upsert: true}
                                        );
                                        await button.reply({content:`**${member.user.tag}** limitli whitelist'ten kaldırıldı!`, flags: MessageFlags.Ephemeral});
                                        if (intMsg) await intMsg.delete().catch(() => {});
                                    } else if (button.customId === "limited_update") {
                                        const modal = new ModalBuilder()
                                            .setCustomId(`limited_modal_${member.id}`)
                                            .setTitle("Limitli Whitelist Limit Belirle");
                                        
                                        const banInput = new TextInputBuilder()
                                            .setCustomId("ban_limit")
                                            .setLabel("Ban Limit")
                                            .setStyle(TextInputStyle.Short)
                                            .setPlaceholder("Örn: 10")
                                            .setValue((limits.ban?.limit || 10).toString())
                                            .setRequired(true)
                                            .setMaxLength(5);
                                        
                                        const kickInput = new TextInputBuilder()
                                            .setCustomId("kick_limit")
                                            .setLabel("Kick Limit")
                                            .setStyle(TextInputStyle.Short)
                                            .setPlaceholder("Örn: 10")
                                            .setValue((limits.kick?.limit || 10).toString())
                                            .setRequired(true)
                                            .setMaxLength(5);
                                        
                                        const timeoutInput = new TextInputBuilder()
                                            .setCustomId("timeout_limit")
                                            .setLabel("Timeout Limit")
                                            .setStyle(TextInputStyle.Short)
                                            .setPlaceholder("Örn: 10")
                                            .setValue((limits.timeout?.limit || 10).toString())
                                            .setRequired(true)
                                            .setMaxLength(5);
                                        
                                        const roleAddInput = new TextInputBuilder()
                                            .setCustomId("role_add_limit")
                                            .setLabel("Rol Verme Limit")
                                            .setStyle(TextInputStyle.Short)
                                            .setPlaceholder("Örn: 10")
                                            .setValue((limits.role_add?.limit || 10).toString())
                                            .setRequired(true)
                                            .setMaxLength(5);
                                        
                                        const roleRemoveInput = new TextInputBuilder()
                                            .setCustomId("role_remove_limit")
                                            .setLabel("Rol Alma Limit")
                                            .setStyle(TextInputStyle.Short)
                                            .setPlaceholder("Örn: 10")
                                            .setValue((limits.role_remove?.limit || 10).toString())
                                            .setRequired(true)
                                            .setMaxLength(5);
                                        
                                        const row1 = new ActionRowBuilder().addComponents(banInput);
                                        const row2 = new ActionRowBuilder().addComponents(kickInput);
                                        const row3 = new ActionRowBuilder().addComponents(timeoutInput);
                                        const row4 = new ActionRowBuilder().addComponents(roleAddInput);
                                        const row5 = new ActionRowBuilder().addComponents(roleRemoveInput);
                                        
                                        modal.addComponents(row1, row2, row3, row4, row5);
                                        
                                        await button.showModal(modal);
                                    } else if (button.customId === "limited_cancel") {
                                        await button.reply({content: "İşlem iptal edildi.", flags: MessageFlags.Ephemeral});
                                    }
                                });
                                return;
                            }
                            
                            // Yeni kullanıcı ekleme - Modal göster
                            const modal = new ModalBuilder()
                                .setCustomId(`limited_modal_${member.id}`)
                                .setTitle("Limitli Whitelist Limit Belirle");
                            
                            const banInput = new TextInputBuilder()
                                .setCustomId("ban_limit")
                                .setLabel("Ban Limit")
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder("Örn: 10")
                                .setValue("10")
                                .setRequired(true)
                                .setMaxLength(5);
                            
                            const kickInput = new TextInputBuilder()
                                .setCustomId("kick_limit")
                                .setLabel("Kick Limit")
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder("Örn: 10")
                                .setValue("10")
                                .setRequired(true)
                                .setMaxLength(5);
                            
                            const timeoutInput = new TextInputBuilder()
                                .setCustomId("timeout_limit")
                                .setLabel("Timeout Limit")
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder("Örn: 10")
                                .setValue("10")
                                .setRequired(true)
                                .setMaxLength(5);
                            
                            const roleAddInput = new TextInputBuilder()
                                .setCustomId("role_add_limit")
                                .setLabel("Rol Verme Limit")
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder("Örn: 10")
                                .setValue("10")
                                .setRequired(true)
                                .setMaxLength(5);
                            
                            const roleRemoveInput = new TextInputBuilder()
                                .setCustomId("role_remove_limit")
                                .setLabel("Rol Alma Limit")
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder("Örn: 10")
                                .setValue("10")
                                .setRequired(true)
                                .setMaxLength(5);
                            
                            const row1 = new ActionRowBuilder().addComponents(banInput);
                            const row2 = new ActionRowBuilder().addComponents(kickInput);
                            const row3 = new ActionRowBuilder().addComponents(timeoutInput);
                            const row4 = new ActionRowBuilder().addComponents(roleAddInput);
                            const row5 = new ActionRowBuilder().addComponents(roleRemoveInput);
                            
                            modal.addComponents(row1, row2, row3, row4, row5);
                            
                            await menu.showModal(modal);
                            return;
                        }
                        
                        // Diğer kategoriler için deferUpdate yap
                        await menu.deferUpdate();
                        const guardWhitelistData = await guard.findOne({guildID:menu.guild.id});
                        const system = global.system;
                        
                        const normalizeList = (val) => {
                            if (!val) return [];
                            if (Array.isArray(val)) return val;
                            return [val];
                        };

                        // Menü değerleriyle birebir aynı key'ler kullan
                        const categories = {
                            full: normalizeList(guardWhitelistData ? guardWhitelistData.SafedMembers : system.BotsOwners),
                            server: normalizeList(guardWhitelistData ? guardWhitelistData.serverSafedMembers : system.BotsOwners),
                            role: normalizeList(guardWhitelistData ? guardWhitelistData.roleSafedMembers : system.BotsOwners),
                            channel: normalizeList(guardWhitelistData ? guardWhitelistData.channelSafedMembers : system.BotsOwners),
                            bankick: normalizeList(guardWhitelistData ? guardWhitelistData.banKickSafedMembers : system.BotsOwners),
                            emojisticker: normalizeList(guardWhitelistData ? guardWhitelistData.emojiStickers : system.BotsOwners),
                            chatguard: normalizeList(guardWhitelistData ? guardWhitelistData.chatGuard : system.BotsOwners),
                        };
                        
                        const butonlar = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId("onayla").setLabel("Evet").setStyle(ButtonStyle.Success),
                            new ButtonBuilder().setCustomId("reddet").setLabel("Hayır").setStyle(ButtonStyle.Danger),
                        );
                        
                        const categoryNames = {
                            full: "Tam izin",
                            server: "Sunucu profili",
                            role: "Rollere tam erişim",
                            channel: "Kanallara tam erişim",
                            bankick: "Üyeleri Yasakla/At",
                            emojisticker: "Emoji ve Sticker Yönet",
                            chatguard: "Chat Guard",
                        };
                        
                        const fieldNames = {
                            full: "SafedMembers",
                            server: "serverSafedMembers",
                            role: "roleSafedMembers",
                            channel: "channelSafedMembers",
                            bankick: "banKickSafedMembers",
                            emojisticker: "emojiStickers",
                            chatguard: "chatGuard",
                        };
                        
                        const currentList = categories[selectedCategory] || [];
                        const isInList = currentList.includes(member.id);
                        
                        const actionText = isInList ? "kaldırmak" : "vermek";
                        const categoryName = categoryNames[selectedCategory];
                        
                        const followUpMsg = await menu.followUp({
                            content: `${member} kullanıcısına sunucuda **${categoryName}** izni ${actionText} istediğinize emin misiniz?`,
                            components: [butonlar],
                            flags: MessageFlags.Ephemeral
                        });
                        
                        const filterx = d => d.user.id == message.author.id;
                        const collectorx = await followUpMsg.createMessageComponentCollector({ filter: filterx,  errors: ["time"], time: 30000*10 });
                        
                        collectorx.on("collect", async button => {
                            try {
                                if (button.customId == "onayla") {
                                    const fieldName = fieldNames[selectedCategory];
                                    const operation = isInList ? "$pull" : "$push";
                                    const operationValue = isInList ? {[fieldName]: member.id} : {[fieldName]: member.id};
                                    
                                    await guard.findOneAndUpdate(
                                        {guildID: button.guild.id},
                                        {[operation]: operationValue},
                                        {upsert: true}
                                    );
                                    
                                    const actionResult = isInList ? "kaldırıldı" : "verildi";
                                    await button.reply({content:`**${member.user.tag}** Sunucuda **${categoryName}** erişim izni ${actionResult}!`, flags: MessageFlags.Ephemeral});
                                    
                                    if (intMsg) await intMsg.delete().catch(() => {});
                                    if (followUpMsg) await followUpMsg.delete().catch(() => {});
                                } else {
                                    if (intMsg) await intMsg.delete().catch(() => {});
                                    if (followUpMsg) await followUpMsg.delete().catch(() => {});
                                }
                            } catch (error) {
                                console.error("Safe command button error:", error);
                                if (!button.replied && !button.deferred) {
                                    button.reply({content: `İşlem sırasında bir hata oluştu: ${error.message}`, flags: MessageFlags.Ephemeral}).catch(() => {});
                                }
                            }
                        });
                    } catch (error) {
                        console.error("Safe command menu error:", error);
                        if (!menu.replied && !menu.deferred) {
                            menu.reply({content: `İşlem sırasında bir hata oluştu: ${error.message}`, flags: MessageFlags.Ephemeral}).catch(() => {});
                        }
                    }
                });
            });
        } catch (error) {
            console.error("Safe command error:", error);
            message.reply({embeds:[byj2ponembed.setDescription(`Güvenli ekleme işlemi sırasında bir hata oluştu: ${error.message}`)]}).then((e) => setTimeout(() => { e.delete(); }, 5000));
        }
     },

  };
