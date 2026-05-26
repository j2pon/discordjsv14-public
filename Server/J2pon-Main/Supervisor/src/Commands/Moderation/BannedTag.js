const { ApplicationCommandOptionType, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder } = require("discord.js");
const j2poncik = require("../../../../../../Global/Settings/System");
const bannedTag = require("../../../../../../Global/Schemas/bannedTag");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const kanal = require("../../../../../../Global/Settings/AyarName");
const emojis = require("../../../../../../Global/Settings/Emojis.json");
const { normalizeTaglar, normalizeTagEntry, checkMemberBannedTag, sendBannedTagLog } = require("../../../../../../Global/Helpers/BannedTagHelper");

module.exports = {
    name: "yasaklıtag",
    description: "Belirttiğiniz tagı yasaklıya ekler",
    category: "OWNER",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["yasaklı-tag","ytag","y-tag"],
      usage: ".yasaklıtag [ekle/liste/kaldır/kontrol/tara/tlist]", 
    },
  
    onLoad: function (client) {
        // Yasaklı Tag Buton ve Modal Handler'ları
        client.on(Events.InteractionCreate, async (interaction) => {
            // Buton Handler'ları
            if (interaction.isButton() && interaction.customId && interaction.customId.startsWith('tag_')) {
                try {
                    // Yetki kontrolü
                    if (!interaction.member || !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                        return await interaction.reply({ content: `${emojis.server_carpi} Bu işlem için **Administrator** yetkisine sahip olmanız gerekiyor!`, ephemeral: true });
                    }
                    
                    if (interaction.customId === 'tag_ekle_guild') {
                        const modal = new ModalBuilder()
                            .setCustomId('tag_ekle_modal_guild')
                            .setTitle('Yasaklı Guild Tag Ekle');
                        const tagInput = new TextInputBuilder()
                            .setCustomId('tag_input')
                            .setLabel('Sunucu ID (guild tag için)')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Yasaklanacak sunucunun ID\'si')
                            .setRequired(true)
                            .setMaxLength(50);
                        modal.addComponents(new ActionRowBuilder().addComponents(tagInput));
                        await interaction.showModal(modal);
                        return;
                    }
                    if (interaction.customId === 'tag_ekle_isim') {
                        const modal = new ModalBuilder()
                            .setCustomId('tag_ekle_modal_isim')
                            .setTitle('Yasaklı İsim Tag Ekle');
                        const tagInput = new TextInputBuilder()
                            .setCustomId('tag_input')
                            .setLabel('Yasaklanacak metin (isimde geçen)')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Örn: #, *, +, test')
                            .setRequired(true)
                            .setMaxLength(50);
                        modal.addComponents(new ActionRowBuilder().addComponents(tagInput));
                        await interaction.showModal(modal);
                        return;
                    }
                    if (interaction.customId === 'tag_sil') {
                        const data = await bannedTag.findOne({ guildID: interaction.guild.id });
                        const yasakliTaglar = data?.taglar || [];
                        if (yasakliTaglar.length === 0) {
                            return await interaction.reply({ content: `${emojis.server_carpi} Silinecek tag bulunamadı!`, ephemeral: true });
                        }
                        const normalized = normalizeTaglar(yasakliTaglar);
                        const select = new StringSelectMenuBuilder()
                            .setCustomId('tag_sil_select')
                            .setPlaceholder('Silinecek tagı seçin...')
                            .setMinValues(1)
                            .setMaxValues(1);
                        normalized.forEach((e, i) => {
                            select.addOptions([{ label: `${e.value.length > 90 ? e.value.slice(0, 87) + "..." : e.value} [${e.type}]`, value: String(i) }]);
                        });
                        const row = new ActionRowBuilder().addComponents(select);
                        return await interaction.reply({ content: `${emojis.server_info} Silinecek yasaklı tagı seçin:`, components: [row], ephemeral: true });
                    }
                    
                    if (interaction.customId === 'tag_yenile') {
                        await interaction.deferUpdate();
                        
                        try {
                            const data = await bannedTag.findOne({ guildID: interaction.guild.id });
                            const yasakliTaglar = data?.taglar || [];
                            
                            if (yasakliTaglar.length === 0) {
                                return await interaction.editReply({ content: `${emojis.server_info} Yasaklı tag listesi boş.`, components: [] });
                            }
                            
                            let members = interaction.guild.members.cache;
                            if (members.size === 0) {
                                members = await interaction.guild.members.fetch({ limit: 0 });
                            }
                            
                            const config = j2ponm.ForbiddenTagConfig || {};
                            const normalized = normalizeTaglar(yasakliTaglar);
                            const mainEmbed = new EmbedBuilder()
                                .setTitle('📋 Yasaklı Tag Listesi ve Etkilenen Üyeler')
                                .setColor(0xFF0000)
                                .setTimestamp()
                                .setFooter({ text: `${interaction.guild.name} • Toplam ${normalized.length} yasaklı tag`, iconURL: interaction.guild.iconURL() });
                            const embeds = [mainEmbed];
                            for (const entry of normalized) {
                                const etkilenenUyeler = [];
                                for (const [, member] of members) {
                                    const r = await checkMemberBannedTag(client, member, yasakliTaglar, config);
                                    if (r.has && r.found && r.found.value === entry.value && r.found.type === entry.type) {
                                        etkilenenUyeler.push({ tag: member.user.tag, id: member.user.id, mention: member.user.toString() });
                                    }
                                }
                                let fieldValue = `**Etkilenen Üye Sayısı:** ${etkilenenUyeler.length}\n\n`;
                                if (etkilenenUyeler.length > 0) {
                                    const etiketler = etkilenenUyeler.slice(0, 20).map(u => u.mention).join(' ');
                                    if (etiketler.length > 0) {
                                        fieldValue += `**Üyeler:**\n${etiketler}`;
                                        if (etkilenenUyeler.length > 20) fieldValue += `\n*ve ${etkilenenUyeler.length - 20} kişi daha*`;
                                        fieldValue += '\n\n';
                                    }
                                    const idler = etkilenenUyeler.map(u => u.id).join(', ');
                                    fieldValue += idler.length <= 1000 ? `**ID'ler:**\n\`${idler}\`` : `**ID'ler (ilk ${Math.floor(1000 / 20)}):**\n\`${etkilenenUyeler.slice(0, Math.floor(1000 / 20)).map(u => u.id).join(', ')}...\`\n*ve ${etkilenenUyeler.length - Math.floor(1000 / 20)} ID daha*`;
                                } else {
                                    fieldValue += `✅ Bu tag'a sahip üye bulunamadı.`;
                                }
                                let currentEmbed = embeds[embeds.length - 1];
                                if (currentEmbed.data.fields && currentEmbed.data.fields.length >= 25) {
                                    currentEmbed = new EmbedBuilder().setTitle('📋 Yasaklı Tag Listesi (Devam)').setColor(0xFF0000).setTimestamp();
                                    embeds.push(currentEmbed);
                                }
                                currentEmbed.addFields({ name: `Tag: \`${entry.value}\` [${entry.type}]`, value: fieldValue, inline: false });
                            }
                            const tagEkleGuildButon = new ButtonBuilder().setCustomId('tag_ekle_guild').setLabel('Guild Tag Ekle').setStyle(ButtonStyle.Success).setEmoji(emojis.appEmoji_ekle);
                            const tagEkleIsimButon = new ButtonBuilder().setCustomId('tag_ekle_isim').setLabel('İsim Tag Ekle').setStyle(ButtonStyle.Success).setEmoji(emojis.appEmoji_ekle);
                            const tagSilButon = new ButtonBuilder().setCustomId('tag_sil').setLabel('Tag Sil').setStyle(ButtonStyle.Danger).setEmoji(emojis.appEmoji_cop);
                            
                            const tagYenileButon = new ButtonBuilder()
                                .setCustomId('tag_yenile')
                                .setLabel('Yenile')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji(emojis.server_loading);
                            
                            const tagListeButon = new ButtonBuilder()
                                .setCustomId('tag_liste')
                                .setLabel('Liste')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji(emojis.server_info);
                            
                            const row = new ActionRowBuilder()
                                .addComponents(tagEkleGuildButon, tagEkleIsimButon, tagSilButon, tagYenileButon, tagListeButon);
                            
                            await interaction.editReply({ embeds: embeds.slice(0, 10), components: [row] });
                        } catch (error) {
                            console.error('Yenileme hatası:', error);
                            await interaction.editReply({ content: `${emojis.server_carpi} Bir hata oluştu!`, components: [] });
                        }
                        return;
                    }
                    
                    if (interaction.customId === 'tag_liste') {
                        const data = await bannedTag.findOne({ guildID: interaction.guild.id });
                        const yasakliTaglar = data?.taglar || [];
                        if (yasakliTaglar.length === 0) return await interaction.reply({ content: `${emojis.server_info} Yasaklı tag listesi boş.`, ephemeral: true });
                        const normalized = normalizeTaglar(yasakliTaglar);
                        const tagList = normalized.map(e => `\`${e.value}\` [${e.type}]`).join(', ');
                        const embed = new EmbedBuilder()
                            .setTitle('📋 Yasaklı Tag Listesi')
                            .setDescription(tagList)
                            .setColor(0xFF0000)
                            .setFooter({ text: `Toplam ${normalized.length} tag (guild + isim)` });
                        await interaction.reply({ embeds: [embed], ephemeral: true });
                        return;
                    }
                } catch (error) {
                    console.error('Yasaklı Tag Buton Hatası:', error);
                    try {
                        if (interaction.deferred || interaction.replied) {
                            await interaction.followUp({ content: `${emojis.server_carpi} Bir hata oluştu!`, ephemeral: true });
                        } else {
                            await interaction.reply({ content: `${emojis.server_carpi} Bir hata oluştu!`, ephemeral: true });
                        }
                    } catch (replyError) {
                        console.error('Buton hata mesajı gönderilemedi:', replyError);
                    }
                }
            }
            
            // Modal Handler'ları
            if (interaction.isModalSubmit() && interaction.customId && interaction.customId.startsWith('tag_')) {
                try {
                    if (!interaction.member || !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                        return await interaction.reply({ content: `${emojis.server_carpi} Bu işlem için **Administrator** yetkisine sahip olmanız gerekiyor!`, ephemeral: true });
                    }
                    
                    if (interaction.customId === 'tag_ekle_modal_guild' || interaction.customId === 'tag_ekle_modal_isim') {
                        const value = interaction.fields.getTextInputValue('tag_input').trim();
                        if (!value) return await interaction.reply({ content: `${emojis.server_carpi} Değer boş olamaz!`, ephemeral: true });
                        const type = interaction.customId === 'tag_ekle_modal_guild' ? 'guild' : 'isim';
                        const data = await bannedTag.findOne({ guildID: interaction.guild.id });
                        const yasakliTaglar = data?.taglar || [];
                        const norm = normalizeTaglar(yasakliTaglar);
                        const exists = norm.some(e => e.value === value && e.type === type);
                        if (exists) return await interaction.reply({ content: `${emojis.server_carpi} \`${value}\` [${type}] zaten yasaklı tag listesinde!`, ephemeral: true });
                        const entry = { value, type };
                        if (data) {
                            data.taglar.push(entry);
                            await data.save();
                        } else {
                            await bannedTag.create({ guildID: interaction.guild.id, taglar: [entry] });
                        }
                        await interaction.reply({ content: `${emojis.server_onay} \`${value}\` [${type}] yasaklı tag listesine eklendi!`, ephemeral: true });
                        return;
                    }
                } catch (error) {
                    console.error('Yasaklı Tag Modal Hatası:', error);
                    try {
                        if (interaction.deferred || interaction.replied) {
                            await interaction.followUp({ content: `${emojis.server_carpi} Bir hata oluştu!`, ephemeral: true });
                        } else {
                            await interaction.reply({ content: `${emojis.server_carpi} Bir hata oluştu!`, ephemeral: true });
                        }
                    } catch (replyError) {
                        console.error('Modal hata mesajı gönderilemedi:', replyError);
                    }
                }
            }

            if (interaction.isStringSelectMenu() && interaction.customId === 'tag_sil_select') {
                try {
                    if (!interaction.member?.permissions.has(PermissionsBitField.Flags.Administrator)) {
                        return await interaction.reply({ content: `${emojis.server_carpi} Bu işlem için **Administrator** yetkisine sahip olmanız gerekiyor!`, ephemeral: true });
                    }
                    const index = parseInt(interaction.values[0], 10);
                    if (isNaN(index) || index < 0) return await interaction.reply({ content: `${emojis.server_carpi} Geçersiz seçim.`, ephemeral: true });
                    const data = await bannedTag.findOne({ guildID: interaction.guild.id });
                    if (!data || !data.taglar || index >= data.taglar.length) {
                        return await interaction.reply({ content: `${emojis.server_carpi} Tag bulunamadı!`, ephemeral: true });
                    }
                    const removed = data.taglar[index];
                    const removedVal = normalizeTagEntry(removed);
                    data.taglar.splice(index, 1);
                    await data.save();
                    await interaction.reply({ content: `${emojis.server_onay} \`${removedVal ? removedVal.value : removed}\` yasaklı tag listesinden silindi!`, ephemeral: true });
                } catch (e) {
                    console.error('Tag sil select hatası:', e);
                    if (!interaction.replied && !interaction.deferred) await interaction.reply({ content: `${emojis.server_carpi} Bir hata oluştu!`, ephemeral: true });
                }
            }
        });
    },

    onCommand: async function (client, message, args, byj2ponembed) {

let kanallar = kanal.KomutKullanımKanalİsim || [];
const canUseHereBT =
  message.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
  (kanal.isAllowedCommandChannel
    ? kanal.isAllowedCommandChannel(message.channel.name)
    : kanallar.includes(message.channel.name));
if (!canUseHereBT) {
  const allowedText = kanal.formatAllowedChannels
    ? kanal.formatAllowedChannels(client)
    : kanallar
        .map((x) => {
          const found = client.channels.cache.find(
            (chan) => chan.name && chan.name === x
          );
          return found ? `${found}` : `\`${x}\``;
        })
        .join(", ");
  return message
    .reply({
      content: `${allowedText} kanallarında kullanabilirsiniz.`,
    })
    .then((e) => setTimeout(() => { e.delete(); }, 10000));
} 

    if(!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return

    if(!args[0]) { message.reply({embeds: [byj2ponembed.setTitle(`Yanlış Kullanım!`).setDescription(`.yasaklıtag ekle/kaldır/liste/kontrol/tara/tlist`)]}).then((e) => setTimeout(() => { e.delete(); }, 5000));
    return }

    const data = await bannedTag.findOne({ guildID: j2poncik.ServerID });

    // !ekle - Menü açılır, form ile ekleme | !ekle guild/id isim <değer> - Doğrudan ekleme
    if (args[0] == "ekle") {
      if (!args[1] || !args[2]) {
        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL() })
          .setTitle(`${emojis.appEmoji_ekle} Yasaklı Tag Ekle`)
          .setDescription(`${emojis.server_info} Aşağıdaki butonlardan **eklemek istediğiniz tag türünü** seçin. Açılan formu doldurarak yasaklı tag ekleyebilirsiniz.\n\n${emojis.server_nokta} **Guild Tag:** Belirli bir sunucunun tag'ını kullananlara işlenir (Sunucu ID girilir).\n${emojis.server_nokta} **İsim Tag:** Kullanıcı adı/rumuzda geçen metne göre yasaklar.`)
          .setFooter({ text: "Formu doldurup gönderin", iconURL: message.author.displayAvatarURL() })
          .setTimestamp();
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder().setCustomId("tag_ekle_guild").setLabel("Guild Tag Ekle").setStyle(ButtonStyle.Success).setEmoji(emojis.appEmoji_ekle),
            new ButtonBuilder().setCustomId("tag_ekle_isim").setLabel("İsim Tag Ekle").setStyle(ButtonStyle.Success).setEmoji(emojis.appEmoji_ekle)
          );
        return message.reply({ embeds: [embed], components: [row] });
      }
      const type = args[1].toLowerCase() === "guild" ? "guild" : "isim";
      const value = args.slice(2).join(" ").trim();
      if (!value) return message.reply({ content: `${emojis.server_carpi} Tag değeri boş olamaz.` });
      const forbiddenTagRoleId = Array.isArray(j2ponm.ForbiddenTagRoles) ? j2ponm.ForbiddenTagRoles[0] : j2ponm.ForbiddenTagRoles;
      const config = j2ponm.ForbiddenTagConfig || {};
      const norm = normalizeTaglar(data?.taglar || []);
      if (norm.some(e => e.value === value && e.type === type)) return message.reply({ content: `${emojis.server_carpi} \`${value}\` [${type}] zaten yasaklı tag listesinde.` });
      const entry = { value, type };
      const targetGuildId = j2poncik.ServerID || message.guild.id;
      if (!data) {
          await bannedTag.create({ guildID: targetGuildId, taglar: [entry] }).catch(e => console.log(e));
      } else {
          data.taglar.push(entry);
          await data.save().catch(e => console.log(e));
      }
      const tag = value;
      
      let members = message.guild.members.cache;
      if (members.size === 0) members = await message.guild.members.fetch({ limit: 0 });
      const etkilenenUyeler = [];
      const fullData = await bannedTag.findOne({ guildID: targetGuildId });
      const taglarForCheck = fullData?.taglar || [];
      for (const [, member] of members) {
          const r = await checkMemberBannedTag(client, member, taglarForCheck, config);
          if (r.has && r.found && r.found.value === value && r.found.type === type && !member.roles.cache.has(forbiddenTagRoleId) && !member.roles.cache.has(j2ponm.BoosterRole)) {
              etkilenenUyeler.push(member);
          }
      }
      await message.reply({ content: `${emojis.server_onay} **${tag}** [${type}] için ${etkilenenUyeler.length} kişi bulundu, yasaklı tag rolü veriliyor.` });
      
      for (const member of etkilenenUyeler) {
          try {
              const kaldirilacakRoller = member.roles.cache
                  .filter(r => r.id !== member.guild.id && r.id !== forbiddenTagRoleId && r.editable)
                  .map(r => r);
              
              if (kaldirilacakRoller.length > 0) {
                  await member.roles.remove(kaldirilacakRoller);
              }
              
              await member.roles.add(forbiddenTagRoleId);
              await member.setNickname('Yasaklı Tag');
              sendBannedTagLog(client, member, { value: tag, type }, "yasaklıtag-ekle");
              
              member.send({ content:`${message.guild.name} adlı sunucumuza olan erişiminiz engellendi! Sunucumuzda yasaklı olan bir simgeyi (\`${tag}\`) isminizde taşımanızdan dolayıdır. Sunucuya erişim sağlamak için simgeyi (\`${tag}\`) isminizden çıkartmanız gerekmektedir.\n\nSimgeyi (\`${tag}\`) isminizden kaldırmanıza rağmen üstünüzde halen Yasaklı Tag rolü varsa sunucudan gir çık yapabilirsiniz veya sağ tarafta bulunan yetkililer ile iletişim kurabilirsiniz. **-Yönetim**\n\n__Sunucu Taglarımız__\n**${j2ponm.ServerTag.join ? j2ponm.ServerTag.join(', ') : j2ponm.ServerTag}**`}).catch(() => {});
          } catch (error) {
              console.error(`Rol verme hatası (${member.user.tag}):`, error.message);
          }
      }
  }

  // !tlist - Gelişmiş tag listesi (embed + butonlar)
  if (args[0] == "tlist") {
      if (!data || !data.taglar || data.taglar.length === 0) {
          return await message.reply({ content: `${emojis.server_info} Yasaklı tag listesi boş.` });
      }
      
      await message.reply({ content: `${emojis.server_loading} Yasaklı tag'lar ve etkilenen üyeler kontrol ediliyor...` });
      
      try {
          let members = message.guild.members.cache;
          if (members.size === 0) {
              members = await message.guild.members.fetch({ limit: 0 });
          }
          
          const config = j2ponm.ForbiddenTagConfig || {};
          const normalized = normalizeTaglar(data.taglar);
          const mainEmbed = new EmbedBuilder()
              .setTitle(`${emojis.server_info} Yasaklı Tag Listesi ve Etkilenen Üyeler`)
              .setColor(0xFF0000)
              .setTimestamp()
              .setFooter({ text: `${message.guild.name} • Toplam ${normalized.length} yasaklı tag`, iconURL: message.guild.iconURL() });
          const embeds = [mainEmbed];
          for (const entry of normalized) {
              const etkilenenUyeler = [];
              for (const [, member] of members) {
                  const r = await checkMemberBannedTag(client, member, data.taglar, config);
                  if (r.has && r.found && r.found.value === entry.value && r.found.type === entry.type) {
                      etkilenenUyeler.push({ tag: member.user.tag, id: member.user.id, mention: member.user.toString() });
                  }
              }
              let fieldValue = `**Etkilenen Üye Sayısı:** ${etkilenenUyeler.length}\n\n`;
              if (etkilenenUyeler.length > 0) {
                  const etiketler = etkilenenUyeler.slice(0, 20).map(u => u.mention).join(' ');
                  if (etiketler.length > 0) {
                      fieldValue += `**Üyeler:**\n${etiketler}`;
                      if (etkilenenUyeler.length > 20) fieldValue += `\n*ve ${etkilenenUyeler.length - 20} kişi daha*`;
                      fieldValue += '\n\n';
                  }
                  const idler = etkilenenUyeler.map(u => u.id).join(', ');
                  fieldValue += idler.length <= 1000 ? `**ID'ler:**\n\`${idler}\`` : `**ID'ler (ilk ${Math.floor(1000 / 20)}):**\n\`${etkilenenUyeler.slice(0, Math.floor(1000 / 20)).map(u => u.id).join(', ')}...\`\n*ve ${etkilenenUyeler.length - Math.floor(1000 / 20)} ID daha*`;
              } else {
                  fieldValue += `${emojis.server_onay} Bu tag'a sahip üye bulunamadı.`;
              }
              let currentEmbed = embeds[embeds.length - 1];
              if (currentEmbed.data.fields && currentEmbed.data.fields.length >= 25) {
                  currentEmbed = new EmbedBuilder().setTitle(`${emojis.server_info} Yasaklı Tag Listesi (Devam)`).setColor(0xFF0000).setTimestamp();
                  embeds.push(currentEmbed);
              }
              currentEmbed.addFields({ name: `Tag: \`${entry.value}\` [${entry.type}]`, value: fieldValue, inline: false });
          }
          const tagEkleGuildButon = new ButtonBuilder().setCustomId('tag_ekle_guild').setLabel('Guild Tag Ekle').setStyle(ButtonStyle.Success).setEmoji(emojis.appEmoji_ekle);
          const tagEkleIsimButon = new ButtonBuilder().setCustomId('tag_ekle_isim').setLabel('İsim Tag Ekle').setStyle(ButtonStyle.Success).setEmoji(emojis.appEmoji_ekle);
          const tagSilButon = new ButtonBuilder().setCustomId('tag_sil').setLabel('Tag Sil').setStyle(ButtonStyle.Danger).setEmoji(emojis.appEmoji_cop);
          const tagYenileButon = new ButtonBuilder().setCustomId('tag_yenile').setLabel('Yenile').setStyle(ButtonStyle.Primary).setEmoji(emojis.server_loading);
          const tagListeButon = new ButtonBuilder().setCustomId('tag_liste').setLabel('Liste').setStyle(ButtonStyle.Secondary).setEmoji(emojis.server_info);
          const row = new ActionRowBuilder()
              .addComponents(tagEkleGuildButon, tagEkleIsimButon, tagSilButon, tagYenileButon, tagListeButon);
          
          // Loading mesajını düzenle veya yeni mesaj gönder
          try {
              if (embeds.length <= 10) {
                  await loadingMsg.edit({ embeds: embeds, components: [row], content: null });
              } else {
                  for (let i = 0; i < embeds.length; i += 10) {
                      const embedBatch = embeds.slice(i, i + 10);
                      if (i === 0) {
                          await loadingMsg.edit({ embeds: embedBatch, components: [row], content: null });
                      } else {
                          await message.channel.send({ embeds: embedBatch });
                      }
                  }
              }
          } catch (error) {
              // Edit başarısız olursa yeni mesaj gönder
              if (embeds.length <= 10) {
                  await message.channel.send({ embeds: embeds, components: [row] });
              } else {
                  for (let i = 0; i < embeds.length; i += 10) {
                      const embedBatch = embeds.slice(i, i + 10);
                      if (i === 0) {
                          await message.channel.send({ embeds: embedBatch, components: [row] });
                      } else {
                          await message.channel.send({ embeds: embedBatch });
                      }
                  }
              }
          }
      } catch (error) {
          console.error('Tlist hatası:', error);
          message.reply(`${emojis.server_carpi} Bir hata oluştu!`);
      }
  }

  if (args[0] == "liste" && !args[1]) {
      if (!data || !data.taglar || data.taglar.length === 0) return await message.reply({ content: `${emojis.server_info} Sunucuda yasaklanmış tag bulunmamakta.` });
      const normalized = normalizeTaglar(data.taglar);
      let num = 1;
      const arrs = normalized.map(e => `\`${num++}.\` ${e.value} [${e.type}]`);
      await message.reply({ content: `${emojis.server_info} **Yasaklı Tag Listesi:**\n${arrs.join("\n")}\n\n${emojis.server_nokta} Detaylı liste için \`.yasaklıtag tlist\` komutunu kullanabilirsiniz.` });
  }

  // !liste üye <tag> - Belirli bir tag'a sahip üyeleri listele
  if (args[0] == "liste" && args[1] == "üye") {
      if (!args[2]) {
          return await message.reply({ content: `${emojis.server_carpi} Üyelerini listelemek istediğin yasaklı tagı belirtmelisin.` });
      }
      if (!data || !data.taglar || data.taglar.length === 0) {
          return await message.reply({ content: `${emojis.server_info} Veritabanında listelenecek yasaklı tag bulunmuyor.` });
      }
      const searchValue = args[2];
      const normalized = normalizeTaglar(data.taglar);
      const hasEntry = normalized.some(e => e.value === searchValue);
      if (!hasEntry) {
          return await message.reply({ content: `${emojis.server_carpi} Yasaklı tag listesinde \`${searchValue}\` bulunmuyor. Mevcut: ${normalized.map(e => `\`${e.value}\` [${e.type}]`).join(", ")}` });
      }
      const config = j2ponm.ForbiddenTagConfig || {};
      let members = message.guild.members.cache;
      if (members.size === 0) members = await message.guild.members.fetch({ limit: 0 });
      const etkilenenUyeler = [];
      for (const [, member] of members) {
          const r = await checkMemberBannedTag(client, member, data.taglar, config);
          if (r.has && r.found && r.found.value === searchValue) etkilenenUyeler.push(member);
      }
      
      const üyeler = etkilenenUyeler.map(x => "<@" + x.id + "> - (`" + x.id + "`)");
      const üyelerk = etkilenenUyeler.map(x => x.user.displayName + " - (`" + x.id + "`)");
      let text = üyeler.join("\n");
      let texto = üyelerk.join("\n");
      
      if (text.length > 2000) {
          await message.channel.send({ 
              content:"Sunucuda çok fazla yasaklı (" + searchValue + ") taga ait kişi var bu yüzden txt olarak göndermek zorundayım.", 
              files: [{ attachment: Buffer.from(texto), name: "yasakli-tagdakiler.txt" }] 
          });
      } else {
          await message.channel.send({ content: text || `${emojis.server_onay} Bu tag'a sahip üye bulunamadı.` });
      }
  }

  if (args[0] == "kaldır") {
      if (!data || !data.taglar.length) return await message.reply({ content: `${emojis.server_info} Veritabanında kaldırılacak yasaklı tag bulunmuyor.` });
      const valueToRemove = args[1];
      const typeToRemove = (args[2] && (args[2].toLowerCase() === "guild" || args[2].toLowerCase() === "isim")) ? args[2].toLowerCase() : null;
      const normalized = normalizeTaglar(data.taglar);
      const exists = typeToRemove ? normalized.some(e => e.value === valueToRemove && e.type === typeToRemove) : normalized.some(e => e.value === valueToRemove);
      if (!exists) return await message.reply({ content: `${emojis.server_carpi} Belirttiğin tag yasaklı tag listesinde bulunmuyor.` });
      const entriesToRemove = typeToRemove
          ? normalized.filter(e => e.value === valueToRemove && e.type === typeToRemove)
          : normalized.filter(e => e.value === valueToRemove);
      const taglarToCheck = entriesToRemove.map(e => ({ value: e.value, type: e.type }));
      let üyeler = [];
      const config = j2ponm.ForbiddenTagConfig || {};
      const members = message.guild.members.cache.size > 0 ? message.guild.members.cache : await message.guild.members.fetch();
      for (const [, member] of members) {
          const r = await checkMemberBannedTag(client, member, taglarToCheck, config);
          if (r.has && r.found && taglarToCheck.some(e => e.value === r.found.value && e.type === r.found.type)) üyeler.push(member);
      }
      data.taglar = data.taglar.filter((raw) => {
          const e = normalizeTagEntry(raw);
          if (!e) return true;
          return !entriesToRemove.some(rem => rem.value === e.value && rem.type === e.type);
      });
      await data.save().catch(e => console.log(e));
      await message.reply({ content: `${emojis.server_onay} **${valueToRemove}**${typeToRemove ? " [" + typeToRemove + "]" : ""} tagı kaldırıldı. ${üyeler.length} kişiden yasaklı tag rolü alınıyor.` });
      const forbiddenTagRoleId = Array.isArray(j2ponm.ForbiddenTagRoles) ? j2ponm.ForbiddenTagRoles[0] : j2ponm.ForbiddenTagRoles;
      const unRegisteredRoles = Array.isArray(j2ponm.UnRegisteredRoles) ? j2ponm.UnRegisteredRoles : [j2ponm.UnRegisteredRoles];
      
      for (const member of üyeler) {
          try {
              await member.setNickname(`${j2ponm.ServerUntagged} Kayıtsız`);
              
              // Yasaklı tag rolünü kaldır
              if (member.roles.cache.has(forbiddenTagRoleId)) {
                  await member.roles.remove(forbiddenTagRoleId);
              }
              
              // Tüm rolleri kaldır (@everyone hariç, booster varsa koru)
              const mevcutRoller = member.roles.cache.filter(r => r.id !== member.guild.id);
              const kaldirilacakRoller = [];
              
              for (const role of mevcutRoller.values()) {
                  // Booster rolünü koru
                  if (role.id === j2ponm.BoosterRole) continue;
                  // UnRegisteredRoles'u koru
                  if (unRegisteredRoles.includes(role.id)) continue;
                  // Diğer tüm rolleri kaldır
                  if (role.editable) {
                      kaldirilacakRoller.push(role);
                  }
              }
              
              if (kaldirilacakRoller.length > 0) {
                  await member.roles.remove(kaldirilacakRoller);
              }
              
              // UnRegisteredRoles'u ekle (yoksa)
              for (const roleId of unRegisteredRoles) {
                  if (!member.roles.cache.has(roleId)) {
                      await member.roles.add(roleId);
                  }
              }
              
              member.send({ content: `${message.guild.name} adlı sunucumuza olan erişim engeliniz kalktı. Yasaklı tag (\`${valueToRemove}\`${typeToRemove ? " [" + typeToRemove + "]" : ""}) kaldırıldığı için sunucumuza erişim hakkı kazandınız. Keyifli Sohbetler **-Yönetim**` }).catch(() => {});
          } catch (error) {
              console.error(`Rol kaldırma hatası (${member.user.tag}):`, error.message);
          }
      }
  }

  // !tara - Tüm sunucuyu tara
  if (args[0] == "tara") {
      if (!data || !data.taglar || data.taglar.length === 0) {
          return await message.reply({ content: `${emojis.server_carpi} Veritabanında yasaklı tag bulunmuyor.` });
      }
      
      const forbiddenTagRoleId = Array.isArray(j2ponm.ForbiddenTagRoles) ? j2ponm.ForbiddenTagRoles[0] : j2ponm.ForbiddenTagRoles;
      if (!forbiddenTagRoleId) {
          return await message.reply({ content: `${emojis.server_carpi} ForbiddenTagRoles config dosyasında tanımlı değil!` });
      }
      
      const loadingMsg = await message.reply({ content: `${emojis.server_loading} Sunucu taranıyor...` });
      
      console.log(`\n🔍 Sunucu taranıyor: ${message.guild.name}`);
      let toplamKontrol = 0;
      let yasakliBulundu = 0;
      const hasGuildTypeTag = (data.taglar || []).some(t => (t && t.type === "guild") || (typeof t === "object" && t.type === "guild"));
      const GUILD_CHECK_DELAY_MS = 350;
      
      try {
          const members = await message.guild.members.fetch();
          const config = j2ponm.ForbiddenTagConfig || {};
          const memberList = [...members.values()];
          for (let i = 0; i < memberList.length; i++) {
              if (hasGuildTypeTag && i > 0) await new Promise(r => setTimeout(r, GUILD_CHECK_DELAY_MS));
              const member = memberList[i];
              toplamKontrol++;
              const { has: hasBannedTag } = await checkMemberBannedTag(client, member, data.taglar, config);
              if (hasBannedTag && !member.roles.cache.has(j2ponm.BoosterRole)) {
                  yasakliBulundu++;
                  const kaldirilacakRoller = member.roles.cache
                      .filter(r => r.id !== member.guild.id && r.id !== forbiddenTagRoleId && r.editable)
                      .map(r => r);
                  
                  if (kaldirilacakRoller.length > 0) {
                      try {
                          await member.roles.remove(kaldirilacakRoller);
                      } catch (error) {
                          console.error(`Rol kaldırma hatası (${member.user.tag}):`, error.message);
                      }
                  }
                  
                  if (!member.roles.cache.has(forbiddenTagRoleId)) {
                      await member.roles.add(forbiddenTagRoleId).catch();
                  }
              } else if (!hasBannedTag && member.roles.cache.has(forbiddenTagRoleId) && !member.roles.cache.has(j2ponm.BoosterRole)) {
                  await member.roles.remove(forbiddenTagRoleId).catch();
              }
          }
          
          console.log(`\n✅ Tarama tamamlandı!`);
          console.log(`📊 Toplam kontrol: ${toplamKontrol}`);
          console.log(`⚠️  Yasaklı tag bulunan: ${yasakliBulundu}`);
          
          await loadingMsg.edit({ content: `${emojis.server_onay} Tarama tamamlandı!\n${emojis.server_info} Toplam kontrol: ${toplamKontrol}\n${emojis.server_carpi} Yasaklı tag bulunan: ${yasakliBulundu}` });
      } catch (error) {
          console.error('Tarama hatası:', error);
          try {
              await loadingMsg.edit({ content: `${emojis.server_carpi} Tarama sırasında bir hata oluştu: ${error.message}` });
          } catch (_) {
              await message.reply({ content: `${emojis.server_carpi} Tarama sırasında bir hata oluştu!` });
          }
      }
  }

  // !kontrol @kullanıcı - Belirli bir kullanıcıyı kontrol et
  if (args[0] == "kontrol" && args[1]) {
      if (!data || !data.taglar || data.taglar.length === 0) {
          return await message.reply({ content: `${emojis.server_carpi} Veritabanında yasaklı tag bulunmuyor.` });
      }
      
      const target = message.mentions.members.first() || message.guild.members.cache.get(args[1]);
      if (!target) {
          return await message.reply({ content: `${emojis.server_carpi} Lütfen bir kullanıcı etiketleyin veya ID girin!` });
      }
      
      const forbiddenTagRoleId = Array.isArray(j2ponm.ForbiddenTagRoles) ? j2ponm.ForbiddenTagRoles[0] : j2ponm.ForbiddenTagRoles;
      if (!forbiddenTagRoleId) {
          return await message.reply({ content: `${emojis.server_carpi} ForbiddenTagRoles config dosyasında tanımlı değil!` });
      }
      
      const config = j2ponm.ForbiddenTagConfig || {};
      const { has: hasBannedTag, found: foundEntry } = await checkMemberBannedTag(client, target, data.taglar, config);
      const foundTag = foundEntry ? `${foundEntry.value} [${foundEntry.type}]` : null;
      if (hasBannedTag && !target.roles.cache.has(j2ponm.BoosterRole)) {
          const kaldirilacakRoller = target.roles.cache
              .filter(r => r.id !== target.guild.id && r.id !== forbiddenTagRoleId && r.editable)
              .map(r => r);
          
          if (kaldirilacakRoller.length > 0) {
              try {
                  await target.roles.remove(kaldirilacakRoller);
              } catch (error) {
                  console.error(`Rol kaldırma hatası:`, error.message);
              }
          }
          
          if (!target.roles.cache.has(forbiddenTagRoleId)) {
              await target.roles.add(forbiddenTagRoleId).catch();
          }
          await target.setNickname('Yasaklı Tag').catch();
          
          await message.reply({ content: `${emojis.server_carpi} ${target.user.tag} kullanıcısında yasaklı tag bulundu! (Tag: ${foundTag}) Rol verildi.` });
      } else if (!hasBannedTag) {
          if (target.roles.cache.has(forbiddenTagRoleId) && !target.roles.cache.has(j2ponm.BoosterRole)) {
              await target.roles.remove(forbiddenTagRoleId).catch();
          }
          await message.reply({ content: `${emojis.server_onay} ${target.user.tag} kullanıcısında yasaklı tag bulunamadı.` });
      } else {
          await message.reply({ content: `${emojis.server_onay} ${target.user.tag} kullanıcısı booster olduğu için işlem yapılmadı.` });
      }
  }

  if (args[0] == "kontrol" && !args[1]) {
      if (!data || !data.taglar || data.taglar.length === 0) {
          return await message.reply({ content: `${emojis.server_info} Veritabanında kontrol edilecek yasaklı tag bulunmuyor.` });
      }
      return await message.reply({ content: `${emojis.server_info} Tüm sunucuyu taramak için \`.yasaklıtag tara\` komutunu kullanın.\nBelirli bir kullanıcıyı kontrol etmek için \`.yasaklıtag kontrol @kullanıcı\` komutunu kullanın.` });
  }
     },

  };