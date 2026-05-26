const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionsBitField,
} = require("discord.js");
const j2poncik = require("../../../../../../Global/Settings/System");
const GUILD_ROLES = require("../../../../../J2pon-Guard/Schemas/Backup/Guild.Roles");
const GUILD_CATEGORY = require("../../../../../J2pon-Guard/Schemas/Backup/Guild.Category.Channels");
const GUILD_TEXT = require("../../../../../J2pon-Guard/Schemas/Backup/Guild.Text.Channels");
const GUILD_VOICE = require("../../../../../J2pon-Guard/Schemas/Backup/Guild.Voice.Channels");
const BackupLogs = require("../../../../../J2pon-Guard/Schemas/Backup/Backup.Logs");

module.exports = {
  name: "backupload",
  description:
    "Seçilen günün yedeğine göre eksik rol/kanal/kategorileri geri yükler.",
  category: "OWNER",
  cooldown: 0,
  command: {
    enabled: true,
    aliases: ["backup-load", "yedek-yukle"],
    usage: ".backupload",
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
          content: `${client.emoji(
            "server_carpi"
          )} Bu komutu sadece sunucu sahibi ve bot sahipleri kullanabilir!`,
        });
      }

      // Backuplogs tablosundan mevcut yedekleri topla
      const guildId = message.guild.id;

      const logs = await BackupLogs.find({ guildID: guildId })
        .sort({ createdAt: -1 })
        .limit(25)
        .lean();

      if (!logs || !logs.length) {
        return message.reply({
          embeds: [
            byj2ponembed.setDescription(
              `${client.emoji(
                "server_carpi"
              )} Bu sunucu için kayıtlı herhangi bir yedek bulunamadı.\n` +
                `> Önce **/backupal** komutunu veya otomatik 24 saatlik backup sistemini çalıştırmalısın.`
            ),
          ],
        });
      }

      // Aynı snapshotKey birden fazla kez loglandıysa (teorik), sonuncusunu baz al
      const uniqueByKey = new Map();
      for (const log of logs) {
        if (!log.snapshotKey) continue;
        if (!uniqueByKey.has(log.snapshotKey)) {
          uniqueByKey.set(log.snapshotKey, log);
        }
      }

      const snapshots = Array.from(uniqueByKey.values());

      const options = snapshots.map((log) => {
        const key = log.snapshotKey;
        const typeLabel =
          log.type === "manual"
            ? "Manuel Backup"
            : "Otomatik Backup";

        const ts = log.createdAt
          ? new Date(log.createdAt).toLocaleString("tr-TR")
          : "Tarih yok";

        return {
          label: key,
          description: `${typeLabel} • ${ts}`.slice(0, 100),
          value: key,
        };
      });

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("backupload_day_select")
          .setPlaceholder("Yüklemek istediğin yedeği seç.")
          .setMinValues(1)
          .setMaxValues(1)
          .setOptions(options)
      );

      const infoEmbed = new EmbedBuilder()
        .setColor("#2F3136")
        .setTitle("📦 BackUpLoad - Gün Seçimi")
        .setDescription(
          [
            `${client.emoji(
              "server_info"
            )} Aşağıdaki listeden bir yedek seçtiğinde:`,
            "• O yedeğe ait **rol**, **kanal** ve **kategori** snapshot'ı okunacak.",
            "• Sunucuda **şu an bulunmayan** rol/kanal/kategoriler tespit edilip **yeniden oluşturulacak**.",
            "",
            "**Var olan** yapıya dokunulmaz, yalnızca **eksikler tamamlanır.**",
          ].join("\n")
        );

      const selectMsg = await message.reply({
        embeds: [infoEmbed],
        components: [row],
      });

      const filter = (i) =>
        i.user.id === message.author.id &&
        i.customId === "backupload_day_select";
      const collector = selectMsg.createMessageComponentCollector({
        filter,
        time: 1000 * 60 * 2,
      });

      collector.on("collect", async (interaction) => {
        try {
          await interaction.deferUpdate();
          const dayKey = interaction.values[0];

          const loading = await interaction.channel.send({
            embeds: [
              byj2ponembed
                .setColor("#5865F2")
                .setTitle("🔍 BackUpLoad Çalışıyor...")
                .setDescription(
                  [
                    `Seçilen gün: **${dayKey}**`,
                    "",
                    "• Snapshot verileri okunuyor.",
                    "• Mevcut sunucu ile karşılaştırma yapılıyor.",
                    "• Sadece eksik roller / kanallar / kategoriler oluşturulacak.",
                  ].join("\n")
                ),
            ],
          });

          const [roleSnaps, catSnaps, textSnaps, voiceSnaps] =
            await Promise.all([
              GUILD_ROLES.find({ guildID: guildId, snapshotKey: dayKey }).lean(),
              GUILD_CATEGORY.find({
                guildID: guildId,
                snapshotKey: dayKey,
              }).lean(),
              GUILD_TEXT.find({ guildID: guildId, snapshotKey: dayKey }).lean(),
              GUILD_VOICE.find({ guildID: guildId, snapshotKey: dayKey }).lean(),
            ]);

          let createdRoles = 0;
          let createdCats = 0;
          let createdText = 0;
          let createdVoice = 0;

          // Rolleri tamamla (kanal izinleri hariç)
          for (const r of roleSnaps) {
            if (!r || !r.roleID) continue;
            if (message.guild.roles.cache.has(r.roleID)) continue;

            try {
              await message.guild.roles.create({
                name: r.name || "Snapshot Rol",
                hoist: !!r.hoist,
                permissions: BigInt(String(r.permissions || "0")),
                mentionable: !!r.mentionable,
                reason: `BackUpLoad - Eksik rol, snapshot ${dayKey}`,
              });
              createdRoles++;
            } catch {
              // tek tek rol hatalarını yok say
            }
          }

          // Kategorileri tamamla (izinler ile)
          for (const c of catSnaps) {
            if (!c || !c.channelID) continue;
            if (message.guild.channels.cache.has(c.channelID)) continue;

            try {
              const overwrites = (c.overwrites || []).map((o) => ({
                id: o.id,
                type: o.type,
                allow: new PermissionsBitField(BigInt(String(o.allow || "0"))),
                deny: new PermissionsBitField(BigInt(String(o.deny || "0"))),
              }));

              await message.guild.channels.create({
                name: c.name || "Snapshot Kategori",
                type: 4,
                position:
                  typeof c.position === "number" ? c.position : undefined,
                permissionOverwrites: overwrites,
                reason: `BackUpLoad - Eksik kategori, snapshot ${dayKey}`,
              });
              createdCats++;
            } catch {
              // kategori oluşturma hatasını yok say
            }
          }

          // Text kanalları tamamla (izinler ile)
          for (const c of textSnaps) {
            if (!c || !c.channelID) continue;
            if (message.guild.channels.cache.has(c.channelID)) continue;

            try {
              const parent =
                c.parentID && message.guild.channels.cache.get(c.parentID)
                  ? c.parentID
                  : undefined;

              const overwrites = (c.overwrites || []).map((o) => ({
                id: o.id,
                type: o.type,
                allow: new PermissionsBitField(BigInt(String(o.allow || "0"))),
                deny: new PermissionsBitField(BigInt(String(o.deny || "0"))),
              }));

              await message.guild.channels.create({
                name: c.name || "Snapshot Kanal",
                type: 0,
                parent,
                position:
                  typeof c.position === "number" ? c.position : undefined,
                nsfw: !!c.nsfw,
                rateLimitPerUser:
                  typeof c.rateLimit === "number" ? c.rateLimit : 0,
                permissionOverwrites: overwrites,
                reason: `BackUpLoad - Eksik text kanal, snapshot ${dayKey}`,
              });
              createdText++;
            } catch {
              // text kanal hatasını yok say
            }
          }

          // Voice kanalları tamamla (izinler ile)
          for (const c of voiceSnaps) {
            if (!c || !c.channelID) continue;
            if (message.guild.channels.cache.has(c.channelID)) continue;

            try {
              const parent =
                c.parentID && message.guild.channels.cache.get(c.parentID)
                  ? c.parentID
                  : undefined;

              const overwrites = (c.overwrites || []).map((o) => ({
                id: o.id,
                type: o.type,
                allow: new PermissionsBitField(BigInt(String(o.allow || "0"))),
                deny: new PermissionsBitField(BigInt(String(o.deny || "0"))),
              }));

              await message.guild.channels.create({
                name: c.name || "Snapshot Ses Kanalı",
                type: 2,
                parent,
                position:
                  typeof c.position === "number" ? c.position : undefined,
                bitrate:
                  typeof c.bitrate === "number" && c.bitrate > 0
                    ? c.bitrate
                    : 64000,
                userLimit:
                  typeof c.userLimit === "number" ? c.userLimit : 0,
                permissionOverwrites: overwrites,
                reason: `BackUpLoad - Eksik voice kanal, snapshot ${dayKey}`,
              });
              createdVoice++;
            } catch {
              // voice kanal hatasını yok say
            }
          }

          const resultEmbed = new EmbedBuilder()
            .setColor("#57F287")
            .setTitle("✅ BackUpLoad Tamamlandı")
            .setDescription(
              [
                `Seçilen gün: **${dayKey}**`,
                "",
                `• Oluşturulan Roller: \`${createdRoles}\``,
                `• Oluşturulan Kategoriler: \`${createdCats}\``,
                `• Oluşturulan Metin Kanalları: \`${createdText}\``,
                `• Oluşturulan Ses Kanalları: \`${createdVoice}\``,
                "",
                "Mevcut yapıda bulunan hiç bir rol/kanal/kategori silinmedi veya değiştirilmedi; sadece eksikler tamamlandı.",
              ].join("\n")
            )
            .setTimestamp();

          await loading.edit({ embeds: [resultEmbed] });
        } catch (err) {
          console.error("BackUpLoad error:", err);
          if (!interaction.replied && !interaction.deferred) {
            interaction
              .reply({
                content: `BackUpLoad sırasında bir hata oluştu: \`${err.message}\``,
                ephemeral: true,
              })
              .catch(() => {});
          }
        }
      });

      collector.on("end", () => {
        selectMsg.edit({ components: [] }).catch(() => {});
      });
    } catch (error) {
      console.error("BackUpLoad command error:", error);
      message
        .reply({
          embeds: [
            byj2ponembed.setDescription(
              `BackUpLoad komutu çalıştırılırken bir hata oluştu: \`${error.message}\``
            ),
          ],
        })
        .then((e) => setTimeout(() => e.delete().catch(() => {}), 5000));
    }
  },
};

