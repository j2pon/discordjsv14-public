const { Event } = require("../../../Structures/Default.Events");
const { ChannelType, EmbedBuilder } = require("discord.js");
const Guild = require("../../../../../Global/Settings/System");
const BackupLogs = require("../../../Schemas/Backup/Backup.Logs");
const Setup = require("../../../../../Global/Settings/Setup.json");
const moment = require("moment-timezone");
const { CronJob } = require("cron");

const {
  guildChannels,
  guildRoles,
} = require("../../../Additions/_general.additions");

const TIMEZONE = "Europe/Istanbul";

class Backup extends Event {
  constructor(client) {
    super(client, {
      name: "ready",
      enabled: true,
    });
  }

  async onLoad(client) {
    const guild = client.guilds.cache.get(Guild.ServerID);
    if (!guild) {
      console.error(`[GUARD][BackupJob] Sunucu bulunamadı: ${Guild.ServerID}`);
      return;
    }

    console.log(`[GUARD][BackupJob] Otomatik yedek sistemi hazırlandı. Her gün 23:59'da çalışacak. (${TIMEZONE})`);

    const runBackup = async (source) => {
      try {
        const now = new Date();
        const snapshotKey = `${now.toISOString().slice(0, 10)}_${now.toISOString().slice(11, 19).replace(/:/g, "-")}`;
        
        console.log(`[GUARD][BackupJob] Yedekleme işlemi başlatılıyor... Kaynak: ${source}`);
        
        await guildRoles(guild, snapshotKey);
        await guildChannels(guild, snapshotKey);

        const backupLogId = Setup.AutoBackupLogChannel;
        const backupLogChannel = backupLogId ? guild.channels.cache.get(backupLogId) : null;

        if (backupLogChannel) {
          backupLogChannel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(0x57f287)
                .setTitle("✅ Otomatik Yedek Alındı")
                .setDescription([
                  `Sunucudaki **roller** ve **kanallar** başarıyla yedeklendi.`,
                  "",
                  `• Kaynak: \`${source}\``,
                  `• Yedek Anahtarı: \`${snapshotKey}\``,
                  `• Tarih: <t:${Math.floor(Date.now() / 1000)}:F>`,
                ].join("\n"))
                .setTimestamp()
            ],
          }).catch(() => {});
        }

        try {
          await BackupLogs.create({
            guildID: guild.id,
            snapshotKey,
            type: "auto",
            source,
            createdBy: null,
          });
        } catch (logErr) {
          console.error("[GUARD][BackupJob] BackupLogs kayıt hatası:", logErr);
        }
        
        console.log(`[GUARD][BackupJob] Yedekleme başarıyla tamamlandı. Anahtar: ${snapshotKey}`);
      } catch (err) {
        console.error("[GUARD][BackupJob] Otomatik yedek hatası:", err);
      }
    };

    // Cron Job: Her gün 23:59:00'da çalışır
    const job = new CronJob('0 59 23 * * *', async () => {
      await runBackup("daily-cron-23:59");
    }, null, true, TIMEZONE);

    job.start();
  }
}

module.exports = Backup;
