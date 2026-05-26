const { EmbedBuilder } = require("discord.js");
const guard = require("../../../../../J2pon-Guard/Schemas/Guard");
const j2poncik = require("../../../../../../Global/Settings/System");
const BackupLogs = require("../../../../../J2pon-Guard/Schemas/Backup/Backup.Logs");

module.exports = {
  name: "backupliste",
  description: "Alınan yedekleri (manuel/otomatik) listeler.",
  category: "OWNER",
  cooldown: 0,
  command: {
    enabled: true,
    aliases: ["backup-liste", "yedekliste", "yedek-liste"],
    usage: ".backupliste",
  },

  onLoad: function (client) {},

  onCommand: async function (client, message, args, byj2ponembed) {
    try {
      if (!message.guild || !message.member) return;

      // Sadece bot sahipleri ve taç sahibi
      if (
        !j2poncik.BotsOwners.includes(message.author.id) &&
        message.guild.ownerId !== message.author.id
      ) {
        return message.reply({
          content: `${client.emoji(
            "server_carpi"
          )} Bu komutu sadece sunucu sahibi ve bot sahipleri kullanabilir!`,
        });
      }

      const guardData = await guard.findOne({ guildID: message.guild.id });
      const databaseOnly = guardData ? guardData.database : false;

      if (!databaseOnly) {
        return message.reply({
          embeds: [
            byj2ponembed.setDescription(
              `${client.emoji(
                "server_carpi"
              )} **Database sistemi kapalı olduğu için yedek listesi görüntülenemez.**\n` +
                `> Guard panelinden **"Yedekleme Aç/Kapat"** butonu ile sistemi açıp tekrar deneyebilirsin.`
            ),
          ],
        });
      }

      const logs = await BackupLogs.find({ guildID: message.guild.id })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      if (!logs || !logs.length) {
        return message.reply({
          embeds: [
            byj2ponembed
              .setColor("#ED4245")
              .setDescription(
                `${client.emoji(
                  "server_info"
                )} Bu sunucu için henüz kayıtlı bir yedek bulunmuyor.`
              ),
          ],
        });
      }

      const successEmoji = client.emoji("server_onay");
      const infoEmoji = client.emoji("server_info");
      const dotEmoji = client.emoji("server_nokta2");

      const lines = logs.map((log, index) => {
        const indexStr = `\`${index + 1}.\``;
        const typeLabel =
          log.type === "manual"
            ? `${client.emoji("server_star")} Manuel`
            : `${client.emoji("server_loading")} Otomatik`;

        const ts = log.createdAt
          ? `<t:${Math.floor(new Date(log.createdAt).getTime() / 1000)}:f>`
          : "Bilinmiyor";

        const userPart =
          log.type === "manual" && log.createdBy
            ? ` • Kullanıcı: <@${log.createdBy}>`
            : "";

        return `${indexStr} ${dotEmoji} ${typeLabel} • Anahtar: \`${
          log.snapshotKey || "yok"
        }\`\n> ${infoEmoji} Tarih: ${ts}${userPart}`;
      });

      const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle(`${successEmoji} Kayıtlı Yedekler`)
        .setDescription(lines.join("\n\n"))
        .setFooter({
          text: `${message.guild.name} • Son ${logs.length} kayıt`,
          iconURL: message.guild.iconURL({ dynamic: true }),
        });

      return message.reply({ embeds: [embed] });
    } catch (err) {
      console.error("BackUpListe command error:", err);
      return message.reply({
        embeds: [
          byj2ponembed.setDescription(
            `${client.emoji(
              "server_carpi"
            )} Yedek listesi alınırken bir hata oluştu: \`${err.message}\``
          ),
        ],
      });
    }
  },
};

