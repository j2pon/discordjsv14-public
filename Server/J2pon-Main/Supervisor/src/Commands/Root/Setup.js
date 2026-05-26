  const {ComponentType, ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, interactionBuilder, ChannelType, ButtonStyle,PermissionFlagsBits,ChannelSelectMenuBuilder, PermissionsBitField, RoleSelectMenuBuilder } = require("discord.js");
  const settings = require("../../../../../../Global/Settings/Setup.json");
  const { logs, emojis, emojis2,emojis3, emojis4, roles } = require("../../../../../../Global/Settings/AyarName");
  const {ok, red} = require("../../../../../../Global/Settings/Emojis.json");
  const system = require("../../../../../../Global/Settings/System");
  const { JsonDatabase } = require('../../../../../../Global/Helpers/JsonDB');
  const byj2pon = (global.j2ponDB = new JsonDatabase({ Path: "./../../../Global/Settings/Setup.json"}));
  const db = (global.j2ponDB = new JsonDatabase({ Path: "./../../../Global/Settings/Emojis.json"}));
  const children = require("child_process");

  module.exports = {
    name: "setup",
    description: "Botu Kurarsınız",
    category: "OWNER",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["kur"],
      usage: ".setup",
    },

    onLoad: function (client) { },

    onCommand: async function (client, message, args) {

      let choose = args[0]

      // Emoji senkronizasyonu: önce Emojis.json içindeki ID -> sonra isim -> yoksa oluştur.
      const extractEmojiId = (value) => {
        if (!value || typeof value !== "string") return null;
        const match = value.match(/:(\d+)>/);
        return match ? match[1] : null;
      };

      const resolveEmojiFromConfigOrName = async (guild, emojiName) => {
        // 1) Dosyadaki kayıtlı ID ile bul
        const stored = db.get(emojiName);
        const storedId = extractEmojiId(stored);
        if (storedId) {
          const byId = guild.emojis.cache.get(storedId);
          if (byId) return byId;
        }
        // 2) İsim ile bul (case-insensitive)
        return guild.emojis.cache.find((e) => e?.name && e.name.toLowerCase() === String(emojiName).toLowerCase()) || null;
      };

      const axios = require("axios");

      const syncEmoji = async (guild, element) => {
        const key = element?.name;
        if (!key) return { status: "error", reason: "missing_name" };

        const stored = db.get(key);
        const existing = await resolveEmojiFromConfigOrName(guild, key);

        if (existing) {
          const newValue = existing.toString();
          if (stored !== newValue) {
            await db.set(key, newValue);
            return { status: "updated", emoji: existing };
          }
          return { status: "kept", emoji: existing };
        }

        if (!element?.url) return { status: "error", reason: "missing_url" };

        try {
          const response = await axios.get(element.url, { responseType: 'arraybuffer' });
          const buffer = Buffer.from(response.data);
          const created = await guild.emojis.create({ name: key, attachment: buffer });
          await db.set(key, created.toString());
          return { status: "created", emoji: created };
        } catch (error) {
          console.error(`Emoji indirme/yükleme hatası (${key}):`, error);
          return { status: "error", reason: error.message };
        }
      };

      if(!choose) wait = await message.reply({ content: `Veriler Çekiliyor Lütfen Bekleyiniz..` })

      const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('j2ponlan')
          .setPlaceholder(`1. Bot Kurulum`)
          .addOptions([
            { label: 'Kayıt Kurulum', description: 'Kayıt rol & kanallarını kurarsınız.', value: 'ServerRegister', emoji: '📑'},
            { label: 'Moderasyon Kurulum', description: 'Moderasyon rol & kanallarını kurarsınız.', value: 'ServerModeration', emoji: '⚒️' },
          ]),
      );


      const row2 = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('j2ponlan2')
          .setPlaceholder(`2. Bot Kurulum`)
          .addOptions([
            { label: 'Log Kurulum', description: 'Log kanallarını kurarsınız.', value: 'ServerLog', emoji: '📑' },
            { label: 'Emoji Kurulum', description: 'Emojileri kurarsınız.', value: 'ServerEmoji', emoji: '☺️' },
            { label: 'Menü Rol Kurulum', description: 'Etkinlik Rollerini kurarsınız.', value: 'ServerMenu', emoji: '✨' },
            { label: 'Menü Emojiler Kurulum', description: 'Etkinlik Emojilerini kurarsınız.', value: 'ServerEmoji2', emoji: '📑' },
            { label: 'Özel Oda Emojiler Kurulum', description: 'Özel Oda Emojilerini kurarsınız.', value: 'ServerEmoji3', emoji: '📑' },
            { label: 'Destek Logları Kurulum', description: 'Destek Loglarını kurarsınız. (En Son Yapınız)', value: 'ServerLog2', emoji: '📑' },
            { label: 'Emojileri Sil', description: 'Botun Emojileri Silersiniz', value: 'ServerEmoji4', emoji: '📑' },
            { label: 'Botları Yeniden Başlat', description: 'Botları yeniden başlatırsınız.', value: 'ServerRestart', emoji: '✨' },
          ]),
      );
      

      if(!choose) {
      const embed = new EmbedBuilder()
      .setThumbnail(message.guild.iconURL({ dynamic: true, size: 2048 }))
      .setColor("Random")
      .setDescription(`${message.author.toString()}, **${message.guild.name}** sunucususu içerisinde <t:${Math.floor(Date.now() / 1000)}:R>'den itibaren sunucu kurulum komutları hakkında bilgilendirme almak için aşağıdaki butonları kullanabilirsiniz.`)
      .setFooter({
      text: `Not: Kurulumu yaptıktan sonra botu yeniden başlatmayı unutmayınız.`,
      })
    
      let msg = await wait.edit({content: `` , embeds: [embed], components: [row, row2] })
      const filter = i => i.user.id == message.author.id    
      let collector = await msg.createMessageComponentCollector({ filter, time: 90000 })
    
      collector.on("collect", async (interaction) => {
      
      if (interaction.values[0] === "ServerRegister") {
      const embed = new EmbedBuilder()
      .setDescription(`
      \`\`\`fix\nSUNUCU\`\`\`
      (\`ID 1\`) Tag: (\`${settings.ServerTag.length > 0 ? `${settings.ServerTag.map(x => `${x}`).join(",")}` : "\`YOK\`"}\`) 
      (\`ID 2\`) SecondTag: (\`${settings.ServerUntagged ? settings.ServerUntagged : "\`YOK\`"}\`) 
      (\`ID 3\`) Link: (\`${settings.ServerVanityURL ? settings.ServerVanityURL : "\`YOK\`"}\`)
      
      \`\`\`fix\nROLLER\`\`\`
      (\`ID 4\`) Erkek Rolleri: (${settings.ManRoles.length > 0 ? `${settings.ManRoles.map(x => `<@&${x}>`).join(",")}` : "\`YOK\`"})
      (\`ID 5\`) Kadın Rolleri: (${settings.GirlRoles.length > 0 ? `${settings.GirlRoles.map(x => `<@&${x}>`).join(",")}` : "\`YOK\`"})
      (\`ID 6\`) Kayıtsız Rolleri: (${settings.UnRegisteredRoles.length > 0 ? `${settings.UnRegisteredRoles.map(x => `<@&${x}>`).join(",")}` : "\`YOK\`"})
      (\`ID 7\`) Ekip Rolü: (${settings.TaggedRole ? `<@&${settings.TaggedRole}>` : "\`YOK\`"})
      (\`ID 8\`) Booster Rolü: (${settings.BoosterRole ? `<@&${settings.BoosterRole}>` : "\`YOK\`"})
      (\`ID 9\`) Teyitci Rolleri: (${settings.ConfirmerRoles.length > 0 ? `${settings.ConfirmerRoles.map(x => `<@&${x}>`).join(",")}` : "\`YOK\`"})
      
      \`\`\`fix\nKANALLAR\`\`\`
      (\`ID 10\`) Kurallar: (${settings.RulesChannel.length ? `<#${settings.RulesChannel}>` : "\`YOK\`"})
      (\`ID 11\`) Chat Kanalı: (${settings.ChatChannel.length ? `<#${settings.ChatChannel}>` : "\`YOK\`"})
      (\`ID 12\`) Hoşgeldin Kanalı: (${settings.WelcomeChannel.length ? `<#${settings.WelcomeChannel}>` : "\`YOK\`"})
      (\`ID 13\`) İnvite Kanalı: (${settings.InviteChannel.length ? `<#${settings.InviteChannel}>` : "\`YOK\`"})
      `)
      .setFooter({
      text: message.author.tag,
      iconURL: message.author.displayAvatarURL({ dynamic: true })
      })
            await interaction.reply({ embeds: [embed], components: [], ephemeral: true }).catch({});
          }
          if (interaction.values[0] === "ServerModeration") {
            const embed = new EmbedBuilder()
            .setDescription(`
            \`\`\`fix\nROLLER\`\`\`
            (\`ID 14\`) Yetkili Rolleri: (${settings.StaffManagmentRoles.length > 0 ? `${settings.StaffManagmentRoles.map(x => `<@&${x}>`).join(",")}` : "\`YOK\`"})
            (\`ID 15\`) Yetk. Başlangıç Rolleri: (${settings.StartAuthority.length > 0 ? `${settings.StartAuthority.map(x => `<@&${x}>`).join(",")}` : "\`YOK\`"}) (.yetkiver de verilecek registery ve en alt rol)
            (\`ID 16\`) Sahip Rolleri: (${settings.OwnerRoles.length > 0 ? `${settings.OwnerRoles.map(x => `<@&${x}>`).join(",")}` : "\`YOK\`"})
            (\`ID 17\`) Rol Verici Rolleri: (${settings.RolePanelRoles.length > 0 ? `${settings.RolePanelRoles.map(x => `<@&${x}>`).join(",")}` : "\`YOK\`"})
            (\`ID 18\`) Katıldı Rolü: (${settings.JoinedRole ? `<@&${settings.JoinedRole}>` : "\`YOK\`"})
            (\`ID 19\`) Yetkili Alım Rolleri: (${settings.YetkiliAlimDM ? `<@&${settings.YetkiliAlimDM}>` : "\`YOK\`"})
            (\`ID 20\`) Vip Rolü: (${settings.VipRole ? `<@&${settings.VipRole}>` : "\`YOK\`"})
    
            \`\`\`fix\nCEZA ROLLERİ\`\`\`
            (\`ID 21\`) Jail Rolleri: (${settings.JailedRoles.length > 0 ? `${settings.JailedRoles.map(x => `<@&${x}>`).join(",")}` : "\`YOK\`"})
            (\`ID 22\`) Chat Mute Rolleri: (${settings.MutedRole.length > 0 ? `${settings.MutedRole.map(x => `<@&${x}>`).join(",")}` : "\`YOK\`"})
            (\`ID 23\`) Voice Mute Rolleri: (${settings.VMutedRole.length > 0 ? `${settings.VMutedRole.map(x => `<@&${x}>`).join(",")}` : "\`YOK\`"})
            (\`ID 24\`) Fake Account Rolleri: (${settings.SuspectedRoles.length > 0 ? `${settings.SuspectedRoles.map(x => `<@&${x}>`).join(",")}` : "\`YOK\`"})
            (\`ID 25\`) Warn Hammer Rolleri: (${settings.WarnHammer.length > 0 ? `${settings.WarnHammer.map(x => `<@&${x}>`).join(",")}` : "\`YOK\`"})
            (\`ID 26\`) Ban Hammer Rolleri: (${settings.BanHammer.length > 0 ? `${settings.BanHammer.map(x => `<@&${x}>`).join(",")}` : "\`YOK\`"})
            (\`ID 27\`) Jail Hammer Rolleri: (${settings.JailHammer.length > 0 ? `${settings.JailHammer.map(x => `<@&${x}>`).join(",")}` : "\`YOK\`"})
            (\`ID 28\`) CMute Hammer Rolleri: (${settings.CMuteHammer.length > 0 ? `${settings.CMuteHammer.map(x => `<@&${x}>`).join(",")}` : "\`YOK\`"})
            (\`ID 29\`) VMute Hammer Rolleri: (${settings.VMuteHammer.length > 0 ? `${settings.VMuteHammer.map(x => `<@&${x}>`).join(",")}` : "\`YOK\`"})
            
          \`\`\`fix\nKATEGORİLER \`\`\`
          (\`ID 30\`) Register Parents: (** ${settings.RegisterRoomCategory.length ? `${settings.RegisterRoomCategory.map(x => `<#${x}>`).join(",")}` : "\`YOK\`"} **)
          (\`ID 31\`) Public Parents: (** ${settings.PublicRoomsCategory.length ? `<#${settings.PublicRoomsCategory}>` : "\`YOK\`"} **)
          (\`ID 32\`) Fun Parents: (** ${settings.ActivityCategorys.length > 0 ? `${settings.ActivityCategorys.map(x => `<#${x}>`).join(",")}` : "\`YOK\`"} **)
          (\`ID 33\`) Solving Parents: (** ${settings.TroubleshootingCategory.length > 0 ? `${settings.TroubleshootingCategory.map(x => `<#${x}>`).join(",")}` : "\`YOK\`"} **)
          (\`ID 34\`) Private Parents: (** ${settings.PrivateRoomsCategory.length ? `${settings.PrivateRoomsCategory.map(x => `<#${x}>`).join(",")}` : "\`YOK\`"} **)
          (\`ID 35\`) Secret Room Parents: (** ${settings.SecretRoomsCategory.length ? `${settings.SecretRoomsCategory.map(x => `<#${x}>`).join(",")}` : "\`YOK\`"} **) (Özel Oda Sistemi)
          (\`ID 36\`) Afk Odası: (** ${settings.SleepRoomChannel.length ? `${settings.SleepRoomChannel.map(x => `<#${x}>`).join(",")}` : "\`YOK\`"} **) 
          (\`ID 37\`) Streamer Parents: (** ${settings.StreamerCategory.length ? `${settings.StreamerCategory.map(x => `<#${x}>`).join(",")}` : "\`YOK\`"} **)
          (\`ID 38\`) Meeting Channel: (** ${settings.MeetingChannel.length ? `${settings.MeetingChannel.map(x => `<#${x}>`).join(",")}` : "\`YOK\`"} **)
            `)
            .setFooter({
            text: message.author.tag,
            iconURL: message.author.displayAvatarURL({ dynamic: true })
            })
                  await interaction.reply({ embeds: [embed], components: [], ephemeral: true }).catch({});
                }
                if (interaction.values[0] === "ServerLog") {
                  await interaction.deferUpdate();

                  const parent = await interaction.guild.channels.create({ name: 'J2pon Logs', type: ChannelType.GuildCategory });
                    const loglar = logs;
                    for (let index = 0; index < loglar.length; index++) {
                        let element = loglar[index];
                        await interaction.guild.channels.create({
                          name: element.name,
                          type: ChannelType.GuildText,
                          parent: parent.id, permissionOverwrites: [
                          { id: interaction.guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
                          ]
                        })
                    }
                    interaction.followUp({ content: `Loglar başarıyla kurulmuştur.` })
                
                     }


                if (interaction.values[0] === "ServerEmoji") {
                  await interaction.deferUpdate();

                  // Emoji cache'ini güncelle
                  await interaction.guild.emojis.fetch();
                  
                  // Tüm emoji listelerini birleştir
                  const emojiler = [...emojis, ...(emojis2 || []), ...(emojis3 || [])];
                  let createdCount = 0;
                  let updatedCount = 0;
                  let keptCount = 0;
                  let errorCount = 0;
                  
                  for (let index = 0; index < emojiler.length; index++) {
                      let element = emojiler[index];
                      try {
                          const result = await syncEmoji(interaction.guild, element);
                          if (result.status === "created") createdCount++;
                          else if (result.status === "updated") updatedCount++;
                          else if (result.status === "kept") keptCount++;
                          else errorCount++;
                          // Rate limit için bekleme (Her 2 emojide bir 1 sn bekle)
                          if (index % 2 === 0) await new Promise(resolve => setTimeout(resolve, 1000));
                      } catch (error) {
                          console.error(`Emoji oluşturma hatası (${element.name}):`, error);
                          errorCount++;
                      }
                  }
                  
                  await interaction.followUp({ 
                      content: `Emoji kurulumu tamamlandı!\n✅ Oluşturulan: ${createdCount}\n🔁 Güncellenen (ID düzeltildi): ${updatedCount}\n⏭️ Zaten doğru: ${keptCount}\n❌ Hata: ${errorCount}`,
                      ephemeral: true 
                  });
                }

                if (interaction.values[0] === "ServerRestart") {
                  const byj2pon = children.exec(`pm2 restart all`);
                  byj2pon.stdout.on('data', async (datas) => {
                  interaction.reply({ content: `🔃 Botlar Yeniden Başlatılıyor...` })
                  });
                }

              })

                collector.on("collect", async (interaction) => {

                
                  if (interaction.values[0] === "ServerMenu") {
                    await interaction.deferUpdate();
                    
                    const roller = roles;
                    for (let index = 0; index < roller.length; index++) {
                        let element = roller[index];
                        if(interaction.guild.premiumTier >= 2) {
                            await interaction.guild.roles.create({
                                name: element.name,
                                color: element.color,
                                icon: element.icon,
                            });
                        } else {
                            await interaction.guild.roles.create({
                                name: element.name,
                                color: element.color
                            });
                        } 
                    }
                    
                    // interaction.user veya interaction.member kullanabilirsiniz
                    const userWhoTriggered = interaction.user;
                    console.log(`Menü rolleri ${userWhoTriggered.tag} tarafından kuruldu.`);
                    
                    await interaction.followUp({ content: `Menü için gerekli Rollerin kurulumu başarıyla tamamlanmıştır.` });
                }
    if (interaction.values[0] === "ServerEmoji2") {
      await interaction.deferUpdate();
      
      // Emoji cache'ini güncelle
      await interaction.guild.emojis.fetch();
      
      const emojiler = emojis2;
      let createdCount = 0;
      let updatedCount = 0;
      let keptCount = 0;
      let errorCount = 0;
      
      for (let index = 0; index < emojiler.length; index++) {
          let element = emojiler[index];
          try {
              const result = await syncEmoji(interaction.guild, element);
              if (result.status === "created") createdCount++;
              else if (result.status === "updated") updatedCount++;
              else if (result.status === "kept") keptCount++;
              else errorCount++;
              // Rate limit için bekleme
              await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
              console.error(`Emoji oluşturma hatası (${element.name}):`, error);
              errorCount++;
          }
      }
      
      await interaction.followUp({ 
          content: `Menü emoji kurulumu tamamlandı!\n✅ Oluşturulan: ${createdCount}\n🔁 Güncellenen (ID düzeltildi): ${updatedCount}\n⏭️ Zaten doğru: ${keptCount}\n❌ Hata: ${errorCount}`,
          ephemeral: true 
      });
    }
                if (interaction.values[0] === "ServerEmoji3") {
                  await interaction.deferUpdate();
    
                  // Emoji cache'ini güncelle
                  await interaction.guild.emojis.fetch();
                  
                  const emojiler = emojis3;
                  let createdCount = 0;
                  let updatedCount = 0;
                  let keptCount = 0;
                  let errorCount = 0;
                  
                  for (let index = 0; index < emojiler.length; index++) {
                      let element = emojiler[index];
                      try {
                          const result = await syncEmoji(interaction.guild, element);
                          if (result.status === "created") createdCount++;
                          else if (result.status === "updated") updatedCount++;
                          else if (result.status === "kept") keptCount++;
                          else errorCount++;
                          // Rate limit için bekleme
                          await new Promise(resolve => setTimeout(resolve, 1000));
                      } catch (error) {
                          console.error(`Emoji oluşturma hatası (${element.name}):`, error);
                          errorCount++;
                      }
                  }
                  
                  await interaction.followUp({ 
                      content: `Özel oda emoji kurulumu tamamlandı!\n✅ Oluşturulan: ${createdCount}\n🔁 Güncellenen (ID düzeltildi): ${updatedCount}\n⏭️ Zaten doğru: ${keptCount}\n❌ Hata: ${errorCount}`,
                      ephemeral: true 
                  });
                  }
                 if (interaction.values[0] === "ServerLog2") {
                   await interaction.deferUpdate();
                 
                   try {
                     const parent = await interaction.guild.channels.create({
                         name: "DESTEK LOGLAR",
                         type: ChannelType.GuildCategory,
                         permissionOverwrites: [{
                             id: interaction.guild.id,
                             deny: [PermissionFlagsBits.ViewChannel],
                         }]
                     });

                     // Yetkili başvuru log kanalı için izinler
                     const basvuruOverwrites = [
                       {
                         id: interaction.guild.id,
                         deny: [PermissionFlagsBits.ViewChannel],
                       },
                     ];
                     if (settings.YetkiliAlimDM && interaction.guild.roles.cache.has(settings.YetkiliAlimDM)) {
                       basvuruOverwrites.push({
                         id: settings.YetkiliAlimDM,
                         allow: [PermissionFlagsBits.ViewChannel],
                       });
                     }
                 
                     const yetkiliBasvuruLogChannel = await interaction.guild.channels.create({
                         name: "📋・yetkili-basvuru-log",
                         type: ChannelType.GuildText,
                         parent: parent.id,
                         permissionOverwrites: basvuruOverwrites,
                     });
                     byj2pon.set("BasvuruLogChannel", yetkiliBasvuruLogChannel.id);

                     // İstek/öneri/şikayet log kanalı için izinler
                     const problemSolverOverwrites = [
                       {
                         id: interaction.guild.id,
                         deny: [PermissionFlagsBits.ViewChannel],
                       },
                     ];
                     const problemRoles = Array.isArray(settings.ProblemSolversRoles)
                       ? settings.ProblemSolversRoles
                       : settings.ProblemSolversRoles
                       ? [settings.ProblemSolversRoles]
                       : [];
                     for (const rid of problemRoles) {
                       if (rid && interaction.guild.roles.cache.has(rid)) {
                         problemSolverOverwrites.push({
                           id: rid,
                           allow: [PermissionFlagsBits.ViewChannel],
                         });
                       }
                     }
                 
                     const istekOneriSikayetLogChannel = await interaction.guild.channels.create({
                         name: "📋・istek-oneri-sikayet-log",
                         type: ChannelType.GuildText,
                         parent: parent.id,
                         permissionOverwrites: problemSolverOverwrites,
                     });
                     byj2pon.set("IstekOneriSikayetLogChannel", istekOneriSikayetLogChannel.id);
                 
                     interaction.followUp({ content: 'Destek Log Kanallarının kurulumu başarıyla tamamlandı.' });
                 } catch (error) {
                     console.error('Kanal oluşturma hatası:', error);
                 }
               }

                  if (interaction.values[0] === "ServerEmoji4") {
                    await interaction.deferUpdate();

                    emojis4.forEach(name => {
                      const emoji = interaction.guild.emojis.cache.find(emoji => emoji.name === name);
                      if (emoji) {
                        emoji.delete()
                          .then(() => {
                            message.channel.send(`\`${emoji.name}\` adlı emoji başarıyla silindi.`);
                          })
                          .catch(error => {
                            console.error('Emoji silme hatası:', error);
                          });
                        }})
                  }

              })
  }
    /////
    const tagsetup = [
      { name: ["1"], conf: "ServerTag", cmdName: "Tag(ları)" },
    ]
    
    const setup1 = [
      { name: ["2"], conf: "ServerUntagged", cmdName: "İkinci Tag" },
      { name: ["3", "url"], conf: "ServerVanityURL", cmdName: "Url" },
    ]
    
    const setup2 = [
      { name: ["14"], conf: "StaffManagmentRoles", cmdName: "Yetkili Rol(leri)" },
      { name: ["4"], conf: "ManRoles", cmdName: "Erkek Rolleri Rol(leri)" },
      { name: ["5"], conf: "GirlRoles", cmdName: "Kız Rolleri Rol(leri)" },
      { name: ["6"], conf: "UnRegisteredRoles", cmdName: "Kayıtsız Rol(leri)" },
      { name: ["15"], conf: "StartAuthority", cmdName: "Yetki Rol(leri)" },
      { name: ["9"], conf: "ConfirmerRoles", cmdName: "Teyitci Rol(leri)" },
      { name: ["16"], conf: "OwnerRoles", cmdName: "Sahip Rol(leri)" },
      { name: ["25"], conf: "WarnHammer", cmdName: "Warn Hammer" },
      { name: ["26"], conf: "BanHammer", cmdName: "Ban Hammer" },
      { name: ["27"], conf: "JailHammer", cmdName: "Jail Hammer" },
      { name: ["28"], conf: "CMuteHammer", cmdName: "Chat-Mute Hammer" },
      { name: ["29"], conf: "VMuteHammer", cmdName: "Voice-Mute Hammer" },
      { name: ["21"], conf: "JailedRoles", cmdName: "Jail Rol" },
      { name: ["22"], conf: "MutedRole", cmdName: "Chat-Mute Rol" },
      { name: ["23"], conf: "VMutedRole", cmdName: "Voice-Mute Rol" },
      { name: ["24"], conf: "SuspectedRoles", cmdName: "Yeni Hesap Rol" },
      { name: ["17"], conf: "RolePanelRoles", cmdName: "Rol Yönetici Rol" },
    ]
    
    const setup3 = [
      { name: ["7"], conf: "TaggedRole", cmdName: "Taglı Rol(leri)" },
      { name: ["8"], conf: "BoosterRole", cmdName: "Booster Rol" },
      { name: ["20"], conf: "VipRole", cmdName: "VipRole" },
      { name: ["18"], conf: "JoinedRole", cmdName: "Katıldı Rol" },
      { name: ["19"], conf: "YetkiliAlimDM", cmdName: "Yetkili Alım Rol" },
    ]
    
    const setup4 = [
      { name: ["11"], conf: "ChatChannel", cmdName: "Chat Kanal" },
      { name: ["12"], conf: "WelcomeChannel", cmdName: "Hoşgeldin Kanal" },
      { name: ["13"], conf: "InviteChannel", cmdName: "İnvite Kanal" },
      { name: ["10"], conf: "RulesChannel", cmdName: "Kurallar Kanal" },
    ]
    
    const setup5 = [
      { name: ["30"], conf: "RegisterRoomCategory", cmdName: "Register Kategori" },
      { name: ["33"], conf: "TroubleshootingCategory", cmdName: "Sorun Çözme Kategori(leri)" },
      { name: ["34"], conf: "PrivateRoomsCategory", cmdName: "Alone Kategori" },
      { name: ["35"], conf: "SecretRoomsCategory", cmdName: "Secret Kategori" },
      { name: ["32"], conf: "ActivityCategorys", cmdName: "Eğlence Kategori(leri)" },
      { name: ["37"], conf: "StreamerCategory", cmdName: "Streamer Kategori(leri)" },
    ]
    
    const setup6 = [
      { name: ["31"], conf: "PublicRoomsCategory", cmdName: "Public Kategori" },
    ]

    const setup7 = [
      { name: ["36"], conf: "SleepRoomChannel", cmdName: "Sleep Odası" },
      { name: ["38"], conf: "MeetingChannel", cmdName: "Toplantı Kanalı" },
    ]

    tagsetup.forEach(async (x) => {
      if(x.name.some(x => x === choose)) {
      let tag;
      if (args.length >= 1) {
        tag = args
        .filter((x) => !x.includes(choose))
        .map((x) => x);
      }
      let db = byj2pon.get(`${x.conf}`)
      if(tag) {
      if(db.some(j2ponm => j2ponm.includes(tag))) {
      byj2pon.pull(`${x.conf}`, `${tag.map(x => x)}`)
      message.reply({ content: `${tag.map(x => `${x}`)} ${x.cmdName} listesinden başarıyla kaldırıldı.`, ephemeral: true })
      } else {
      let xd = []
      tag.map(x => 
      xd.push(`${x}`)
      )
      byj2pon.set(`${x.conf}`, xd)
      message.reply({ content: `${tag.map(x => `${x}`)} ${x.cmdName} listesine başarıyla eklendi.`, ephemeral: true })
      }
      } 
      };
    });
    
    setup1.forEach(async (x) => {
      if(x.name.some(x => x === choose)) {
      let select = args[1];
      if (!select) {
      message.reply({ content: `Sunucu **${x.cmdName}** belirtmelisin`, ephemeral: true });
      return }
      byj2pon.set(`${x.conf}`, `${select}`)
      message.reply({ content: `**${select}** ${x.cmdName} listesine başarıyla eklendi.`, ephemeral: true })
    };
    });
    
    setup2.forEach(async (x) => {
    if(x.name.some(x => x === choose)) {
    const selectMenu = new ActionRowBuilder()
    .addComponents([
      new RoleSelectMenuBuilder()
      .setCustomId("test")
      .setMaxValues(10)
    ]);
    
    let msg = await message.channel.send({ content: `Aşağıdaki menüden kurmak istediğiniz **${x.cmdName}** seçiniz.`, components: [selectMenu] })
    
    const filter = i => i.user.id == message.author.id    
    let xxx = await msg.createMessageComponentCollector({ filter, componentType: ComponentType.RoleSelect, max: 1 })
    
    xxx.on("collect", async (interaction) => {
      const rol = interaction.values;
      if(interaction.customId === "test") {
        await interaction.deferUpdate();
        if(rol) {
        let xd = []
        rol.map(x => 
        xd.push(`${x}`)
        )
        byj2pon.set(`${x.conf}`, xd)
        msg.edit({ content: `**${x.cmdName}** olarak ${rol.map(x => `<@&${x}>`)} başarıyla eklendi.` , components: [] });
      }
      }
    })
    };
    });
    
    setup3.forEach(async (x) => {
    if(x.name.some(x => x === choose)) {
    const selectMenu = new ActionRowBuilder()
    .addComponents([
      new RoleSelectMenuBuilder()
      .setCustomId("test2")
      .setMaxValues(1)
    ]); 
    
    let msg = await message.channel.send({ content: `Aşağıdaki menüden kurmak istediğiniz **${x.cmdName}** seçiniz.`, components: [selectMenu] })
    
    const filter = i => i.user.id == message.author.id    
    let xxx = await msg.createMessageComponentCollector({ filter, componentType: ComponentType.RoleSelect, max: 1 })
    
    xxx.on("collect", async (interaction) => {
      const rol = interaction.values[0];
      if(interaction.customId === "test2") {
        await interaction.deferUpdate();
        if(rol) {
        byj2pon.set(`${x.conf}`, `${rol}`)
        msg.edit({ content: `**${x.cmdName}** olarak <@&${rol}> başarıyla eklendi.` , components: [] });
      }
      }
    })
    };
    }); 
    
    setup4.forEach(async (x) => {
      if(x.name.some(x => x === choose)) {
      const selectMenu = new ActionRowBuilder()
      .addComponents([
        new ChannelSelectMenuBuilder()
        .setCustomId("test3")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setMaxValues(1)
      ]);
      
      let msg = await message.channel.send({ content: `Aşağıdaki menüden kurmak istediğiniz **${x.cmdName}** seçiniz.`, components: [selectMenu] })
      
      const filter = i => i.user.id == message.author.id    
      let xxx = await msg.createMessageComponentCollector({ filter, componentType: ComponentType.ChannelSelect, max: 1 })
      
      xxx.on("collect", async (interaction) => {
        const channel = interaction.values[0];
        if(interaction.customId === "test3") {
          await interaction.deferUpdate();
          if(channel) {
          byj2pon.set(`${x.conf}`, `${channel}`)
          msg.edit({ content: `**${x.cmdName}** olarak <#${channel}> başarıyla eklendi.` , components: [] });
        }
        }
      })
      };
    }); 
    
    setup5.forEach(async (x) => {
      if(x.name.some(x => x === choose)) {
      const byj2ponRole = new ActionRowBuilder()
      .addComponents([
        new ChannelSelectMenuBuilder()
        .setCustomId("test4")
        .addChannelTypes(ChannelType.GuildCategory)
        .setMaxValues(10)
      ]);
      
      let msg = await message.channel.send({ content: `Aşağıdaki menüden kurmak istediğiniz **${x.cmdName}** seçiniz.`, components: [byj2ponRole] })
      
      const filter = i => i.user.id == message.author.id    
      let xxx = await msg.createMessageComponentCollector({ filter, componentType: ComponentType.ChannelSelect, max: 1 })
      
      xxx.on("collect", async (interaction) => {
        const channel = interaction.values;
        if(interaction.customId === "test4") {
          await interaction.deferUpdate();
          if(channel) {
            let xd = []
            channel.map(x => 
            xd.push(`${x}`)
            )
          byj2pon.set(`${x.conf}`, xd)
          msg.edit({ content: `**${x.cmdName}** olarak **${channel.map(x => `<#${channel}>`)}** başarıyla eklendi.` , components: [] });
        }
        }
      })
      };
    }); 
    
    setup6.forEach(async (x) => {
      if(x.name.some(x => x === choose)) {
      const byj2ponChannel = new ActionRowBuilder()
      .addComponents([
        new ChannelSelectMenuBuilder()
        .setCustomId("test5")
        .addChannelTypes(ChannelType.GuildCategory)
        .setMaxValues(1)
      ]);
      
      let msg = await message.channel.send({ content: `Aşağıdaki menüden kurmak istediğiniz **${x.cmdName}** seçiniz.`, components: [byj2ponChannel] })
      
      const filter = i => i.user.id == message.author.id    
      let j2poncikk = await msg.createMessageComponentCollector({ filter, componentType: ComponentType.ChannelSelect, max: 1 })
      
      j2poncikk.on("collect", async (interaction) => {
        const channel = interaction.values[0];
        if(interaction.customId === "test5") {
          await interaction.deferUpdate();
          if(channel) {
          byj2pon.set(`${x.conf}`, `${channel}`)
          msg.edit({ content: `**${x.cmdName}** olarak **<#${channel}>** başarıyla eklendi.` , components: [] });
        }
        }
      })
      };
    }); 

    setup7.forEach(async (x) => {
      if(x.name.some(x => x === choose)) {
      const byj2ponRole = new ActionRowBuilder()
      .addComponents([
        new ChannelSelectMenuBuilder()
        .setCustomId("test4")
        .addChannelTypes(ChannelType.GuildVoice)
        .setMaxValues(10)
      ]);
      
      let msg = await message.channel.send({ content: `Aşağıdaki menüden kurmak istediğiniz **${x.cmdName}** seçiniz.`, components: [byj2ponRole] })
      
      const filter = i => i.user.id == message.author.id    
      let xxx = await msg.createMessageComponentCollector({ filter, componentType: ComponentType.ChannelSelect, max: 1 })
      
      xxx.on("collect", async (interaction) => {
        const channel = interaction.values;
        if(interaction.customId === "test4") {
          await interaction.deferUpdate();
          if(channel) {
            let xd = []
            channel.map(x => 
            xd.push(`${x}`)
            )
          byj2pon.set(`${x.conf}`, xd)
          msg.edit({ content: `**${x.cmdName}** olarak **${channel.map(x => `<#${channel}>`)}** başarıyla eklendi.` , components: [] });
        }
        }
      })
      };
    }); 

  },
  };