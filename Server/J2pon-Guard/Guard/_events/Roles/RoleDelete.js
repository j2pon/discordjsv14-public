const { Event } = require("../../../Structures/Default.Events");
const Guild = require("../../../../../Global/Settings/System");
const Setup = require("../../../../../Global/Settings/Setup.json");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");
const DeletedRole = require("../../../Schemas/Backup/Deleted.Roles");

class roleDelete extends Event {
  constructor(client) {
    super(client, {
      name: "roleDelete",
      enabled: true,
    });
  }

  async onLoad(role) {
    try {
      const guild = role.guild;
      const client = this.client;

      if (!guild || guild.id !== Guild.ServerID) return;

      // Audit log'dan silen kişiyi bul
      let deletedBy = null;
      try {
        const logs = await guild.fetchAuditLogs({ type: 32 }).catch(() => null); // RoleDelete
        const entry = logs?.entries.first();
        if (entry && entry.targetId === role.id && Date.now() - entry.createdTimestamp < 15000) {
          deletedBy = entry.executor?.id || null;
        }
      } catch {
        // audit log hatası önemli değil, sadece deletedBy boş kalır
      }

      // Kanal izinlerini topla (rolün hangi kanallarda overwrite'ı var)
      const channelOverwrites = [];
      try {
        guild.channels.cache
          .filter((ch) => ch.permissionOverwrites?.cache?.has(role.id))
          .forEach((channel) => {
            const perm = channel.permissionOverwrites.cache.get(role.id);
            if (!perm) return;
            channelOverwrites.push({
              id: channel.id,
              allow: perm.allow.toArray(),
              deny: perm.deny.toArray(),
            });
          });
      } catch {
        // Kanal izinleri okunamazsa sadece üyeleri ve temel bilgileri kaydet
      }

      const members = role.members?.map((m) => m.id) || [];

      await DeletedRole.findOneAndUpdate(
        { guildID: guild.id, roleID: role.id },
        {
          $set: {
            guildID: guild.id,
            roleID: role.id,
            name: role.name,
            color: role.hexColor,
            hoist: role.hoist,
            position: role.position,
            permissions: String(role.permissions?.bitfield || "0"),
            mentionable: role.mentionable,
            members,
            channelOverwrites,
            deletedBy,
            deletedAt: Date.now(),
            restored: false,
          },
        },
        { upsert: true }
      );

      // Öncelikli olarak GuardRoleCategoryRestoreLogChannel kullan, yoksa guard_log'a düş
      const roleLogId = Setup.GuardRoleCategoryRestoreLogChannel;
      let logChannel = null;
      if (roleLogId) {
        logChannel = guild.channels.cache.get(roleLogId) || null;
      }
      if (!logChannel) {
        logChannel = guild.channels.cache.find((x) => x.name === "guard_log") || null;
      }

      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle("🗑️ Rol Silindi (Yedek Alındı)")
          .setColor("#ffcc00")
          .setDescription(
            [
              `**Rol:** \`${role.name}\` (\`${role.id}\`)`,
              `**Silinen Üye:** ${deletedBy ? `<@${deletedBy}> (\`${deletedBy}\`)` : "Bilinmiyor"}`,
              `**Üye Sayısı:** \`${members.length}\``,
              `**Kanal İzni Sayısı:** \`${channelOverwrites.length}\``,
              "",
              "Bu rol için detaylı yedek **/silinen-rol-listele** komutuyla görüntülenip geri yüklenebilir.",
            ].join("\n")
          )
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`guard_restore_role_${role.id}`)
            .setLabel("Rolü Geri Yükle")
            .setStyle(ButtonStyle.Success)
        );

        const msg = await logChannel
          .send({ embeds: [embed], components: [row] })
          .catch(() => null);

        if (msg) {
          const collector = msg.createMessageComponentCollector({
            filter: (i) => i.customId === `guard_restore_role_${role.id}`,
            max: 1,
            time: 1000 * 60 * 5,
          });

          collector.on("collect", async (interaction) => {
            try {
              await interaction.deferReply({ ephemeral: true });

              const backup = await DeletedRole.findOne({
                guildID: guild.id,
                roleID: role.id,
              });
              if (!backup) {
                return interaction.editReply({
                  content: "Yedek kaydı bulunamadı veya silinmiş.",
                });
              }

              // Rolü yeniden oluştur
              const newRole = await guild.roles.create({
                name: backup.name || "Geri Yüklenen Rol",
                hoist: !!backup.hoist,
                permissions: new PermissionsBitField(
                  BigInt(String(backup.permissions || "0"))
                ),
                mentionable: !!backup.mentionable,
                position:
                  typeof backup.position === "number" ? backup.position : 0,
                reason: "Silinen rol yedeğinden buton ile geri yükleme",
              });

              // Üyelere geri ver
              const memberIds = Array.isArray(backup.members)
                ? backup.members
                : [];
              for (const memberId of memberIds) {
                const member = guild.members.cache.get(memberId);
                if (!member) continue;
                if (member.roles.cache.has(newRole.id)) continue;
                await member.roles.add(newRole).catch(() => {});
              }

              // Kanal izinlerini geri kur
              const overwrites = Array.isArray(backup.channelOverwrites)
                ? backup.channelOverwrites
                : [];
              for (const perm of overwrites) {
                const ch = guild.channels.cache.get(perm.id);
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
              }

              backup.restored = true;
              await backup.save().catch(() => {});

              await interaction.editReply({
                content: `✅ **${backup.name || "İsimsiz Rol"}** başarıyla geri yüklendi. (Yeni Rol: @${newRole.name} - ${newRole.id})`,
              });

              // Butonu tek kullanımlık yap
              msg.edit({ components: [] }).catch(() => {});
            } catch (e) {
              console.error("[GUARD] roleDelete button restore error:", e);
              if (!interaction.replied && !interaction.deferred) {
                interaction
                  .reply({
                    content: "Rol geri yüklenirken bir hata oluştu.",
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
    } catch (error) {
      console.error("[GUARD] roleDelete backup error:", error);
    }
  }
}

module.exports = roleDelete;

