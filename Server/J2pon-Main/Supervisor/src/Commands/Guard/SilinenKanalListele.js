const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
} = require("discord.js");
const j2poncik = require("../../../../../../Global/Settings/System");
const Setup = require("../../../../../../Global/Settings/Setup.json");
const DeletedChannel = require("../../../../../J2pon-Guard/Schemas/Backup/Deleted.Channels");

module.exports = {
  name: "silinen-kanal-listele",
  description: "Son silinen kanal ve kategorileri listeler ve butonla geri yüklemenizi sağlar.",
  category: "OWNER",
  cooldown: 0,
  command: {
    enabled: true,
    aliases: ["silinenkanallar", "silinen-kanallar", "kanal-geri-yukle"],
    usage: ".silinen-kanal-listele",
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

      const backups = await DeletedChannel.find({
        guildID: message.guild.id,
      })
        .sort({ deletedAt: -1 })
        .limit(25)
        .lean();

      if (!backups || backups.length === 0) {
        return message.reply({
          embeds: [
            byj2ponembed.setDescription(
              `${client.emoji("server_carpi")} Bu sunucuda henüz yedeklenmiş silinmiş bir kanal veya kategori bulunmuyor.`
            ),
          ],
        });
      }

      const typeEmoji = (type) => {
        if (type === ChannelType.GuildCategory) return "📂";
        if (type === ChannelType.GuildVoice) return "🔊";
        return "💬";
      };

      const lines = backups.map((c, index) => {
        const deletedAt = c.deletedAt
          ? `<t:${Math.floor(c.deletedAt / 1000)}:R>`
          : "Bilinmiyor";
        return `\`${index + 1}.\` ${typeEmoji(c.type)} **${c.name || "İsimsiz Kanal"}** \`(${c.channelID})\` • Pozisyon: \`${c.position}\` • Silinme: ${deletedAt}`;
      });

      const options = backups.map((c, index) => ({
        label: `${index + 1}. ${c.name || "İsimsiz Kanal"}`.slice(0, 100),
        description: `ID: ${c.channelID}`.slice(0, 100),
        value: String(c._id),
      }));

      const selectRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("deleted_channel_select")
          .setPlaceholder("Geri yüklemek istediğin kanal/kategoriyi seç.")
          .setMinValues(1)
          .setMaxValues(1)
          .setOptions(options)
      );

      const controlRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("deleted_channel_cancel")
          .setLabel("İptal")
          .setStyle(ButtonStyle.Secondary)
      );

      const embed = new EmbedBuilder()
        .setColor("#2F3136")
        .setTitle("🗑️ Silinen Kanallar & Kategoriler")
        .setDescription(
          [
            `${client.emoji(
              "server_bilgi"
            )} Aşağıda son silinen kanal ve kategorilerin listesi bulunuyor.`,
            "Seçim menüsünden bir kanal/kategori seçerek **izinleri ve parent bilgisiyle birlikte geri yükleyebilirsin.**",
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
          if (interaction.customId === "deleted_channel_cancel") {
            await interaction.deferUpdate();
            collector.stop("cancel");
            return;
          }

          if (interaction.customId !== "deleted_channel_select") return;

          await interaction.deferUpdate();
          const selectedId = interaction.values[0];
          const backup = await DeletedChannel.findById(selectedId);
          if (!backup) {
            return interaction.followUp({
              content: `${client.emoji(
                "server_carpi"
              )} Seçilen kayda ulaşılamadı, muhtemelen silinmiş.`,
              ephemeral: true,
            });
          }

          const parent =
            backup.parentID && message.guild.channels.cache.get(backup.parentID)
              ? backup.parentID
              : null;

          let created;
          if (backup.type === ChannelType.GuildCategory) {
            created = await message.guild.channels.create({
              name: backup.name || "Geri Yüklenen Kategori",
              type: ChannelType.GuildCategory,
              position: typeof backup.position === "number"
                ? backup.position
                : 0,
              reason: "Silinen kategori yedeğinden geri yükleme",
            });
          } else if (backup.type === ChannelType.GuildVoice) {
            created = await message.guild.channels.create({
              name: backup.name || "Geri Yüklenen Ses Kanalı",
              type: ChannelType.GuildVoice,
              parent: parent || undefined,
              position: typeof backup.position === "number"
                ? backup.position
                : 0,
              bitrate:
                typeof backup.bitrate === "number" && backup.bitrate > 0
                  ? backup.bitrate
                  : 64000,
              userLimit:
                typeof backup.userLimit === "number" ? backup.userLimit : 0,
              reason: "Silinen ses kanalı yedeğinden geri yükleme",
            });
          } else {
            created = await message.guild.channels.create({
              name: backup.name || "Geri Yüklenen Kanal",
              type: ChannelType.GuildText,
              parent: parent || undefined,
              topic: backup.topic || null,
              nsfw: !!backup.nsfw,
              position: typeof backup.position === "number"
                ? backup.position
                : 0,
              rateLimitPerUser:
                typeof backup.rateLimit === "number" ? backup.rateLimit : 0,
              reason: "Silinen metin kanalı yedeğinden geri yükleme",
            });
          }

          // İzinleri geri kur
          const overwrites = Array.isArray(backup.overwrites)
            ? backup.overwrites
            : [];
          for (const overwrite of overwrites) {
            try {
              const target =
                overwrite.type === 0
                  ? message.guild.roles.cache.get(overwrite.id)
                  : message.guild.members.cache.get(overwrite.id);
              if (!target) continue;

              await created.permissionOverwrites
                .edit(target, {
                  allow: new PermissionsBitField(
                    BigInt(String(overwrite.allow || "0"))
                  ),
                  deny: new PermissionsBitField(
                    BigInt(String(overwrite.deny || "0"))
                  ),
                })
                .catch(() => {});
              await new Promise((res) => setTimeout(res, 100));
            } catch {
              // tek tek izin hatalarını yoksay
            }
          }

          backup.restored = true;
          await backup.save().catch(() => {});

          const resultEmbed = new EmbedBuilder()
            .setColor("#57F287")
            .setTitle("✅ Kanal/Kategori Geri Yüklendi")
            .setDescription(
              [
                `${client.emoji("server_onay")} **${
                  backup.name || "İsimsiz Kanal"
                }** başarıyla geri yüklendi.`,
                `• Yeni Kanal: ${created} \`(${created.id})\``,
                `• Tür: ${
                  backup.type === ChannelType.GuildCategory
                    ? "Kategori"
                    : backup.type === ChannelType.GuildVoice
                    ? "Ses Kanalı"
                    : "Metin Kanalı"
                }`,
                `• İzin Sayısı: \`${overwrites.length}\``,
                parent
                  ? `• Üst Kategori: <#${parent}>`
                  : "> Not: Orijinal üst kategori bulunamadığı için kök olarak oluşturuldu.",
              ].join("\n")
            )
            .setTimestamp();

          await interaction.followUp({
            embeds: [
              resultEmbed,
            ],
            ephemeral: true,
          });

          // Log kanalına gönder (kanal restore logu)
          const restoreLogId = Setup.GuardChannelRestoreLogChannel;
          const restoreLogChannel = restoreLogId
            ? message.guild.channels.cache.get(restoreLogId)
            : null;

          if (restoreLogChannel) {
            restoreLogChannel
              .send({
                embeds: [
                  resultEmbed.setFooter({
                    text: `${message.author.tag} tarafından kanal/kategori yedeğinden geri yüklendi`,
                    iconURL: message.author.displayAvatarURL({
                      dynamic: true,
                    }),
                  }),
                ],
              })
              .catch(() => {});
          }
        } catch (err) {
          console.error("SilinenKanalListele interaction error:", err);
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
      console.error("SilinenKanalListele command error:", error);
      message
        .reply({
          embeds: [
            byj2ponembed.setDescription(
              `Silinen kanallar listelenirken bir hata oluştu: \`${error.message}\``
            ),
          ],
        })
        .then((e) => setTimeout(() => e.delete().catch(() => {}), 5000));
    }
  },
};

