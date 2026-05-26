const { timeformat } = require("../../../../../../Global/Helpers/Utils");
const cooldownCache = new Map();
const client = global.client;
const {splitMessage,Events, EmbedBuilder, ActionRowBuilder, RoleSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, MessageFlags, PermissionsBitField } = require("discord.js")
const penals = require("../../../../../../Global/Schemas/penals");
const moment = require('moment');
const TaskRole = require("../../../../../../Global/Schemas/TaskRole");
const System = require("../../../../../../Global/Settings/System");
require("moment-duration-format")
moment.duration("hh:mm:ss").format()
const table = require('table');
const panel = require("../../../../../../Global/Schemas/boosterpanel");
const ms = require('ms');
const userTask = require("../../../../../../Global/Schemas/userTask");
const tasks = require("../../../../../../Global/Schemas/tasks");
const guard = require("../../../../../J2pon-Guard/Schemas/Guard");
const setup = require("../../../../../../Global/Settings/Setup.json");
const emojis = require("../../../../../../Global/Settings/Emojis.json");


// Limit aşıldığında kullanıcıyı jail'e düşür (InteractionCreate için)
async function jailUserForLimitExceeded(guild, userId, actionType) {
    try {
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member || !member.manageable) return false;
        
        // Eğer zaten jail'deyse işlem yapma
        if (setup.JailedRoles.some(x => member.roles.cache.has(x))) return false;
        
        // Tüm rollerini çek, booster varsa koru
        if (member.roles.cache.has(setup.BoosterRole)) {
            await member.roles.set([setup.BoosterRole, setup.JailedRoles[0]]).catch(() => {});
        } else {
            await member.roles.set(setup.JailedRoles).catch(() => {});
        }
        
        // Ceza kaydı oluştur (1 hafta jail)
        const reason = `Limitli whitelist limiti aşıldı (${actionType})`;
        const duration = 7 * 24 * 60 * 60 * 1000; // 1 hafta
        await client.penalize(
            guild.id, 
            member.id, 
            'Jail', 
            true, 
            client.user.id, 
            reason, 
            true, 
            Math.floor(Date.now() + duration)
        ).catch(() => {});
        
        return true;
    } catch (error) {
        console.error('Jail user for limit exceeded error:', error);
        return false;
    }
}

// Modallardan gelen veriler sayı mı değil mi die kontrol edicek eleman.
function checkIsValid(value) {
  return !isNaN(value) && !isNaN(parseFloat(value))
}

