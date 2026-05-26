const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");
const setup = require("../../../../../../Global/Settings/Setup.json");
const kanal = require("../../../../../../Global/Settings/AyarName");
const GuildTagService = require("../../../../../../Global/Services/GuildTagService");
const tagliStats = require("../../../../../../Global/Schemas/tagliStats");
const emojis = require("../../../../../../Global/Settings/Emojis.json");
const userTask = require("../../../../../../Global/Schemas/userTask");
const tasks = require("../../../../../../Global/Schemas/tasks");

module.exports = {
  name: "tag",
  description: "Belirttiğiniz kullanıcıyı tag almaya davet eder.",
  category: "STAT",
  cooldown: 0,
  command: {
    enabled: true,
    aliases: ["tagal", "tag-al", "tagdaveti"],
    usage: ".tag <@User/ID>",
  },

  onLoad: function (client) {},

  onCommand: async function (client, message, args) {
    // Sadece teyit sorumluları (register sorumlusu & lideri) ve admin kullanabilsin
    const staffRoles = setup.Sorumluluk?.StaffRoles?.register || {};
    const allowedRoleIds = [staffRoles.responsible, staffRoles.leader].filter(Boolean);
    const hasAuthority =
      allowedRoleIds.some((id) => message.member.roles.cache.has(id)) ||
      message.member.permissions.has(PermissionsBitField.Flags.Administrator);

    if (!hasAuthority) {
      message.react(emojis.server_carpi || client.emoji("server_carpi") || "❌");
      return message
        .reply({ content: "Bu komutu sadece teyit sorumluları kullanabilir." })
        .then((e) => setTimeout(() => e.delete().catch(() => {}), 5000));
    }

    const member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);

    if (!member) {
      return message
        .reply({ content: "Bir kullanıcı etiketlemelisin ya da ID'sini girmelisin.\nÖrn: `.tag @Üye`" })
        .then((e) => setTimeout(() => e.delete().catch(() => {}), 7000));
    }

    if (member.user.bot) {
      return message
        .reply({ content: "Botlara tag daveti gönderemezsin." })
        .then((e) => setTimeout(() => e.delete().catch(() => {}), 5000));
    }

    if (member.id === message.author.id) {
      return message
        .reply({ content: "Kendine tag daveti gönderemezsin." })
        .then((e) => setTimeout(() => e.delete().catch(() => {}), 5000));
    }

    const alreadyTagged = await GuildTagService.memberHasGuildTag(client, member);
    if (alreadyTagged) {
      return message
        .reply({ content: `${member} kullanıcısının profilinde zaten sunucu tagı bulunuyor.` })
        .then((e) => setTimeout(() => e.delete().catch(() => {}), 7000));
    }

    const serverTag = Array.isArray(setup.ServerTag)
      ? setup.ServerTag[0]
      : setup.ServerTag || "";

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("tag_onay")
        .setLabel("Kabul Ediyorum")
        .setStyle(ButtonStyle.Success)
        .setEmoji(emojis.server_onay || "✅"),
      new ButtonBuilder()
        .setCustomId("tag_reddet")
        .setLabel("Reddediyorum")
        .setStyle(ButtonStyle.Danger)
        .setEmoji(emojis.server_carpi || "❌")
    );

    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("tag_onay")
        .setLabel("Kabul Ediyorum")
        .setStyle(ButtonStyle.Success)
        .setEmoji(emojis.server_onay || "✅")
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId("tag_reddet")
        .setLabel("Reddediyorum")
        .setStyle(ButtonStyle.Danger)
        .setEmoji(emojis.server_carpi || "❌")
        .setDisabled(true)
    );

    const inviteEmbed = new EmbedBuilder()
      .setColor(0x2f3136)
      .setAuthor({
        name: message.guild.name,
        iconURL: message.guild.iconURL({ dynamic: true }) || undefined,
      })
      .setDescription(
        `${emojis.server_star || "⭐"} ${member}, ${message.member} seni sunucu tagımızı almaya davet ediyor.\n\n` +
          `${emojis.server_info || "ℹ️"} **Tagımız:** \`${serverTag || "Belirtilmemiş"}\`\n` +
          `${emojis.server_nokta || "•"} Profiline bu tagı ekleyip butona basarak daveti **kabul edebilirsin**.\n\n` +
          `> <@${member.id}> , <@${message.author.id}> seni tag almaya davet ediyor, **kabul ediyor musun?**`
      )
      .setFooter({
        text: "Tag Davet Sistemi",
        iconURL: message.author.displayAvatarURL({ dynamic: true }) || undefined,
      })
      .setTimestamp();

    message.react(emojis.server_onay || client.emoji("server_onay") || "✅");

    const msg = await message.channel.send({
      content: `${member}`,
      embeds: [inviteEmbed],
      components: [row],
    });

    const filter = (i) => i.user.id === member.id;
    const collector = msg.createMessageComponentCollector({
      filter,
      time: 60000,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.customId === "tag_onay") {
        await interaction.deferUpdate().catch(() => {});

        // İkinci kez taglı olmuş mu diye tekrar kontrol et
        const nowTagged = await GuildTagService.memberHasGuildTag(client, member);
        if (!nowTagged) {
          await msg
            .edit({
              embeds: [
                inviteEmbed.setDescription(
                  `${emojis.server_info || "ℹ️"} Tag davetini **kabul ettin**, ancak profilinde henüz tagımız bulunmuyor.\n\n` +
                    `${emojis.server_nokta1 || "•"} Lütfen önce ismine tagı ekle, ardından tekrar davet alabilirsin.`
                ),
              ],
              components: [disabledRow],
            })
            .catch(() => {});
          return;
        }

        // Stat güncelle (taglı çekme)
        await tagliStats.findOneAndUpdate(
          { guildID: message.guild.id, userID: message.author.id },
          {
            $inc: { count: 1 },
            $push: { users: { memberId: member.id, date: Date.now() } },
          },
          { upsert: true, new: true }
        );

        // Görev sistemi
        try {
          const authorId = message.author.id;
          // Ana Görev
          await userTask.findOneAndUpdate(
              { userId: authorId },
              { $inc: { "counts.tagli": 1 } },
              { upsert: true }
          );

          // Sorumluluk Görevi (Teyit Sorumlusu)
          await require("../../../../../../Global/Schemas/userResponsibilityTask").findOneAndUpdate(
              { userId: authorId, responsibilityKey: "register" },
              { $inc: { "counts.tagli": 1 } }
          );
        } catch (e) {
          console.error("Tag görev ilerleme hatası:", e?.message || e);
        }


        const successEmbed = new EmbedBuilder()
          .setColor(0x57f287)
          .setAuthor({
            name: member.displayName,
            iconURL: member.user.displayAvatarURL({ dynamic: true }) || undefined,
          })
          .setDescription(
            `${emojis.server_onay || "✅"} ${member} kullanıcısı, ${message.member} tarafından yapılan **tag davetini kabul etti.**\n\n` +
              `${emojis.server_star2 || "✨"} Bu işlem, ${message.member} kullanıcısının **statına taglı çekme** olarak işlendi.`
          )
          .setFooter({
            text: `Taglı Çekme • ${message.author.tag}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true }) || undefined,
          })
          .setTimestamp();

        await msg.edit({ embeds: [successEmbed], components: [disabledRow] }).catch(() => {});
      }

      if (interaction.customId === "tag_reddet") {
        await interaction.deferUpdate().catch(() => {});

        const rejectEmbed = new EmbedBuilder()
          .setColor(0xed4245)
          .setAuthor({
            name: member.displayName,
            iconURL: member.user.displayAvatarURL({ dynamic: true }) || undefined,
          })
          .setDescription(
            `${emojis.server_carpi || "❌"} ${member} kullanıcısı, ${message.member} tarafından yapılan **tag davetini reddetti.**`
          )
          .setFooter({
            text: message.author.tag,
            iconURL: message.author.displayAvatarURL({ dynamic: true }) || undefined,
          })
          .setTimestamp();

        await msg.edit({ embeds: [rejectEmbed], components: [disabledRow] }).catch(() => {});
      }
    });

    collector.on("end", async () => {
      try {
        await msg.edit({ components: [disabledRow] }).catch(() => {});
      } catch {
        // sessiz geç
      }
    });
  },
};

