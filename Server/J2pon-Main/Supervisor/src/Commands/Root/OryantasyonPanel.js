const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const emojis = require("../../../../../../Global/Settings/Emojis.json");
const j2poncik = require("../../../../../../Global/Settings/System");
const oryantasyonStats = require("../../../../../../Global/Schemas/oryantasyonStats");
const userTask = require("../../../../../../Global/Schemas/userTask");
const tasks = require("../../../../../../Global/Schemas/tasks");

let ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize;
try {
  const v2 = require("discord.js");
  ContainerBuilder = v2.ContainerBuilder;
  TextDisplayBuilder = v2.TextDisplayBuilder;
  SeparatorBuilder = v2.SeparatorBuilder;
  SeparatorSpacingSize = v2.SeparatorSpacingSize;
} catch (_) {}

// Aktif oryantasyon oturumları: key = channelId, value = { starterId, targetId, startedAt }
const activeOryantasyon = new Map();

module.exports = {
  name: "oryantasyonpanel",
  description: "Oryantasyon panelini gönderir.",
  category: "OWNER",
  cooldown: 0,
  command: {
    enabled: true,
    aliases: ["oryantasyon-panel", "oryantasyon"],
    usage: ".oryantasyonpanel",
  },

  onLoad: function (client) {
    client.on(Events.InteractionCreate, async (interaction) => {
      try {
        if (interaction.isButton()) {
        const { customId, member, guild } = interaction;

        if (customId !== "ory_baslat" && customId !== "ory_bitir") return;

        const staffRoles = j2ponm.Sorumluluk?.StaffRoles?.rehberlik || {};
        const allowedRoleIds = [staffRoles.responsible, staffRoles.leader].filter(Boolean);
        const hasPermission = allowedRoleIds.some((id) =>
          member.roles.cache.has(id)
        );

        if (!hasPermission) {
          return interaction.reply({
            content: `${emojis.server_carpi} Bu butonu sadece **oryantasyon sorumlusu** ve **lideri** kullanabilir.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        if (!member.voice.channel) {
          return interaction.reply({
            content: `${emojis.server_carpi} Oryantasyon başlatmak/bitirmek için bir sesli kanalda olmanız gerekmektedir.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        const voiceChannel = member.voice.channel;
        const key = voiceChannel.id;
        const now = Date.now();

        if (customId === "ory_baslat") {
          if (activeOryantasyon.has(key)) {
            return interaction.reply({
              content: `${emojis.server_carpi} Bu ses kanalında zaten aktif bir oryantasyon oturumu var.`,
              flags: MessageFlags.Ephemeral,
            });
          }

          // Modal aç: oryantasyon verilecek yetkili ID/mention
          const modal = new ModalBuilder()
            .setCustomId("oryantasyon_modal")
            .setTitle("Oryantasyon Başlat");

          const input = new TextInputBuilder()
            .setCustomId("ory_target")
            .setLabel("Yetkili ID veya mention")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          modal.addComponents(
            new (require("discord.js").ActionRowBuilder)().addComponents(input)
          );

          await interaction.showModal(modal);

          const submitted = await interaction
            .awaitModalSubmit({
              time: 60000,
              filter: (i) =>
                i.customId === "oryantasyon_modal" &&
                i.user.id === interaction.user.id,
            })
            .catch(() => null);

          if (!submitted) return;

          const raw = submitted.fields.getTextInputValue("ory_target");
          const idMatch = raw.match(/\d{16,}/);
          const targetId = idMatch ? idMatch[0] : raw.trim();
          const targetMember =
            guild.members.cache.get(targetId) ||
            (await guild.members.fetch(targetId).catch(() => null));

          if (!targetMember) {
            return submitted.reply({
              content: `${emojis.server_carpi} Geçerli bir kullanıcı ID'si belirtmelisiniz.`,
              flags: MessageFlags.Ephemeral,
            });
          }

          activeOryantasyon.set(key, {
            starterId: member.id,
            targetId: targetMember.id,
            startedAt: now,
          });

          return submitted.reply({
            content: `${emojis.server_onay} Oryantasyon oturumu **başlatıldı**. Süre sayacı çalışıyor.\nOryantasyon verilen yetkili: ${targetMember}`,
            flags: MessageFlags.Ephemeral,
          });
        }

        // Bitir
        const session = activeOryantasyon.get(key);
        if (!session) {
          return interaction.reply({
            content: `${emojis.server_carpi} Bu ses kanalında aktif bir oryantasyon oturumu bulunamadı.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        activeOryantasyon.delete(key);

        const durationMs = now - session.startedAt;
        const durationMinutes = Math.max(1, Math.round(durationMs / 1000 / 60));

        const logChannelId =
          j2ponm.OryantasyonLogChannel && j2ponm.OryantasyonLogChannel.length
            ? j2ponm.OryantasyonLogChannel
            : j2ponm.SorunCozmeLogChannel;
        let logChannel = logChannelId
          ? guild.channels.cache.get(logChannelId)
          : null;
        if (!logChannel) logChannel = interaction.channel;

        const starter =
          guild.members.cache.get(session.starterId) || member;
        const target =
          guild.members.cache.get(session.targetId) ||
          (await guild.members.fetch(session.targetId).catch(() => null));

        // Stat: oryantasyon
        await oryantasyonStats.findOneAndUpdate(
          { guildID: guild.id, userID: starter.id },
          {
            $inc: { count: 1 },
            $push: {
              sessions: {
                targetId: session.targetId,
                date: Date.now(),
              },
            },
          },
          { upsert: true, new: true }
        );
        
        // Görev ilerlemesi
        try {
          // Ana Görev
          await userTask.findOneAndUpdate(
              { userId: starter.id },
              { $inc: { "counts.oryantasyon": 1 } },
              { upsert: true }
          );

          // Sorumluluk Görevi (Rehber Sorumlusu)
          await require("../../../../../../Global/Schemas/userResponsibilityTask").findOneAndUpdate(
              { userId: starter.id, responsibilityKey: "rehberlik" },
              { $inc: { "counts.oryantasyon": 1 } }
          );
        } catch (e) {
          console.error("Oryantasyon görev ilerleme hatası:", e?.message || e);
        }


        const logEmbed = new EmbedBuilder()
          .setColor(0x2f3136)
          .setAuthor({
            name: "Oryantasyon Oturumu Tamamlandı",
            iconURL: guild.iconURL({ dynamic: true }) || undefined,
          })
          .setThumbnail(
            guild.iconURL({ dynamic: true, size: 256 }) || undefined
          )
          .setDescription(
            `
${emojis.server_star} **Oryantasyon Özeti**

${emojis.server_info} **Oryantasyon yapan yetkili:** ${starter} (\`${starter.id}\`)
${emojis.server_info} **Oryantasyon verilen yetkili:** ${
              target || `\`${session.targetId}\``
            }
${emojis.server_info} **Oryantasyon süresi:** \`${durationMinutes} dakika\`
${emojis.server_info} **Ses kanalı:** ${member.voice.channel} (\`${member.voice.channel.id}\`)
${emojis.server_info} **Tarih & Saat:** <t:${Math.floor(now / 1000)}:F>
`
          )
          .setFooter({
            text: "Oryantasyon Log Sistemi",
            iconURL: interaction.client.user.displayAvatarURL({ size: 128 }),
          })
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] }).catch(console.error);

        return interaction.reply({
          content: `${emojis.server_onay} Oryantasyon oturumu **bitirildi** ve log kanala gönderildi.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      } catch (err) {
        console.error("[OryantasyonPanel] Interaction error:", err);
      }
    });
  },

  onCommand: async function (client, message, args) {
    const j2poncik = require("../../../../../../Global/Settings/System");

    if (!j2poncik.BotsOwners.includes(message.author.id)) {
      return message
        .reply({
          content:
            "Bu komut sadece developer'lar tarafından kullanılabilir!",
        })
        .then((e) => setTimeout(() => e.delete(), 5000));
    }

    const titleContent = "## Oryantasyon Paneline Hoş Geldiniz!";
    const introContent =
      "Bu panel aracılığıyla yetkililere oryantasyon süreci başlatabilir ve sonlandırabilirsiniz.";
    const infoContent = [
      `${emojis.server_info} **Bilgi:**`,
      "> Oryantasyon başlatırken formdan, oryantasyon verilecek yetkilinin ID'sini veya mention'unu girmelisiniz.",
      "> Oryantasyon bittiğinde, detaylı log ve stat güncellemesi otomatik yapılır.",
    ].join("\n");
    const ctaContent = `> ${emojis.j2pon_alt} Aşağıdaki butonları kullanarak oryantasyon başlatabilir veya bitirebilirsiniz.`;

    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ory_baslat")
        .setLabel("Oryantasyon Başlat")
        .setStyle(ButtonStyle.Success)
        .setEmoji(emojis.server_onay || "✅"),
      new ButtonBuilder()
        .setCustomId("ory_bitir")
        .setLabel("Oryantasyon Bitir")
        .setStyle(ButtonStyle.Danger)
        .setEmoji(emojis.server_carpi || "⛔")
    );

    const fullText = [
      titleContent,
      "",
      introContent,
      "",
      infoContent,
      "",
      ctaContent,
    ].join("\n");

    // Components V2 bazı ortamlarda hata verdiği için,
    // bu paneli klasik embed + buton olarak sabitliyoruz.
    const embed = new EmbedBuilder()
      .setDescription(fullText)
      .setThumbnail(message.client.user.displayAvatarURL({ size: 256 }))
      .setColor(0x2f3136);

    await message.channel.send({
      embeds: [embed],
      components: [buttonRow],
    });
  },
};