client.on("interactionCreate", async (interaction) => {
 

  if (interaction.customId == 'addNewTask') {
    const row = new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId('selectedRoleForNewTasks')
        .setPlaceholder('Roller')
        .setMaxValues(1)
        .setMinValues(1)
    )

    await interaction.reply({
      content: 'Görev sonunda elde edilecek rolü seçin.',
      components: [row],
      flags: MessageFlags.Ephemeral
    })
  }

  if (interaction.customId == 'removeTask') {
    const row = new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId('removeTaskMenu')
        .setPlaceholder('Roller')
        .setMaxValues(1)
        .setMinValues(1)
    )

    await interaction.reply({
      content: 'Silmek istediğiniz göreve bağlı olan bir rolü seçin.',
      components: [row],
      flags: MessageFlags.Ephemeral
    });
  }

  if (interaction.customId == 'removeTaskMenu') {
    if (!interaction.guild) {
      return await interaction.reply({
        content: `Bu komut sadece sunucularda kullanılabilir.`,
        flags: MessageFlags.Ephemeral
      });
    }

    const data = await tasks.findOne({ 
      guildId: interaction.guild.id,
      $or: [
        { currentRole: interaction.values[0] },
        { endOfMissionRole: interaction.values[0] }
      ]
    });

    if (!data) {
      return await interaction.reply({
        content: `Seçtiğiniz role (<@&${interaction.values[0]}>) bağlı bir görev bulunamadı, doğru rolü seçtiğinizden emin olun.`,
        flags: MessageFlags.Ephemeral
      });
    }
    
    try {
      await tasks.findByIdAndDelete(data._id);
      
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('listTask')
          .setStyle(ButtonStyle.Secondary)
          .setLabel('Görevleri Listele')
      );
      
      await interaction.reply({
        content: `Başarıyla <@&${interaction.values[0]}> rolüne ait görev silindi. ${client.emoji("server_onay")}`,
        components: [row],
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      console.error('Görev silme hatası:', error);
      await interaction.reply({
        content: `Görev silinirken bir hata oluştu: ${error.message}`,
        flags: MessageFlags.Ephemeral
      });
    }
  }

  if (interaction.customId == 'listTask') {

    const msToHours = (ms) => {
      const seconds = ms / 1000;
      const minutes = seconds / 60;
      const hours = minutes / 60;

      return hours;
    }
    try {
    const res = await tasks.find({ guildId: interaction.guild.id }).exec();
      if(!res || res.length === 0) return interaction.reply({content: `${System.Server} sunucusuna ait görev bilgisi veritabanında bulunamadı.`, ephemeral: true})
      const data = [
        ["#", "Rol", "Mesaj", "Ses", "Register", "Invite", "Yetkili", "Taglı"],
        ...res.map((value, index) => [
          `#${index + 1}`,
          `${interaction.guild.roles.cache.get(value.endOfMissionRole) ? interaction.guild.roles.cache.get(value.endOfMissionRole).name : "Yok!"}`,
          `${value.requiredCounts.message} Mesaj`,
          `${msToHours(value.requiredCounts.voice)} Saat`,
          `${value.requiredCounts.register} Adet`,
          `${value.requiredCounts.invite} Davet`,
          `${value.requiredCounts.yetkili || 0} Yetkili`,
          `${value.requiredCounts.tagli || 0} Taglı`,
        ]),
      ];
      
      const veriler = table.table(data, {
        border: {
          topBody: '─',
          topJoin: '┬',
          topLeft: '┌',
          topRight: '┐',
          bottomBody: '─',
          bottomJoin: '┴',
          bottomLeft: '└',
          bottomRight: '┘',
          bodyLeft: '│',
          bodyRight: '│',
          bodyJoin: '│',
          joinBody: '─',
          joinLeft: '├',
          joinRight: '┤',
          joinJoin: '┼'
        },
        drawHorizontalLine: function (index, size) {
          return index === 0 || index === 1 || index === size;
        },
      });
      
      const array = `\`\`\`${veriler}\`\`\``;
      interaction.reply({ content: `${array}`, ephemeral: true });

    } catch (err) {
      console.error('Error:', err);
      interaction.reply({content: 'Hata:' + err.message, ephemeral: true});
  }
    }

  if (interaction.customId == 'selectedRoleForNewTasks') {
    const check = await tasks.findOne({ endOfMissionRole: interaction.values[0] });

    if (check) {
      return await interaction.reply({
        content: `Seçtiğiniz role (<@&${interaction.values[0]}>) bağlı bir görev zaten bulunmakta, farklı bir rol seçin.`,
        ephemeral: true
      })
    }

    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .addFields({
        name: 'Görev sonunda elde edilecek rol id:',
        value: interaction.values[0]
      })


    const row = new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId('selectedRoleForRole')
        .setPlaceholder('Roller (Birden fazla seçebilirsiniz)')
        .setMaxValues(25)
        .setMinValues(1)
    )

    await interaction.reply({
      content: 'Hangi roldeki kullanıcılar için bu görev geçerli olucak? (Birden fazla rol seçebilirsiniz)',
      embeds: [embed],
      components: [row],
      ephemeral: true
    })

  }

  if (interaction.customId == 'selectedRoleForRole') {
    try {
      // Interaction zaten cevaplanmış mı kontrol et
      if (interaction.replied || interaction.deferred) return;
      
      // Seçilen tüm rolleri kontrol et
      for (const roleId of interaction.values) {
        const check = await tasks.findOne({ currentRole: roleId });
        if (check) {
          if (!interaction.replied && !interaction.deferred) {
            return await interaction.reply({
              content: `Seçtiğiniz rollerden biri (<@&${roleId}>) zaten bir göreve bağlı, farklı bir rol seçin.`,
              ephemeral: true
            });
          }
          return;
        }
      }

      const modal = new ModalBuilder()
        .setCustomId('newTaskModal')
        .setTitle('Yeni Görev Ekle')

      const inputs = [
        new TextInputBuilder()
          .setCustomId('roleId')
          .setLabel('Geçerli Rol ID\'ler (Otomatik)')
          .setStyle(TextInputStyle.Short)
          .setValue(`${interaction.values.join(',')}`)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('missionEndRoleId')
          .setLabel('Görev Sonu Verilecek Rol ID (Otomatik)')
          .setStyle(TextInputStyle.Short)
          .setValue(`${interaction.message.embeds[0].data.fields[0].value}`)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('reqMessage')
          .setLabel('Mesaj Limit')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('reqVoice')
          .setLabel('Ses Süre Limiti (Saat)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
        new TextInputBuilder()
          .setCustomId('reqRegister')
          .setLabel('Kayıt Limit')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
      ]

      const fields = inputs.map(input => new ActionRowBuilder().addComponents(input))

      modal.addComponents(...fields)

      if (!interaction.replied && !interaction.deferred) {
        await interaction.showModal(modal);
      }
    } catch (error) {
      console.error('selectedRoleForRole hatası:', error);
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: '❌ Bir hata oluştu!', ephemeral: true });
        }
      } catch (replyError) {
        console.error('selectedRoleForRole hata mesajı gönderilemedi:', replyError);
      }
    }
  }


  if (interaction.customId == 'newTaskModal') {
    const getInput = (input) => {
      return interaction.fields.getTextInputValue(input)
    }

    if (!checkIsValid(getInput('reqMessage')) || !checkIsValid(getInput('reqVoice')) || !checkIsValid(getInput('reqRegister'))) {
      return await interaction.reply({
        content: 'Tüm girdiler bir sayı olmak zorunda.',
        ephemeral: true
      })
    }

    const roleIds = getInput('roleId').split(',').filter(id => id.trim());
    const roleMentions = roleIds.map(id => `<@&${id.trim()}>`).join(', ');

    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle('Yeni Görev Detayları')
      .addFields(
        {
          name: 'Geçerli Olacak Roller',
          value: roleMentions || 'Rol bulunamadı'
        }, 
        {
          name: 'Görev Sonu Verilecek Rol',
          value: `<@&${getInput('missionEndRoleId')}>`
        }, 
        {
          name: 'Mesaj Limiti',
          value: `${getInput('reqMessage')}`
        },
        {
          name: 'Ses Limiti',
          value: `${getInput('reqVoice')} saat`
        },
        {
          name: 'Kayıt Limiti',
          value: `${getInput('reqRegister')}`
        },
      )

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('secondFormForNewTask')
        .setStyle(ButtonStyle.Success)
        .setLabel('Ayarlamaya Devam Et'),
        new ButtonBuilder()
        .setCustomId('cancelAddNewTask')
        .setStyle(ButtonStyle.Danger)
        .setLabel('İşlemi İptal Et')
    )

    const rowTwo = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('setNewTask')
        .setStyle(ButtonStyle.Primary)
        .setLabel('Yeni Görev Oluştur')
        .setDisabled(true)
    )

    await interaction.reply({
      embeds: [embed],
      components: [row, rowTwo],
      ephemeral: true
    }) 
  }

  if (interaction.customId == 'secondFormForNewTask') {
     const modal = new ModalBuilder()
      .setCustomId('newTaskModalTwo')
      .setTitle('Yeni Görev Ekle')

    const inputs = [
      new TextInputBuilder()
        .setCustomId('reqInvite')
        .setLabel('Davet Limit')
        .setStyle(TextInputStyle.Short)
        .setRequired(true),
      new TextInputBuilder()
        .setCustomId('reqYetkili')
        .setLabel('Yetkili Çekme Limit')
        .setStyle(TextInputStyle.Short)
        .setRequired(true),
      new TextInputBuilder()
        .setCustomId('reqTagli')
        .setLabel('Taglı Çekme Limit')
        .setStyle(TextInputStyle.Short)
        .setRequired(true),
    ]

    const fields = inputs.map(input => new ActionRowBuilder().addComponents(input))

    modal.addComponents(...fields)

    await interaction.showModal(modal)
  }

  if (interaction.customId == 'cancelAddNewTask') {
    await interaction.update({
      content: 'İşlem başarıyla iptal edildi.',
      embeds: [],
      components: [],
    })
  }

  if (interaction.customId == 'newTaskModalTwo') {
     const getInput = (input) => {
      return interaction.fields.getTextInputValue(input)
    } 

    if (!checkIsValid(getInput('reqInvite')) || !checkIsValid(getInput('reqYetkili')) || !checkIsValid(getInput('reqTagli'))) {
      return await interaction.reply({
        content: 'Tüm girdiler bir sayı olmak zorunda.',
        ephemeral: true
      })
    }

    const embed = EmbedBuilder.from(interaction.message.embeds[0])
    
    embed.addFields(
      {
        name: 'Davet Limiti',
        value: `${getInput('reqInvite')}`
      },
      {
        name: 'Yetkili Çekme Limiti',
        value: `${getInput('reqYetkili')}`
      },
      {
        name: 'Taglı Çekme Limiti',
        value: `${getInput('reqTagli')}`
      },
    )

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('approveNewTask')
        .setStyle(ButtonStyle.Success)
        .setLabel('Görevi Kaydet'),
        new ButtonBuilder()
        .setCustomId('cancelAddNewTask')
        .setStyle(ButtonStyle.Danger)
        .setLabel('İşlemi İptal Et')
    )

    await interaction.update({
      embeds: [embed],
      components: [row]
    })
  }

  if (interaction.customId == 'approveNewTask') {
    const embed = EmbedBuilder.from(interaction.message.embeds[0])
    const row = ActionRowBuilder.from(interaction.message.components[0])

    row.components.forEach(component => component.setDisabled(true))

    const val = (index) => {
      return embed.data.fields[index].value
    }

    const val3 = val(3).match(/(\d+)\s+saat/);

    const voiceLimit = ms(parseInt(val3[1], 10) + 'h')

    // Geçerli olacak rolleri al (embed'den parse et)
    const currentRolesField = val(0);
    // Eğer virgülle ayrılmış mention'lar varsa parse et, yoksa tek rol olarak al
    const currentRoles = currentRolesField.includes(',') 
      ? currentRolesField.split(',').map(role => role.trim().replace(/<@&|>/g, '')).filter(id => id)
      : [currentRolesField.replace(/<@&|>/g, '')];
    
    // Her rol için ayrı görev kaydı oluştur
    for (const currentRole of currentRoles) {
      new tasks({
        guildId: interaction.guild.id,
        currentRole: currentRole.trim(),
        endOfMissionRole: val(1).slice(3, -1),
        'requiredCounts.message': Number(val(2)) || 0,
        'requiredCounts.voice': voiceLimit,
        'requiredCounts.register': Number(val(4)) || 0,
        'requiredCounts.invite': Number(val(5)) || 0,
        'requiredCounts.yetkili': Number(val(6)) || 0,
        'requiredCounts.tagli': Number(val(7)) || 0,
      }).save();
    }

    await interaction.update({
      content: 'Aşağıda bilgileri verilen yeni görev başarıyla eklendi.',
      components: [row],
    })
  }
  
  // ! Görev Sistemi

  if (interaction.customId == 'MEMBER_PENALS') {
    await interaction.deferReply({ ephemeral: true })

    // Value formatı: penal_${id}_${index} - ID'yi çıkar
    const penalId = interaction.values[0].startsWith('penal_') 
      ? interaction.values[0].split('_')[1] 
      : interaction.values[0];
    
    const data = await penals.find({ id: penalId })

    if (!data) {
      return await interaction.editReply({
        content: 'Belirtilen ceza veritabanında bulunamadı, tekrar deneyin.'
      })
    }

    const user = interaction.client.users.cache.get(data[0].userID)

    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setThumbnail(interaction.guild.iconURL({dynamic: true, size: 2048}))
      .setDescription(`- **#${data[0].id}** ID'li **${data[0].active ? 'aktif' : 'pasif'}** cezanın detayları aşağıda yer almaktadır.`)
      .addFields(
        {
          name: 'İşlem Uygulayan Yetkili',
          value: `<@${data[0].staff}> (${data[0].staff})`,
          inline: true
        }, 
        {
          name: 'İşlem Tipi',
          value: `${data[0].type}`,
          inline: true
        },
        {
          name: 'İşlem Sebebi',
          value: data[0].reason ? `${data[0].reason.length > 1024 ? data[0].reason.substring(0, 1022).trim() + '..' : data[0].reason}` : 'Sebep belirtilmemiş.',
          inline: false
        },
        {
          name: 'Süre Bilgileri',
          value: `İşlem <t:${Math.floor(data[0].date / 1000)}> tarihinde (<t:${Math.floor(data[0].date / 1000)}:R>) uygulanmış. \n\n${data[0].finishDate ? `Verilen ceza <t:${Math.floor(data[0].finishDate / 1000)}> tarihinde (<t:${Math.floor(data[0].finishDate / 1000)}:R>) sona ${data[0].active ? 'erecek' : 'ermiş'}.` : ''}`,
          inline: false
        }
      )

    if (data[0].proofImage) {
      embed.setImage(data[0].proofImage)
    }
      
    if (user) {
      embed.setAuthor({ iconURL: user.displayAvatarURL({ dynamic: true }), name: `Cezalı: ${user.username}` })
    }

    await interaction.editReply({
      embeds: [embed]
    })
  }

  if (interaction.customId == 'MEMBER_PENALSS') {
    await interaction.deferReply({ ephemeral: true })

    // Disabled menu için null kontrolü
    if (interaction.values[0] === 'null yok bişe') {
      return await interaction.editReply({
        content: 'Bu menü devre dışı bırakılmış.'
      })
    }

    // Value formatı: penal_${id}_${index} - ID'yi çıkar
    const penalId = interaction.values[0].startsWith('penal_') 
      ? interaction.values[0].split('_')[1] 
      : interaction.values[0];
    
    const data = await penals.find({ id: penalId })

    if (!data) {
      return await interaction.editReply({
        content: 'Belirtilen ceza veritabanında bulunamadı, tekrar deneyin.'
      })
    }

    const user = interaction.client.users.cache.get(data[0].userID)

    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setDescription(`- **#${data[0].id}** ID'li **${data[0].active ? 'aktif' : 'pasif'}** cezanın detayları aşağıda yer almaktadır.`)
      .addFields(
        {
          name: 'İşlem Uygulayan Yetkili',
          value: `<@${data[0].staff}> (${data[0].staff})`,
          inline: true
        }, 
        {
          name: 'İşlem Tipi',
          value: `${data[0].type}`,
          inline: true
        },
        {
          name: 'İşlem Sebebi',
          value: data[0].reason ? `${data[0].reason.length > 1024 ? data[0].reason.substring(0, 1022).trim() + '..' : data[0].reason}` : 'Sebep belirtilmemiş.',
          inline: false
        },
        {
          name: 'Süre Bilgileri',
          value: `İşlem <t:${Math.floor(data[0].date / 1000)}> tarihinde (<t:${Math.floor(data[0].date / 1000)}:R>) uygulanmış. \n\n${data[0].finishDate ? `Verilen ceza <t:${Math.floor(data[0].finishDate / 1000)}> tarihinde (<t:${Math.floor(data[0].finishDate / 1000)}:R>) sona ${data[0].active ? 'erecek' : 'ermiş'}.` : ''}`,
          inline: false
        }
      )
      
    if (data[0].proofImage) {
      embed.setImage(data[0].proofImage)
    }

    if (user) {
      embed.setAuthor({ iconURL: user.displayAvatarURL({ dynamic: true }), name: user.username })
    }

    await interaction.editReply({
      embeds: [embed]
    })
  }

  if (interaction.customId == 'MEMBER_WARNINGS') {
    await interaction.deferReply({ ephemeral: true })

    const data = await penals.find({ id: interaction.values[0] })

    if (!data) {
      return await interaction.editReply({
        content: 'Belirtilen ceza veritabanında bulunamadı, tekrar deneyin.'
      })
    }

    const user = interaction.client.users.cache.get(data[0].userID)

    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setThumbnail(interaction.guild.iconURL({dynamic: true, size: 2048}))
      .setDescription(`- **#${data[0].id}** ID'li uyarının detayları aşağıda yer almaktadır.`)
      .addFields(
        {
          name: 'İşlem Uygulayan Yetkili',
          value: `<@${data[0].staff}> (${data[0].staff})`,
          inline: true
        }, 
        {
          name: 'İşlem Tipi',
          value: `${data[0].type}`,
          inline: true
        },
        {
          name: 'İşlem Sebebi',
          value: data[0].reason ? `${data[0].reason.length > 1024 ? data[0].reason.substring(0, 1022).trim() + '..' : data[0].reason}` : 'Sebep belirtilmemiş.',
          inline: false
        },
        {
          name: 'Süre Bilgileri',
          value: `İşlem <t:${Math.floor(data[0].date / 1000)}> tarihinde (<t:${Math.floor(data[0].date / 1000)}:R>) uygulanmış.`,
          inline: false
        }
      )
      
    if (user) {
      embed.setAuthor({ iconURL: user.displayAvatarURL({ dynamic: true }), name: `Cezalı: ${user.username}` })
    }

    await interaction.editReply({
      embeds: [embed]
    })
  }

  // Limitli Whitelist Modal Handler
  if (interaction.isModalSubmit() && interaction.customId.startsWith('limited_modal_')) {
    try {
      const userId = interaction.customId.replace('limited_modal_', '');
      
      // Her işlem tipi için limit değerlerini al
      const getLimit = (fieldName) => {
        try {
          const value = interaction.fields.getTextInputValue(fieldName);
          const limit = parseInt(value);
          return isNaN(limit) || limit < 1 ? 10 : limit; // Varsayılan 10
        } catch {
          return 10;
        }
      };
      
      const banLimit = getLimit('ban_limit');
      const kickLimit = getLimit('kick_limit');
      const timeoutLimit = getLimit('timeout_limit');
      const roleAddLimit = getLimit('role_add_limit');
      const roleRemoveLimit = getLimit('role_remove_limit');

      const guardData = await guard.findOne({guildID: interaction.guild.id}) || await guard.create({guildID: interaction.guild.id});
      const existingIndex = guardData.limitedWhitelistMembers?.findIndex(x => x.userId === userId);

      if (existingIndex !== undefined && existingIndex !== -1) {
        // Limit güncelle
        const existing = guardData.limitedWhitelistMembers[existingIndex];
        if (!existing.limits) {
          existing.limits = {
            ban: { limit: 10, used: 0 },
            kick: { limit: 10, used: 0 },
            timeout: { limit: 10, used: 0 },
            role_add: { limit: 10, used: 0 },
            role_remove: { limit: 10, used: 0 }
          };
        }
        
        // Mevcut kullanım sayılarını koru, sadece limitleri güncelle
        existing.limits.ban.limit = banLimit;
        existing.limits.kick.limit = kickLimit;
        existing.limits.timeout.limit = timeoutLimit;
        existing.limits.role_add.limit = roleAddLimit;
        existing.limits.role_remove.limit = roleRemoveLimit;
        
        await guardData.save();
        await interaction.reply({
          content: `**${interaction.guild.members.cache.get(userId)?.user.tag || userId}** kullanıcısının limitleri güncellendi!\n**Ban:** ${banLimit} | **Kick:** ${kickLimit} | **Timeout:** ${timeoutLimit} | **Rol Verme:** ${roleAddLimit} | **Rol Alma:** ${roleRemoveLimit}`,
          ephemeral: true
        });
      } else {
        // Yeni ekle
        if (!guardData.limitedWhitelistMembers) {
          guardData.limitedWhitelistMembers = [];
        }
        guardData.limitedWhitelistMembers.push({
          userId: userId,
          limits: {
            ban: { limit: banLimit, used: 0 },
            kick: { limit: kickLimit, used: 0 },
            timeout: { limit: timeoutLimit, used: 0 },
            role_add: { limit: roleAddLimit, used: 0 },
            role_remove: { limit: roleRemoveLimit, used: 0 }
          }
        });
        await guardData.save();
        await interaction.reply({
          content: `**${interaction.guild.members.cache.get(userId)?.user.tag || userId}** kullanıcısı limitli whitelist'e eklendi!\n**Ban:** ${banLimit} | **Kick:** ${kickLimit} | **Timeout:** ${timeoutLimit} | **Rol Verme:** ${roleAddLimit} | **Rol Alma:** ${roleRemoveLimit}`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Limited whitelist modal error:', error);
      await interaction.reply({
        content: `İşlem sırasında bir hata oluştu: ${error.message}`,
        ephemeral: true
      });
    }
  }

  // Context Menu (Sağ Tık) Limit Kontrolü - Tüm Moderation İşlemleri
  if (interaction.isContextMenuCommand() && !interaction.replied && !interaction.deferred) {
    const commandName = interaction.commandName?.toLowerCase();
    const system = global.system;
    
    // Tüm sağ tık moderation komutlarını kontrol et
    const moderationCommands = [
      // Ban ve Kick
      'ban', 'kick', 'yasakla', 'at', 'ban member', 'kick member',
      // Timeout
      'timeout', 'timeout member', 'mute member',
      // Mute ve Deafen
      'mute', 'deafen', 'sağırlaştır', 'sustur',
      // Rol İşlemleri
      'add role', 'remove role', 'give role', 'take role', 'rol ver', 'rol al', 'role',
      // Diğer
      'warn', 'uyarı', 'jail', 'hapset'
    ];
    
    const isModerationCommand = moderationCommands.some(cmd => commandName.includes(cmd));
    
    if (isModerationCommand) {
      try {
        const guardData = await guard.findOne({guildID: interaction.guild.id});
        
        // Önce tam yetki kontrolü yap
        // Bot owner kontrolü
        if (system.BotsOwners && system.BotsOwners.includes(interaction.user.id)) {
          return; // Bot owner ise limit kontrolü yapma
        }
        
        if (guardData) {
          const fullWhitelist = guardData.SafedMembers || [];
          const banKickWhitelist = guardData.banKickSafedMembers || [];
          const roleWhitelist = guardData.roleSafedMembers || [];
          
          // Komut tipine göre uygun whitelist kontrolü
          let hasFullPermission = false;
          
          // Ban/Kick/Timeout/Mute/Deafen için banKick whitelist kontrolü
          if (['ban', 'kick', 'timeout', 'mute', 'deafen', 'yasakla', 'at', 'sustur', 'sağırlaştır'].some(cmd => commandName.includes(cmd))) {
            hasFullPermission = fullWhitelist.includes(interaction.user.id) || banKickWhitelist.includes(interaction.user.id);
          }
          // Rol işlemleri için role whitelist kontrolü
          else if (['role', 'rol', 'add role', 'remove role', 'give role', 'take role'].some(cmd => commandName.includes(cmd))) {
            hasFullPermission = fullWhitelist.includes(interaction.user.id) || roleWhitelist.includes(interaction.user.id);
          }
          // Diğer işlemler için full whitelist kontrolü
          else {
            hasFullPermission = fullWhitelist.includes(interaction.user.id);
          }
          
          // Eğer tam yetki varsa limit kontrolü yapma
          if (hasFullPermission) {
            return; // Tam yetki var, limit kontrolü yapma
          }
        }
        
        // Limitli whitelist kontrolü
        if (guardData && guardData.limitedWhitelistMembers && guardData.limitedWhitelistMembers.length > 0) {
          const limitedUser = guardData.limitedWhitelistMembers.find(x => x.userId === interaction.user.id);
          
          if (limitedUser) {
            // Action tipini belirle
            let actionType = 'ban';
            if (['kick', 'at'].some(cmd => commandName.includes(cmd))) actionType = 'kick';
            else if (['timeout', 'mute'].some(cmd => commandName.includes(cmd))) actionType = 'timeout';
            else if (['role', 'rol', 'add role', 'give role'].some(cmd => commandName.includes(cmd))) actionType = 'role_add';
            else if (['remove role', 'take role'].some(cmd => commandName.includes(cmd))) actionType = 'role_remove';
            
            // Yeni yapı kontrolü (limits objesi var mı?)
            if (limitedUser.limits) {
              const actionLimits = limitedUser.limits[actionType];
              if (actionLimits) {
                const now = Date.now();
                
                // Süre bazlı reset kontrolü
                // Ban ve Kick: 3 saat, diğerleri: 1 saat
                const resetDuration = (actionType === 'ban' || actionType === 'kick') 
                    ? 3 * 60 * 60 * 1000  // 3 saat
                    : 1 * 60 * 60 * 1000; // 1 saat
                
                // Eğer reset zamanı geçmişse veya hiç ayarlanmamışsa, kullanımı sıfırla
                if (!actionLimits.resetAt || now >= actionLimits.resetAt) {
                    actionLimits.used = 0;
                    actionLimits.resetAt = now + resetDuration;
                }
                
                // Limit kontrolü
                if (actionLimits.used >= actionLimits.limit) {
                  // Limit aşıldı, listeden çıkarma (sadece jail'e düşür)
                  // Kullanıcıyı jail'e düşür
                  await jailUserForLimitExceeded(interaction.guild, interaction.user.id, actionType);
                  
                  // İşlemi engelle
                  try {
                    await interaction.reply({
                      content: `${emojis.server_carpi} **${actionType} limitinizi aştınız!**\n\n${emojis.server_info} **Limit:** \`${actionLimits.used}/${actionLimits.limit}\`\n${emojis.server_carpi} Yetkiniz kaldırıldı ve jail'e düşürüldünüz.`,
                      flags: MessageFlags.Ephemeral
                    });
                    return;
                  } catch (replyError) {
                    console.error('Context menu limit reply error:', replyError);
                    return;
                  }
                }
                
                // Limit artır ve reset zamanını güncelle
                actionLimits.used += 1;
                // İlk kullanımda reset zamanını ayarla
                if (!actionLimits.resetAt || actionLimits.resetAt <= now) {
                    actionLimits.resetAt = now + resetDuration;
                }
                await guardData.save();
                
                // Kullanıcıya bilgi ver
                if (actionLimits.used >= actionLimits.limit - 1) {
                  setTimeout(async () => {
                    try {
                      if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({
                          content: `⚠️ Limit: ${actionLimits.used}/${actionLimits.limit}${actionLimits.used >= actionLimits.limit ? ' - Son kullanım!' : ''}`,
                          flags: MessageFlags.Ephemeral
                        });
                      }
                    } catch (e) {}
                  }, 1000);
                }
              }
            } else {
              // Eski yapı desteği (geriye dönük uyumluluk)
              if (limitedUser.used >= limitedUser.limit) {
                // Limit aşıldı, listeden çıkarma (sadece jail'e düşür)
                // Kullanıcıyı jail'e düşür
                await jailUserForLimitExceeded(interaction.guild, interaction.user.id, actionType);
                
                try {
                  await interaction.reply({
                    content: `${emojis.server_carpi} **Limitli whitelist limitinizi aştınız!**\n\n${emojis.server_info} **Limit:** \`${limitedUser.used}/${limitedUser.limit}\`\n${emojis.server_carpi} Yetkiniz kaldırıldı ve jail'e düşürüldünüz.`,
                    flags: MessageFlags.Ephemeral
                  });
                  return;
                } catch (replyError) {
                  console.error('Context menu limit reply error:', replyError);
                  return;
                }
              }
              
              limitedUser.used += 1;
              await guardData.save();
            }
          }
        }
      } catch (error) {
        console.error('Context menu limit check error:', error);
        // Hata durumunda işleme devam et
      }
    }
  }

  if (interaction.customId && interaction.customId.startsWith('staff_leave_interest_')) {
    const staffReturn = require("../../../../../../Global/Schemas/staffReturn");
    const userId = interaction.customId.split('_')[3];
    const member = interaction.guild.members.cache.get(userId);
    
    // Veritabanına İlgilenme Kaydı Ekle
    await staffReturn.findOneAndUpdate(
        { guildID: interaction.guild.id, leftUserID: userId },
        { interestedUserID: interaction.user.id, date: Date.now(), completed: false },
        { upsert: true }
    );

    const embed = EmbedBuilder.from(interaction.message.embeds[0]);
    embed.addFields({ name: "İlgilenen Yetkili", value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: false });
    embed.setColor(0x57f287); // Yeşile çevir
    
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('staff_leave_done')
            .setLabel(`${interaction.user.username} İlgileniyor`)
            .setStyle(ButtonStyle.Success)
            .setDisabled(true)
            .setEmoji("✅")
    );

    await interaction.update({ embeds: [embed], components: [row] });
  }
  
  // Yasaklı Tag modal/select işlemleri BannedTag.js onLoad içinde yönetiliyor (guild/isim tipi ile).
})