const { Event } = require("../../../Structures/Default.Events");
const Guild = require("../../../../../Global/Settings/System");
const Setup = require("../../../../../Global/Settings/Setup.json");
const { Collection, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const GuardData = require("../../../Schemas/Guard");
const fetch = require("node-fetch");
const TextChannels = require("../../../Schemas/Backup/Guild.Text.Channels");
const VoiceChannels = require("../../../Schemas/Backup/Guild.Voice.Channels");
const guardPenaltyDB = require("../../../Schemas/guardPenalty");
const DeletedChannel = require("../../../Schemas/Backup/Deleted.Channels");

class channelDelete extends Event {
  constructor(client) {
    super(client, {
      name: "channelDelete",
      enabled: true,
    });
  }

  async onLoad(channel) {
    if (!channel.guild || channel.guild.id !== Guild.ServerID) return;
    const guild = channel.guild;

    // Silinen kanalın tam yedeğini (izinler, parent, pozisyon vs.) kaydet
    try {
      const overwrites = [];
      channel.permissionOverwrites?.cache?.forEach((perm) => {
        overwrites.push({
          id: perm.id,
          type: perm.type,
          allow: String(perm.allow?.bitfield || "0"),
          deny: String(perm.deny?.bitfield || "0"),
        });
      });

      let deletedBy = null;
      try {
        const logs = await guild.fetchAuditLogs({ type: 12 }).catch(() => null); // ChannelDelete
        const entry = logs?.entries.first();
        if (entry && entry.targetId === channel.id && Date.now() - entry.createdTimestamp < 15000) {
          deletedBy = entry.executor?.id || null;
        }
      } catch {
        // audit log hatası önemli değil
      }

      await DeletedChannel.findOneAndUpdate(
        { guildID: guild.id, channelID: channel.id },
        {
          $set: {
            guildID: guild.id,
            channelID: channel.id,
            type: channel.type,
            name: channel.name,
            topic: channel.topic,
            nsfw: !!channel.nsfw,
            parentID: channel.parentId || null,
            position: channel.position,
            rateLimit: channel.rateLimitPerUser || 0,
            bitrate: channel.bitrate || 0,
            userLimit: channel.userLimit || 0,
            overwrites,
            deletedBy,
            deletedAt: Date.now(),
            restored: false,
          },
        },
        { upsert: true }
      );

      // RolDelete eventindeki gibi: kanal/kategori silindiğinde belirlenen kanala log mesajı at
      try {
        const deleteLogId = Setup.GuardChannelRestoreLogChannel;
        let deleteLogChannel = null;
        if (deleteLogId) {
          deleteLogChannel = guild.channels.cache.get(deleteLogId) || null;
        }
        if (!deleteLogChannel) {
          deleteLogChannel = guild.channels.cache.find((x) => x.name === "guard_log") || null;
        }

        if (deleteLogChannel) {
          const typeLabel =
            channel.type === 4
              ? "Kategori"
              : channel.type === 2
              ? "Ses Kanalı"
              : "Metin Kanalı";

          const embed = new EmbedBuilder()
            .setTitle("🗑️ Kanal/Kategori Silindi (Yedek Alındı)")
            .setColor("#ffcc00")
            .setDescription(
              [
                `**Kanal:** \`${channel.name}\` (\`${channel.id}\`)`,
                `**Tür:** \`${typeLabel}\``,
                `**Silinen Üye:** ${
                  deletedBy ? `<@${deletedBy}> (\`${deletedBy}\`)` : "Bilinmiyor"
                }`,
                `**Üst Kategori:** ${
                  channel.parentId ? `<#${channel.parentId}>` : "Yok"
                }`,
                `**İzin Sayısı:** \`${overwrites.length}\``,
                "",
                "Bu kanal/kategori için detaylı yedek **/silinen-kanal-listele** komutuyla veya aşağıdaki butonla geri yüklenebilir.",
              ].join("\n")
            )
            .setTimestamp();

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`guard_restore_channel_${channel.id}`)
              .setLabel("Kanalı/Kategoriyi Geri Yükle")
              .setStyle(ButtonStyle.Success)
          );

          const msg = await deleteLogChannel
            .send({ embeds: [embed], components: [row] })
            .catch(() => null);

          if (msg) {
            const collector = msg.createMessageComponentCollector({
              filter: (i) => i.customId === `guard_restore_channel_${channel.id}`,
              max: 1,
              time: 1000 * 60 * 5,
            });

            collector.on("collect", async (interaction) => {
              try {
                await interaction.deferReply({ ephemeral: true });

                const backup = await DeletedChannel.findOne({
                  guildID: guild.id,
                  channelID: channel.id,
                });
                if (!backup) {
                  return interaction.editReply({
                    content: "Yedek kaydı bulunamadı veya silinmiş.",
                  });
                }

                let parent = null;
                if (backup.parentID && guild.channels.cache.has(backup.parentID)) {
                  parent = backup.parentID;
                }

                // Overwriteleri PermissionsBitField'e çevir
                const backupOverwrites = Array.isArray(backup.overwrites)
                  ? backup.overwrites
                  : [];
                const permissionOverwrites = backupOverwrites.map((o) => ({
                  id: o.id,
                  type: o.type,
                  allow: new PermissionsBitField(
                    BigInt(String(o.allow || "0"))
                  ),
                  deny: new PermissionsBitField(
                    BigInt(String(o.deny || "0"))
                  ),
                }));

                let created;
                if (backup.type === 4) {
                  // Kategori
                  created = await guild.channels.create({
                    name: backup.name || "Geri Yüklenen Kategori",
                    type: 4,
                    position:
                      typeof backup.position === "number" ? backup.position : 0,
                    permissionOverwrites,
                    reason: "Silinen kategori yedeğinden buton ile geri yükleme",
                  });
                } else if (backup.type === 2) {
                  // Ses kanalı
                  created = await guild.channels.create({
                    name: backup.name || "Geri Yüklenen Ses Kanalı",
                    type: 2,
                    parent: parent || undefined,
                    position:
                      typeof backup.position === "number" ? backup.position : 0,
                    bitrate:
                      typeof backup.bitrate === "number" && backup.bitrate > 0
                        ? backup.bitrate
                        : 64000,
                    userLimit:
                      typeof backup.userLimit === "number"
                        ? backup.userLimit
                        : 0,
                    permissionOverwrites,
                    reason: "Silinen ses kanalı yedeğinden buton ile geri yükleme",
                  });
                } else {
                  // Metin kanalı
                  created = await guild.channels.create({
                    name: backup.name || "Geri Yüklenen Kanal",
                    type: 0,
                    parent: parent || undefined,
                    topic: backup.topic || null,
                    nsfw: !!backup.nsfw,
                    position:
                      typeof backup.position === "number" ? backup.position : 0,
                    rateLimitPerUser:
                      typeof backup.rateLimit === "number"
                        ? backup.rateLimit
                        : 0,
                    permissionOverwrites,
                    reason: "Silinen metin kanalı yedeğinden buton ile geri yükleme",
                  });
                }

                backup.restored = true;
                await backup.save().catch(() => {});

                await interaction.editReply({
                  content: `✅ **${
                    backup.name || "İsimsiz Kanal"
                  }** başarıyla geri yüklendi. (Yeni Kanal: #${
                    created.name
                  } - ${created.id})`,
                });

                // Butonu tek kullanımlık yap
                msg.edit({ components: [] }).catch(() => {});
              } catch (e) {
                console.error(
                  "[GUARD] channelDelete button restore error:",
                  e
                );
                if (!interaction.replied && !interaction.deferred) {
                  interaction
                    .reply({
                      content: "Kanal/kategori geri yüklenirken bir hata oluştu.",
                      ephemeral: true,
                    })
                    .catch(() => {});
                }
              }
            });

            collector.on("end", () => {
              msg.edit({ components: [] }).catch(() => {});
            });
          }
        }
      } catch {
        // log hatası önemli değil
      }
    } catch (err) {
      console.error("[GUARD] channelDelete backup error:", err);
    }

    const Guard = await GuardData.findOne({ guildID: guild.id });
    const channelguardonly = Guard ? Guard.channelsGuard : false;
    if (channelguardonly == true) {
      let entry = await guild.fetchAuditLogs({ type: 12 }).then((audit) => audit.entries.first());
      const j2ponnew = await guild.members.cache.get(entry.executor.id);
      const log = guild.channels.cache.find((x) => x.name == "guard_log");
      const restoreLogId = Setup.GuardChannelRestoreLogChannel;
      const restoreLogChannel = restoreLogId
        ? guild.channels.cache.get(restoreLogId)
        : null;
      const embed = new EmbedBuilder({
        title: "Server channel Protection - Security II",
        footer: { text: `Server Security`, iconURL: client.user.avatarURL() },
      });
      if (entry.executor.id == guild.ownerId) return;

      if (!entry || !entry.executor || Date.now() - entry.createdTimestamp > 5000 || j2ponnew.user.bot) return;
      if (await guvenli(j2ponnew, "channel") == true) {
        await guardPenaltyDB.findOneAndUpdate(
          { guildID: guild.id, j2ponnew: j2ponnew.id },
          { $push: { işlemler: { Güvenilir: true, işlem: `Kanal Sildi`, Tarih: Date.now() } } },
          { upsert: true }
        );
        if (log)
          return log.send({
            embeds: [
              embed
                .setAuthor({ name: `Trustworthy ✅`, iconURL: guild.iconURL() })
                .setDescription(
                  `${j2ponnew}, \`${new Date(Date.now()).toTurkishFormatDate()}\` tarihinde **${channel.name}** isimli kanalı sildi.`
                ),
            ],
          });
        return; // Whitelist'teyse işlemi durdur
      }
      await ytkapa(Guild.ServerID);
      await sik(guild, j2ponnew.id, "am");
      await guardPenaltyDB.findOneAndUpdate(
        { guildID: guild.id, j2ponnew: j2ponnew.id },
        { $push: { işlemler: { Güvenilir: false, işlem: `Kanal Sildi (${channel.id})`, Tarih: Date.now() } } },
        { upsert: true }
      );
      let newChannel;
      if (channel.type === 0 || channel.type === 5) {
        newChannel = await channel.guild.channels.create({
          name: channel.name,
          type: 0,
          topic: channel.topic,
          nsfw: channel.nsfw,
          parent: channel.parent,
          position: channel.position + 1,
          rateLimitPerUser: channel.rateLimitPerUser,
        });
        if (log)
          log.send({
            embeds: [
              embed
                .setAuthor({ name: `Not safe ❎`, iconURL: guild.iconURL() })
                .setDescription(
                  `${j2ponnew}, \`${new Date(Date.now()).toTurkishFormatDate()}\` tarihinde **${channel.name} - ${channel.id}** isimli kanalı sildiği için kendisini yasakladım ve kanalı geri açıp izinlerini ayarladım!`
                ),
            ],
          });
        if (restoreLogChannel) {
          restoreLogChannel
            .send({
              embeds: [
                embed
                  .setAuthor({ name: "Kanal Otomatik Geri Yüklendi ✅", iconURL: guild.iconURL() })
                  .setDescription(
                    [
                      `Silinen text kanal otomatik olarak geri yüklendi.`,
                      `• Eski Kanal: \`${channel.name}\` (\`${channel.id}\`)`,
                      `• Yeni Kanal: ${newChannel} (\`${newChannel.id}\`)`,
                      `• İşlemi Yapan: ${j2ponnew} (\`${j2ponnew.id}\`)`,
                      `• Tür: Metin Kanalı`,
                    ].join("\n")
                  ),
              ],
            })
            .catch(() => {});
        }
      }
      if (channel.type === 2) {
        newChannel = await channel.guild.channels.create({
          name: channel.name,
          type: 2,
          bitrate: channel.bitrate,
          userLimit: channel.userLimit,
          parent: channel.parent,
          position: channel.position + 1,
        });
        if (log)
          log.send({
            embeds: [
              embed
                .setAuthor({ name: `Not safe ❎`, iconURL: guild.iconURL() })
                .setDescription(
                  `${j2ponnew}, \`${new Date(Date.now()).toTurkishFormatDate()}\` tarihinde **${channel.name} - ${channel.id}** isimli Ses kanalı sildiği için kendisini yasakladım ve kanalı geri açıp izinlerini ayarladım!`
                ),
            ],
          });
        if (restoreLogChannel) {
          restoreLogChannel
            .send({
              embeds: [
                embed
                  .setAuthor({ name: "Kanal Otomatik Geri Yüklendi ✅", iconURL: guild.iconURL() })
                  .setDescription(
                    [
                      `Silinen ses kanalı otomatik olarak geri yüklendi.`,
                      `• Eski Kanal: \`${channel.name}\` (\`${channel.id}\`)`,
                      `• Yeni Kanal: ${newChannel} (\`${newChannel.id}\`)`,
                      `• İşlemi Yapan: ${j2ponnew} (\`${j2ponnew.id}\`)`,
                      `• Tür: Ses Kanalı`,
                    ].join("\n")
                  ),
              ],
            })
            .catch(() => {});
        }
      }
      if (channel.type === 4) {
        newChannel = await channel.guild.channels.create({
          name: channel.name,
          type: 4,
          position: channel.position + 1,
        });
        const textChannels = await TextChannels.find({ parentID: channel.id });
        await TextChannels.updateMany({ parentID: channel.id }, { parentID: newChannel.id });
        textChannels.forEach((c) => {
          const textChannel = channel.guild.channels.cache.get(c.channelID);
          if (textChannel) textChannel.setParent(newChannel, { lockPermissions: false });
        });
        const voiceChannels = await VoiceChannels.find({ parentID: channel.id });
        await VoiceChannels.updateMany({ parentID: channel.id }, { parentID: newChannel.id });
        voiceChannels.forEach((c) => {
          const voiceChannel = channel.guild.channels.cache.get(c.channelID);
          if (voiceChannel) voiceChannel.setParent(newChannel, { lockPermissions: false });
        });
        if (log)
          log.send({
            embeds: [
              embed
                .setAuthor({ name: `Not safe ❎`, iconURL: guild.iconURL() })
                .setDescription(
                  `${j2ponnew}, \`${new Date(Date.now()).toTurkishFormatDate()}\` tarihinde **${channel.name} - ${channel.id}** isimli Kategoriyi sildiği için kendisini yasakladım ve kanalı geri açıp izinlerini ve kanallarını ayarladım!`
                ),
            ],
          });
        if (restoreLogChannel) {
          restoreLogChannel
            .send({
              embeds: [
                embed
                  .setAuthor({ name: "Kategori Otomatik Geri Yüklendi ✅", iconURL: guild.iconURL() })
                  .setDescription(
                    [
                      `Silinen kategori otomatik olarak geri yüklendi.`,
                      `• Eski Kategori: \`${channel.name}\` (\`${channel.id}\`)`,
                      `• Yeni Kategori: ${newChannel} (\`${newChannel.id}\`)`,
                      `• İşlemi Yapan: ${j2ponnew} (\`${j2ponnew.id}\`)`,
                      `• Bağlı Text Kanal Sayısı: \`${textChannels.length}\``,
                      `• Bağlı Ses Kanal Sayısı: \`${voiceChannels.length}\``,
                    ].join("\n")
                  ),
              ],
            })
            .catch(() => {});
        }
      }
      channel.permissionOverwrites.cache.forEach((perm) => {
        let thisPermOverwrites = {};
        perm.allow.toArray().forEach((p) => {
          thisPermOverwrites[p] = true;
        });
        perm.deny.toArray().forEach((p) => {
          thisPermOverwrites[p] = false;
        });
        newChannel.permissionOverwrites.create(perm.id, thisPermOverwrites);
      });
      await dataCheck(channel.id, newChannel.id, "channel");
    }
  }
}

module.exports = channelDelete;