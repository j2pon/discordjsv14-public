const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  PermissionsBitField,
  Events,
} = require("discord.js");

const System = require("../../../../../../Global/Settings/System");
const Guard = require("../../../../../J2pon-Guard/Schemas/Guard");
const emojis = require("../../../../../../Global/Settings/Emojis.json");

const WL_KEYS = [
  { key: "SafedMembers", label: "Tam Whitelist" },
  { key: "serverSafedMembers", label: "Sunucu Guard WL" },
  { key: "roleSafedMembers", label: "Rol Guard WL" },
  { key: "channelSafedMembers", label: "Kanal Guard WL" },
  { key: "banKickSafedMembers", label: "Ban/Kick WL" },
  { key: "emojiStickers", label: "Emoji/Sticker WL" },
  { key: "chatGuard", label: "Chat Guard WL" },
];

module.exports = {
  name: "marvinxd",
  description: "Guard whitelist & limitli whitelist yönetim paneli.",
  category: "OWNER",
  cooldown: 0,
  command: {
    enabled: true,
    aliases: [],
    usage: ".marvinxd",
  },

  onLoad: function (client) {
    client.on(Events.InteractionCreate, async (interaction) => {
      try {
        if (!interaction.isButton() && !interaction.isModalSubmit()) return;
        if (!interaction.guild || interaction.guild.id !== System.ServerID) return;

        const isDev = System.BotsOwners?.includes(interaction.user.id);
        if (!isDev) return;

        // Full whitelist list / add / remove
        if (interaction.isButton() && interaction.customId.startsWith("marvin_full_")) {
          const [, , action, key] = interaction.customId.split("_"); // marvin_full_list_SafedMembers
          const wlKey = WL_KEYS.find((k) => k.key === key);
          if (!wlKey) return;

          const guardData =
            (await Guard.findOne({ guildID: interaction.guild.id })) ||
            (await Guard.create({ guildID: interaction.guild.id }));

          const arr = Array.isArray(guardData[wlKey.key]) ? guardData[wlKey.key] : [];

          if (action === "list") {
            const formatted =
              arr.length === 0
                ? `${emojis.server_info} Bu whitelist listesi boş.`
                : arr
                    .map(
                      (id, i) =>
                        `${i + 1}. <@${id}> (\`${id}\`)`
                    )
                    .join("\n");
            return interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setColor(0x2b2d31)
                  .setTitle(`${wlKey.label} • Toplam ${arr.length}`)
                  .setDescription(formatted),
              ],
              ephemeral: true,
            });
          }

          if (action === "add" || action === "remove") {
            const modal = new ModalBuilder()
              .setCustomId(`marvin_full_modal_${action}_${key}`)
              .setTitle(`${wlKey.label} ${action === "add" ? "Ekle" : "Sil"}`);

            const input = new TextInputBuilder()
              .setCustomId("target_ids")
              .setLabel("Kullanıcı ID veya mention (virgülle)")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true);

            modal.addComponents(
              new ActionRowBuilder().addComponents(input)
            );
            return interaction.showModal(modal);
          }
        }

        // Full whitelist modal işlemi
        if (
          interaction.isModalSubmit() &&
          interaction.customId.startsWith("marvin_full_modal_")
        ) {
          const [, , , action, key] = interaction.customId.split("_"); // marvin_full_modal_add_SafedMembers
          const wlKey = WL_KEYS.find((k) => k.key === key);
          if (!wlKey) return;

          const raw = interaction.fields.getTextInputValue("target_ids");
          const ids = raw
            .split(/[,\s]+/)
            .map((t) => t.match(/\d{16,}/)?.[0] || t.trim())
            .filter((t) => /^\d{16,}$/.test(t));

          const guardData =
            (await Guard.findOne({ guildID: interaction.guild.id })) ||
            (await Guard.create({ guildID: interaction.guild.id }));

          let arr = Array.isArray(guardData[wlKey.key]) ? [...guardData[wlKey.key]] : [];

          if (action === "add") {
            for (const id of ids) {
              if (!arr.includes(id)) arr.push(id);
            }
            guardData[wlKey.key] = arr;
            await guardData.save();
            return interaction.reply({
              content: `${emojis.server_onay} ${wlKey.label} listesine **${ids.length}** ID eklendi.`,
              ephemeral: true,
            });
          } else if (action === "remove") {
            arr = arr.filter((id) => !ids.includes(id));
            guardData[wlKey.key] = arr;
            await guardData.save();
            return interaction.reply({
              content: `${emojis.server_onay} ${wlKey.label} listesinden **${ids.length}** ID kaldırıldı.`,
              ephemeral: true,
            });
          }
        }

        // Limitli whitelist düzenleme butonu
        if (
          interaction.isButton() &&
          interaction.customId === "marvin_limited_edit"
        ) {
          const modal = new ModalBuilder()
            .setCustomId("marvin_limited_modal_target")
            .setTitle("Limitli Whitelist Kullanıcısı");

          const input = new TextInputBuilder()
            .setCustomId("limited_user")
            .setLabel("Kullanıcı ID veya mention")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          modal.addComponents(
            new ActionRowBuilder().addComponents(input)
          );
          return interaction.showModal(modal);
        }

        // Limitli whitelist hedef seçimi -> mevcut limited_modal akışını tetikler
        if (
          interaction.isModalSubmit() &&
          interaction.customId === "marvin_limited_modal_target"
        ) {
          const raw = interaction.fields.getTextInputValue("limited_user");
          const id = raw.match(/\d{16,}/)?.[0] || raw.trim();
          if (!/^\d{16,}$/.test(id)) {
            return interaction.reply({
              content: `${emojis.server_carpi} Geçerli bir kullanıcı ID'si gir.`,
              ephemeral: true,
            });
          }

          // Kullanıcının mevcut limitleri varsa çekelim
          const guardData =
            (await Guard.findOne({ guildID: interaction.guild.id })) ||
            (await Guard.create({ guildID: interaction.guild.id }));
          const existing = guardData.limitedWhitelistMembers?.find(
            (x) => x.userId === id
          );

          const defaults = {
            ban: 10,
            kick: 10,
            timeout: 10,
            role_add: 10,
            role_remove: 10,
          };

          const current = existing?.limits || {};

          const m2 = new ModalBuilder()
            .setCustomId(`limited_modal_${id}`)
            .setTitle("Limitli Whitelist Limitleri");

          const makeInput = (cid, label, val) =>
            new TextInputBuilder()
              .setCustomId(cid)
              .setLabel(label)
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setValue(String(val));

          m2.addComponents(
            new ActionRowBuilder().addComponents(
              makeInput(
                "ban_limit",
                "Ban limiti",
                current.ban?.limit ?? defaults.ban
              )
            ),
            new ActionRowBuilder().addComponents(
              makeInput(
                "kick_limit",
                "Kick limiti",
                current.kick?.limit ?? defaults.kick
              )
            ),
            new ActionRowBuilder().addComponents(
              makeInput(
                "timeout_limit",
                "Timeout limiti",
                current.timeout?.limit ?? defaults.timeout
              )
            ),
            new ActionRowBuilder().addComponents(
              makeInput(
                "role_add_limit",
                "Rol verme limiti",
                current.role_add?.limit ?? defaults.role_add
              )
            ),
            new ActionRowBuilder().addComponents(
              makeInput(
                "role_remove_limit",
                "Rol alma limiti",
                current.role_remove?.limit ?? defaults.role_remove
              )
            )
          );

          // Bu modal, InteractionCreate.js içindeki mevcut limited_modal_ handler'ına düşecek
          return interaction.showModal(m2);
        }
      } catch (err) {
        console.error("marvinxd panel hatası:", err);
      }
    });
  },

  onCommand: async function (client, message, args) {
    if (!System.BotsOwners?.includes(message.author.id)) {
      // Developer olmayanlar için tamamen sessiz kal
      return;
    }

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("marvin_full_list_SafedMembers")
        .setLabel("Tam WL Listele")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(emojis.server_info || "📃"),
      new ButtonBuilder()
        .setCustomId("marvin_full_add_SafedMembers")
        .setLabel("Tam WL Ekle")
        .setStyle(ButtonStyle.Success)
        .setEmoji(emojis.appEmoji_ekle || "➕"),
      new ButtonBuilder()
        .setCustomId("marvin_full_remove_SafedMembers")
        .setLabel("Tam WL Sil")
        .setStyle(ButtonStyle.Danger)
        .setEmoji(emojis.appEmoji_cop || "🗑️")
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("marvin_full_list_banKickSafedMembers")
        .setLabel("Ban/Kick WL")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(emojis.server_members || "👮"),
      new ButtonBuilder()
        .setCustomId("marvin_full_list_roleSafedMembers")
        .setLabel("Rol WL")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(emojis.server_star || "⭐"),
      new ButtonBuilder()
        .setCustomId("marvin_full_list_channelSafedMembers")
        .setLabel("Kanal WL")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(emojis.server_info || "📺")
    );

    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("marvin_limited_edit")
        .setLabel("Limitli Whitelist (TWL)")
        .setStyle(ButtonStyle.Primary)
        .setEmoji(emojis.j2pon_bag || "🧩")
    );

    const embed = new EmbedBuilder()
      .setColor(0x2f3136)
      .setAuthor({
        name: message.guild.name,
        iconURL: message.guild.iconURL({ dynamic: true }) || undefined,
      })
      .setTitle(`${emojis.server_star2 || "⭐"} Guard Whitelist Yönetim Paneli`)
      .setDescription(
        [
          `${emojis.server_info || "ℹ️"} Bu panel ile:`,
          `• Tam whitelist (SafedMembers ve alt listeler) kullanıcılarını görüntüleyip güncelleyebilirsin.`,
          `• Limitli whitelist (TWL) kullanıcılarının limitlerini **detaylı** yönetebilirsin.`,
          "",
          `${emojis.server_onay || "✅"} Tüm işlemler sadece bu sunucunun Guard verisi üzerinde yapılır.`,
        ].join("\n")
      );

    await message.channel
      .send({
        embeds: [embed],
        components: [row1, row2, row3],
      })
      .catch(() => {});
  },
};

