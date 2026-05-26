const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const j2poncik = require("../../../../../../Global/Settings/System");
const Setup = require("../../../../../../Global/Settings/Setup.json");
const DeletedRole = require("../../../../../J2pon-Guard/Schemas/Backup/Deleted.Roles");

module.exports = {
  name: "silinen-rol-listele",
  description: "Son silinen rolleri listeler ve butonla geri yüklemenizi sağlar.",
  category: "OWNER",
  cooldown: 0,
  command: {
    enabled: true,
    aliases: ["silinenroller", "silinen-roller", "rol-geri-yukle"],
    usage: ".silinen-rol-listele",
  },

  onLoad: function (client) {},

  onCommand: async function (client, message, args, byj2ponembed) {
    try {
      if (!message.guild || !message.member) return;

      if (
        !j2poncik.BotsOwners.includes(message.author.id) &&
        message.guild.ownerId !== message.author.id
      ) {
        return message.reply({
          content: `${client.emoji("server_carpi")} Bu komutu sadece sunucu sahibi ve bot sahipleri kullanabilir!`,
        });
      }

      const backups = await DeletedRole.find({
        guildID: message.guild.id,
      })
        .sort({ deletedAt: -1 })
        .limit(25)
        .lean();

      if (!backups || backups.length === 0) {
        return message.reply({
          embeds: [
            byj2ponembed.setDescription(
              `${client.emoji("server_carpi")} Bu sunucuda henüz yedeklenmiş silinmiş bir rol bulunmuyor.`
            ),
          ],
        });
      }

      const lines = backups.map((r, index) => {
        const deletedAt = r.deletedAt
          ? `<t:${Math.floor(r.deletedAt / 1000)}:R>`
          : "Bilinmiyor";
        return `\`${index + 1}.\` **${r.name || "İsimsiz Rol"}** \`(${r.roleID})\` • Üye: \`${(r.members || []).length}\` • Silinme: ${deletedAt}`;
      });

      const options = backups.map((r, index) => ({
        label: `${index + 1}. ${r.name || "İsimsiz Rol"}`.slice(0, 100),
        description: `ID: ${r.roleID}`.slice(0, 100),
        value: String(r._id),
      }));

      const selectRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("deleted_role_select")
          .setPlaceholder("Geri yüklemek istediğin rolü seç.")
          .setMinValues(1)
          .setMaxValues(1)
          .setOptions(options)
      );

      const controlRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("deleted_role_cancel")
          .setLabel("İptal")
          .setStyle(ButtonStyle.Secondary)
      );

      const embed = new EmbedBuilder()
        .setColor("#2F3136")
        .setTitle("🗑️ Silinen Roller")
        .setDescription(
          [
            `${client.emoji("server_bilgi")} Aşağıda son silinen rollerin listesi bulunuyor.`,
            "Seçim menüsünden bir rol seçerek **izinleri ve üyeleriyle birlikte geri yükleyebilirsin.**",
            "",
            lines.join("\n"),
          ].join("\n")
        )
        .setTimestamp();

      const listMsg = await message.reply({
        embeds: [embed],
        components: [selectRow, controlRow],
      });

      const filter = (i) => i.user.id === message.author.id;
      const collector = listMsg.createMessageComponentCollector({
        filter,
        time: 1000 * 60 * 5,
      });

      collector.on("collect", async (interaction) => {
        try {
          if (interaction.customId === "deleted_role_cancel") {
            await interaction.deferUpdate();
            collector.stop("cancel");
            return;
          }

          if (interaction.customId !== "deleted_role_select") return;

          await interaction.deferUpdate();
          const selectedId = interaction.values[0];
          const backup = await DeletedRole.findById(selectedId);
          if (!backup) {
            return interaction.followUp({
              content: `${client.emoji(
                "server_carpi"
              )} Seçilen kayda ulaşılamadı, muhtemelen silinmiş.`,
              ephemeral: true,
            });
          }

          // Zaten aynı isimde rol varsa uyar ama yine de yeni oluştur
          const existing = message.guild.roles.cache.find(
            (r) => r.name === backup.name
          );

          const newRole = await message.guild.roles.create({
            name: backup.name || "Geri Yüklenen Rol",
            hoist: !!backup.hoist,
            permissions: BigInt(String(backup.permissions || "0")),
            mentionable: !!backup.mentionable,
            position: typeof backup.position === "number" ? backup.position : 0,
            reason: "Silinen rol yedeğinden geri yükleme",
          });

          // Üyelere rolü geri ver
          const memberIds = Array.isArray(backup.members) ? backup.members : [];
          for (const memberId of memberIds) {
            const member = message.guild.members.cache.get(memberId);
            if (!member) continue;
            if (member.roles.cache.has(newRole.id)) continue;
            await member.roles.add(newRole).catch(() => {});
            await new Promise((res) => setTimeout(res, 100));
          }

          // Kanal izinlerini geri kur
          const overwrites = Array.isArray(backup.channelOverwrites)
            ? backup.channelOverwrites
            : [];
          for (const perm of overwrites) {
            const ch = message.guild.channels.cache.get(perm.id);
            if (!ch) continue;
            const newPerm = {};
            (perm.allow || []).forEach((p) => {
              newPerm[p] = true;
            });
            (perm.deny || []).forEach((p) => {
              newPerm[p] = false;
            });
            await ch.permissionOverwrites
              .edit(newRole, newPerm)
              .catch(() => {});
            await new Promise((res) => setTimeout(res, 100));
          }

          backup.restored = true;
          await backup.save().catch(() => {});

          const resultEmbed = new EmbedBuilder()
            .setColor("#57F287")
            .setTitle("✅ Rol Geri Yüklendi")
            .setDescription(
              [
                `${client.emoji(
                  "server_onay"
                )} **${backup.name || "İsimsiz Rol"}** başarıyla geri yüklendi.`,
                `• Yeni Rol: ${newRole} \`(${newRole.id})\``,
                `• Üye Sayısı: \`${memberIds.length}\``,
                `• Kanal İzni Sayısı: \`${overwrites.length}\``,
                existing
                  ? "\n> Not: Sunucuda aynı isimde eski bir rol bulundu, çakışmaları manuel kontrol etmen önerilir."
                  : "",
              ].join("\n")
            )
            .setTimestamp();

          await interaction.followUp({
            embeds: [
              resultEmbed,
            ],
            ephemeral: true,
          });

          // Log kanalına da gönder (rol + kategori geri yükleme logu)
          const restoreLogId = Setup.GuardRoleCategoryRestoreLogChannel;
          const restoreLogChannel = restoreLogId
            ? message.guild.channels.cache.get(restoreLogId)
            : null;

          if (restoreLogChannel) {
            restoreLogChannel
              .send({
                embeds: [
                  resultEmbed.setFooter({
                    text: `${message.author.tag} tarafından rol yedeğinden geri yüklendi`,
                    iconURL: message.author.displayAvatarURL({
                      dynamic: true,
                    }),
                  }),
                ],
              })
              .catch(() => {});
          }
        } catch (err) {
          console.error("SilinenRolListele interaction error:", err);
          if (!interaction.deferred && !interaction.replied) {
            interaction
              .reply({
                content: `İşlem sırasında bir hata oluştu: \`${err.message}\``,
                ephemeral: true,
              })
              .catch(() => {});
          }
        }
      });

      collector.on("end", () => {
        listMsg.edit({ components: [] }).catch(() => {});
      });
    } catch (error) {
      console.error("SilinenRolListele command error:", error);
      message
        .reply({
          embeds: [
            byj2ponembed.setDescription(
              `Silinen roller listelenirken bir hata oluştu: \`${error.message}\``
            ),
          ],
        })
        .then((e) => setTimeout(() => e.delete().catch(() => {}), 5000));
    }
  },
};

