const {
  PermissionsBitField,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  ComponentType,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const setup = require("../../../../../../Global/Settings/Setup.json");
const kanal = require("../../../../../../Global/Settings/AyarName");
const GuildTagService = require("../../../../../../Global/Services/GuildTagService");
const yetkiliStats = require("../../../../../../Global/Schemas/yetkiliStats");
const userTask = require("../../../../../../Global/Schemas/userTask");
const tasks = require("../../../../../../Global/Schemas/tasks");

module.exports = {
  name: "yetkilialım",
  description: "Belirttiğiniz üyeye uygun yetki rolünü verir.",
  category: "STAT",
  cooldown: 0,
  command: {
    enabled: true,
    aliases: ["yetkili-alım", "yetkialim", "yetkili-alim"],
    usage: ".yetkilialım <@User/ID>",
  },

  onLoad: function (client) { },

  onCommand: async function (client, message, args, byj2ponembed) {
    const staffRoles = setup.Sorumluluk?.StaffRoles?.yetkili || {};
    const responsibleId = staffRoles.responsible;
    const leaderId = staffRoles.leader;

    const isResponsible = responsibleId && message.member.roles.cache.has(responsibleId);
    const isLeader = leaderId && message.member.roles.cache.has(leaderId);
    const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);

    if (!isResponsible && !isLeader && !isAdmin) {
      message.react(client.emoji("server_carpi") || "❌");
      return message
        .reply({ content: "Bu komutu sadece yetkili alım sorumlusu ve lideri kullanabilir." })
        .then((e) => setTimeout(() => e.delete().catch(() => { }), 5000));
    }

    const member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);

    if (!member) {
      return message
        .reply({ content: "Bir kullanıcı etiketlemelisin ya da ID'sini girmelisin.\nÖrn: `.yetkilialım @Üye`" })
        .then((e) => setTimeout(() => e.delete().catch(() => { }), 7000));
    }

    if (member.user.bot) {
      return message
        .reply({ content: "Botlara yetki veremezsin." })
        .then((e) => setTimeout(() => e.delete().catch(() => { }), 5000));
    }

    if (member.id === message.author.id) {
      return message
        .reply({ content: "Kendine bu komutla yetki veremezsin." })
        .then((e) => setTimeout(() => e.delete().catch(() => { }), 5000));
    }

    const hasGuildTag = await GuildTagService.memberHasGuildTag(client, member);
    if (!hasGuildTag) {
      const tagDisplay = Array.isArray(setup.ServerTag)
        ? setup.ServerTag.filter(Boolean).join("`, `")
        : String(setup.ServerTag || "");
      message.react(client.emoji("server_carpi") || "❌").catch(() => { });
      return message
        .reply({
          content: `Sunucu tagı olmayan üyeler yetkili olarak alınamaz. Kullanıcının kullanıcı adı veya görünen adında şu taglardan biri bulunmalı: \`${tagDisplay || "—"}\``,
        })
        .then((e) => setTimeout(() => e.delete().catch(() => { }), 10000));
    }

    if (message.member.roles.highest.position <= member.roles.highest.position) {
      return message
        .reply({ content: "Belirttiğin kullanıcının yetkisi senden yüksek veya eşit!" })
        .then((e) => setTimeout(() => e.delete().catch(() => { }), 7000));
    }

    const levels = setup.Sorumluluk?.YetkiSeviyeleri || {};
    const altRoles = Array.isArray(levels.AltYetki?.Roller)
      ? levels.AltYetki.Roller
      : [];
    const ortaRoles = Array.isArray(levels.OrtaYetki?.Roller)
      ? levels.OrtaYetki.Roller
      : [];
    const ustRoles = Array.isArray(levels.UstYetki?.Roller)
      ? levels.UstYetki.Roller
      : [];

    // Sorumlu: sadece AltYetki; Lider/Admin: tüm seviyeler
    const canSeeOrtaUst = isLeader || isAdmin;

    const options = [];

    for (const id of altRoles) {
      const role = message.guild.roles.cache.get(id);
      if (!role) continue;
      options.push({
        label: `Alt Yetki • ${role.name}`,
        value: `alt_${id}`,
      });
    }

    if (canSeeOrtaUst) {
      for (const id of ortaRoles) {
        const role = message.guild.roles.cache.get(id);
        if (!role) continue;
        options.push({
          label: `Orta Yetki • ${role.name}`,
          value: `orta_${id}`,
        });
      }

      for (const id of ustRoles) {
        const role = message.guild.roles.cache.get(id);
        if (!role) continue;
        options.push({
          label: `Üst Yetki • ${role.name}`,
          value: `ust_${id}`,
        });
      }
    }

    if (options.length === 0) {
      return message
        .reply({ content: "Seçilebilecek yetki rolü bulunamadı. Setup'daki yetki seviyelerini kontrol et." })
        .then((e) => setTimeout(() => e.delete().catch(() => { }), 7000));
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId("yetkili_alim_select")
      .setPlaceholder("Verilecek yetki seviyesini seçin.")
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(menu);

    const embed = new EmbedBuilder()
      .setColor(0x2f3136)
      .setAuthor({
        name: message.guild.name,
        iconURL: message.guild.iconURL({ dynamic: true }) || undefined,
      })
      .setDescription(
        `${client.emoji("server_info")} ${member} kullanıcısına verilecek yetki seviyesini menüden seçiniz.\n\n` +
        `Seçilen yetki rolü, ayrıca **ManagmentRoles** ile birlikte verilecektir.`
      );

    const msg = await message.channel.send({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 60000,
      filter: (i) => i.user.id === message.author.id && i.customId === "yetkili_alim_select",
    });

    collector.on("collect", async (interaction) => {
      const value = interaction.values[0];
      const [, roleId] = value.split("_");
      const role = message.guild.roles.cache.get(roleId);
      if (!role) {
        await interaction.reply({
          content: "Seçilen rol bulunamadı, lütfen yetki seviyelerini kontrol edin.",
          ephemeral: true,
        });
        return;
      }

      const freshMember = await message.guild.members.fetch(member.id).catch(() => member);
      const stillTagged = await GuildTagService.memberHasGuildTag(client, freshMember);
      if (!stillTagged) {
        await interaction.reply({
          content: `${client.emoji("server_carpi") || "❌"} İşlem iptal edildi: kullanıcıda sunucu tagı yok (komut sonrası tag kaldırılmış olabilir).`,
          ephemeral: true,
        });
        return;
      }

      const managementRoles = Array.isArray(setup.ManagmentRoles)
        ? setup.ManagmentRoles
        : [];

      try {
        await freshMember.roles.add(role);
        if (managementRoles.length > 0) {
          await freshMember.roles.add(managementRoles.filter((id) => message.guild.roles.cache.has(id)));
        }

        // Yetkili çekme statı
        await yetkiliStats.findOneAndUpdate(
          { guildID: message.guild.id, userID: message.author.id },
          {
            $inc: { count: 1 },
            $push: { users: { memberId: freshMember.id, roleId, date: Date.now() } },
          },
          { upsert: true, new: true }
        );

        // Görev sistemi: yetkili çekme ilerlemesi
        try {
          const authorId = message.author.id;
          let taskDoc = await userTask.findOne({ userId: authorId });
          if (!taskDoc) {
            taskDoc = await userTask.create({
              userId: authorId,
              roleId: message.member.roles.highest.id,
            });
          }

          // Yeni Yetkilinin Giriş Tarihini Kaydet (Eğer yoksa)
          const checkUser = await userTask.findOne({ userId: freshMember.id });
          if (!checkUser || !checkUser.staffStartDate) {
              await userTask.findOneAndUpdate(
                  { userId: freshMember.id },
                  { 
                      $set: { 
                          roleId: roleId,
                          staffStartDate: Date.now() 
                      } 
                  },
                  { upsert: true }
              );
          } else {
              await userTask.findOneAndUpdate(
                  { userId: freshMember.id },
                  { $set: { roleId: roleId } },
                  { upsert: true }
              );
          }

          const activeTask = await tasks.findOne({ currentRole: taskDoc.roleId });
          if (activeTask && activeTask.requiredCounts?.yetkili > 0) {
            const current = taskDoc.counts?.yetkili || 0;
            const required = activeTask.requiredCounts.yetkili;
            if (!taskDoc.completeds?.yetkili && current + 1 >= required) {
              await userTask.findOneAndUpdate(
                { userId: authorId },
                { $set: { "counts.yetkili": 0, "completeds.yetkili": true } },
                { upsert: true }
              );
            } else if (!taskDoc.completeds?.yetkili) {
              await userTask.findOneAndUpdate(
                { userId: authorId },
                { $inc: { "counts.yetkili": 1 } },
                { upsert: true }
              );
            }
          }
        } catch (e) {
          console.error("Yetkili görev ilerleme hatası:", e?.message || e);
        }

        const oryantasyonChannel = message.guild.channels.cache.get(setup.Oryantasyondurum);
        const rehberlikSorumlusu = setup.Sorumluluk?.StaffRoles?.rehberlik?.responsible;
        const basvuruLogChannel = message.guild.channels.cache.get(setup.BasvuruLogChannel);

        if (oryantasyonChannel) {
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("ory_baslat").setLabel("Oryantasyon Başlat").setStyle(ButtonStyle.Success).setEmoji("🚀"),
            new ButtonBuilder().setCustomId("ory_bitir").setLabel("Oryantasyon Bitir").setStyle(ButtonStyle.Danger).setEmoji("🏁")
          );

          await oryantasyonChannel.send({
            content: `${freshMember} Yetkili Oldu , <@&${rehberlikSorumlusu}> İlgilenir misiniz ?`,
            components: [row]
          });
        }

        if (basvuruLogChannel) {
          await basvuruLogChannel.send({
            embeds: [new EmbedBuilder()
              .setColor(0x2f3136)
              .setAuthor({ name: "Yetkili Alım Logu", iconURL: message.guild.iconURL({ dynamic: true }) })
              .setDescription(`${freshMember} kullanıcısı yetkili kadrosuna katıldı.`)
              .addFields(
                { name: "Yeni Yetkili", value: `${freshMember} (\`${freshMember.id}\`)`, inline: true },
                { name: "Alan Yetkili", value: `${message.author} (\`${message.author.id}\`)`, inline: true },
                { name: "Verilen Yetki", value: `${role}`, inline: true },
                { name: "Tarih", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
              )
              .setTimestamp()
            ]
          });
        }

        await interaction.reply({
          content: `${client.emoji("server_onay")} ${freshMember} kullanıcısına ${role} ve yönetim rolleri başarıyla verildi. Bu işlem **Yetkili Çekme** olarak statına işlendi.`,
          ephemeral: true,
        });

        collector.stop("done");
      } catch (err) {
        console.error("Yetkili alım hatası:", err);
        return interaction.reply({
          content: "Roller verilirken bir hata oluştu.",
          ephemeral: true,
        });
      }
    });

    collector.on("end", async () => {
      try {
        await msg.edit({ components: [] }).catch(() => { });
      } catch {
        // sessiz geç
      }
    });
  },
};

