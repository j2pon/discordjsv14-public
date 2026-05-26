const { EmbedBuilder } = require("discord.js");
const guard = require("../../../../../J2pon-Guard/Schemas/Guard");
const BackupLogs = require("../../../../../J2pon-Guard/Schemas/Backup/Backup.Logs");
const j2poncik = require("../../../../../../Global/Settings/System");
const Setup = require("../../../../../../Global/Settings/Setup.json");
const { guildRoles, guildChannels } = require("../../../../../J2pon-Guard/Additions/_general.additions");

module.exports = {
  name: "backupal",
  description: "Sunucudaki tüm roller ve kanalların anlık yedeğini alır.",
  category: "OWNER",
  cooldown: 0,
  command: {
    enabled: true,
    aliases: ["backup-al", "yedekal", "yedek-al"],
    usage: ".backupal",
  },

  onLoad: function (client) {},

  onCommand: async function (client, message, args, byj2ponembed) {
    try {
      if (!message.guild || !message.member) return;

      // Sadece bot sahipleri ve taç sahibi kullanabilsin
      if (
        !j2poncik.BotsOwners.includes(message.author.id) &&
        message.guild.ownerId !== message.author.id
      ) {
        return message.reply({
          content: `${client.emoji("server_carpi")} Bu komutu sadece sunucu sahibi ve bot sahipleri kullanabilir!`,
        });
      }

      const guardData = await guard.findOne({ guildID: message.guild.id });
      const databaseOnly = guardData ? guardData.database : false;

      if (!databaseOnly) {
        return message.reply({
          embeds: [
            byj2ponembed.setDescription(
              `${client.emoji("server_carpi")} **Database sistemi kapalı olduğu için yedek alma işlemi yapılamaz.**\n` +
                `> Guard panelinden **"Yedekleme Aç/Kapat"** butonu ile sistemi açıp tekrar deneyebilirsin.`
            ),
          ],
        });
      }

      const loading = await message.reply({
        embeds: [
          byj2ponembed
            .setColor("#5865F2")
            .setDescription(
              `${client.emoji("server_loading")} Sunucudaki roller ve kanallar için detaylı yedek alınıyor...\n` +
                `> Bu işlem sunucunun büyüklüğüne göre birkaç saniye sürebilir.`
            ),
        ],
      });

      try {
        const now = new Date();
        const baseDayKey = now.toISOString().slice(0, 10); // YYYY-MM-DD
        const timePart = now.toISOString().slice(11, 19).replace(/:/g, "-"); // HH-mm-ss
        const snapshotKey = `${baseDayKey}_${timePart}`; // her komutta benzersiz key

        // Global guard yardımcı fonksiyonları (_general.additions.js içinden)
        await guildRoles(message.guild, snapshotKey);
        await guildChannels(message.guild, snapshotKey);

        const successEmbed = new EmbedBuilder()
          .setColor("#57F287")
          .setTitle("✅ Yedekleme Tamamlandı")
          .setDescription(
            [
              `${client.emoji("server_onay")} **Roller** ve **kanallar** başarıyla veri tabanına kaydedildi.`,
              "",
              `• Yedek Anahtarı: \`${snapshotKey}\``,
              "• Silinen roller/kanallar için ayrıca **/silinen-rol-listele** ve **/silinen-kanal-listele** komutlarını kullanarak tek tek geri yükleme yapabilirsin.",
            ].join("\n")
          )
          .setTimestamp();

        await loading.edit({ embeds: [successEmbed] });

        // Log kanalına da düş
        const backupLogId = Setup.AutoBackupLogChannel;
        const backupLogChannel = backupLogId
          ? message.guild.channels.cache.get(backupLogId)
          : null;

        if (backupLogChannel) {
          backupLogChannel
            .send({
              embeds: [
                successEmbed
                  .setDescription(
                    [
                      `${client.emoji(
                        "server_onay"
                      )} Manuel **/backupal** komutu ile roller ve kanallar yedeklendi.`,
                      "",
                      `• Yedek Anahtarı: \`${snapshotKey}\``,
                      "Bu kayıt otomatik backup sistemiyle aynı yapıyı kullanır.",
                    ].join("\n")
                  )
                  .setFooter({
                    text: `${message.author.tag} tarafından tetiklendi`,
                    iconURL: message.author.displayAvatarURL({
                      dynamic: true,
                    }),
                  }),
              ],
            })
            .catch(() => {});
        }

        // Mongo'da backup log kaydı (manuel)
        try {
          await BackupLogs.create({
            guildID: message.guild.id,
            snapshotKey,
            type: "manual",
            source: "backupal",
            createdBy: message.author.id,
          });
        } catch (logErr) {
          console.error("[BACKUP] BackupLogs manuel kayıt hatası:", logErr);
        }
      } catch (err) {
        console.error("[BACKUP] backupal komut hatası:", err);
        await loading.edit({
          embeds: [
            byj2ponembed
              .setColor("#ED4245")
              .setTitle("❌ Yedekleme Sırasında Hata")
              .setDescription(
                `${client.emoji("server_carpi")} Yedek alınırken bir hata oluştu:\n\`${err.message}\``
              ),
          ],
        });
      }
    } catch (error) {
      console.error("BackUpAl command error:", error);
      message
        .reply({
          embeds: [
            byj2ponembed.setDescription(
              `Yedek alma işlemi sırasında bir hata oluştu: \`${error.message}\``
            ),
          ],
        })
        .then((e) => setTimeout(() => e.delete().catch(() => {}), 5000));
    }
  },
};

