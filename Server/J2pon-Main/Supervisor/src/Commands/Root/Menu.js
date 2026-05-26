const { ApplicationCommandOptionType, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, Events, PermissionsBitField, MessageFlags, EmbedBuilder } = require("discord.js");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const j2poncik = require("../../../../../../Global/Settings/System");
const { server_nitro, server_exxen, server_netflix, server_youtube, server_spotify } = require("../../../../../../Global/Settings/Emojis.json");

let ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, SectionBuilder, ThumbnailBuilder;
try {
    const v2 = require("discord.js");
    ContainerBuilder = v2.ContainerBuilder;
    TextDisplayBuilder = v2.TextDisplayBuilder;
    SeparatorBuilder = v2.SeparatorBuilder;
    SeparatorSpacingSize = v2.SeparatorSpacingSize;
    SectionBuilder = v2.SectionBuilder;
    ThumbnailBuilder = v2.ThumbnailBuilder;
} catch (_) {}

function parseEmoji(input, fallback) {
    try {
        if (!input) return fallback;
        if (typeof input === "string") {
            const m = input.match(/<a?:\w+:(\d+)>/);
            if (m) return { id: m[1] };
            return input;
        }
        if (typeof input === "object" && input.id) return { id: String(input.id) };
    } catch (e) {}
    return fallback;
}

const Ec = [
"Etkinlik",
"Cekilis"
];

const Ship = [
    "Couple",
    "Alone"
];
const Games = [
  "LOL",
  "CSGO",
  "Minecraft",
  "Valorant",
  "Fortnite",
  "GTA",
  "PUBG",
  "MLBB",
  "FiveM",
];

function normalizeKey(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/İ/g, "i");
}

function getRoleByConfigOrName(guild, idOrNull, nameIncludesKey) {
  if (!guild) return null;
  if (idOrNull && guild.roles.cache.has(String(idOrNull))) {
    return guild.roles.cache.get(String(idOrNull));
  }
  if (!nameIncludesKey) return null;
  const key = normalizeKey(nameIncludesKey);
  return guild.roles.cache.find((r) => normalizeKey(r.name).includes(key)) || null;
}

module.exports = {
    name: "menü",
    description: "Etkinlik menüsünü açar",
    category: "OWNER",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["menu"],
      usage: ".menü", 
    },
  

    onLoad: function (client) {

      client.on(Events.InteractionCreate, async (interaction) => {

        if (interaction.isButton() && (interaction.customId === "menu_etkinlik_btn" || interaction.customId === "menu_cekilis_btn")) {
          const guild = client.guilds.cache.get(j2poncik.ServerID);
          if (!guild || !interaction.member) return;
          const menuRolesCfg = j2ponm.MenuRoles || {};
          const etkinlik = getRoleByConfigOrName(guild, menuRolesCfg?.etkinlik, "Etkinlik Duyuru");
          const cekilis = getRoleByConfigOrName(guild, menuRolesCfg?.cekilis, "Cekilis Duyuru");
          const isEtkinlik = interaction.customId === "menu_etkinlik_btn";
          const role = isEtkinlik ? etkinlik : cekilis;
          if (!role) return interaction.reply({ content: "Rol bulunamadı.", ephemeral: true });
          const has = interaction.member.roles.cache.has(role.id);
          if (has) {
            await interaction.member.roles.remove(role).catch(() => {});
            return interaction.reply({ content: `${isEtkinlik ? "Etkinlik" : "Çekiliş"} Katılımcısı rolü alındı.`, ephemeral: true });
          }
          await interaction.member.roles.add(role).catch(() => {});
          return interaction.reply({ content: `${isEtkinlik ? "Etkinlik" : "Çekiliş"} Katılımcısı rolü verildi.`, ephemeral: true });
        }

        if(interaction.isStringSelectMenu()) {
          if(interaction.customId === "byj2pon") {
            const guild = client.guilds.cache.get(j2poncik.ServerID);
            const menuRolesCfg = j2ponm.MenuRoles || {};
            const etkinlik = getRoleByConfigOrName(guild, menuRolesCfg?.etkinlik, "Etkinlik Duyuru");
            const cekilis = getRoleByConfigOrName(guild, menuRolesCfg?.cekilis, "Cekilis Duyuru");
            
            if (cekilis) {
                console.log("Çekiliş Duyuru rolü bulundu:", cekilis.name);
            } else {
                console.error("Çekiliş Duyuru rolü bulunamadı!");
            }
            
            let eventsMap = new Map([
                ["etkinlik", etkinlik],
                ["çekiliş", cekilis],
            ]);
            let roles = [etkinlik, cekilis];
            let roleToAdd = [];
            
            for (let index = 0; index < interaction.values.length; index++) {
                let ids = interaction.values[index].toLowerCase();
                let selectedRole = eventsMap.get(ids);
                if (selectedRole) {
                    roleToAdd.push(selectedRole);
                }
            }
            
            if (interaction.values[0] === "ecRemove") {
              await interaction.member.roles.remove(roles.filter(Boolean)).catch(err => {
                  console.error("Error removing roles:", err);
              });
          } else {
              if (!interaction.values.length) {
                  await interaction.member.roles.remove(roles.filter(Boolean)).catch(err => {
                      console.error("Error removing roles:", err);
                  });
              } else if (roleToAdd.length > 0) {
                  await interaction.member.roles.add(roleToAdd.filter(Boolean)).catch(err => {
                  console.error("Error adding roles:", err);
                  })
              } 
          }
          
          interaction.reply({ content: "Başarıyla Rolleriniz güncellendi!", ephemeral: true });
          } 
          if(interaction.customId === "byj2pon2") {
           
            const guild = client.guilds.cache.get(j2poncik.ServerID);
            const oyunCfg = (j2ponm.MenuRoles && j2ponm.MenuRoles.oyun) ? j2ponm.MenuRoles.oyun : {};
            const lol = getRoleByConfigOrName(guild, oyunCfg?.lol, "LOL");
            const csgo = getRoleByConfigOrName(guild, oyunCfg?.csgo, "CSGO");
            const minecraft = getRoleByConfigOrName(guild, oyunCfg?.minecraft, "Minecraft");
            const valorant = getRoleByConfigOrName(guild, oyunCfg?.valorant, "Valorant");
            const fortnite = getRoleByConfigOrName(guild, oyunCfg?.fortnite, "Fortnite");
            const gta = getRoleByConfigOrName(guild, oyunCfg?.gta, "GTA");
            const pubg = getRoleByConfigOrName(guild, oyunCfg?.pubg, "PUBG");
            const mlbb = getRoleByConfigOrName(guild, oyunCfg?.mlbb, "MLBB");
            const fivem = getRoleByConfigOrName(guild, oyunCfg?.fivem, "FiveM");

            let GameMap = new Map([
              ["lol", lol],
              ["csgo", csgo],
              ["minecraft", minecraft],
              ["valorant", valorant],
              ["fortnite", fortnite],
              ["gta", gta],
              ["pubg", pubg],
              ["mlbb", mlbb],
              ["fivem", fivem],
          ]);
          
          let roles = [lol, csgo, minecraft, valorant, fortnite, gta, pubg, mlbb, fivem];
          let roleToAdd = [];
          
          for (let index = 0; index < interaction.values.length; index++) {
              let ids = interaction.values[index];
              let selectedRole = GameMap.get(ids);
              
              if (selectedRole) {
                  roleToAdd.push(selectedRole);
              }
          }
          
          if (interaction.values[0] === "gameRoleRemove") {
              await interaction.member.roles.remove(roles.filter(Boolean)).catch(err => {
                  console.error("Error removing roles:", err);
              });
          } else {
              if (!interaction.values.length) {
                  await interaction.member.roles.remove(roles.filter(Boolean)).catch(err => {
                      console.error("Error removing roles:", err);
                  });
              } else if (roleToAdd.length > 0) {
                  await interaction.member.roles.add(roleToAdd.filter(Boolean)).catch(err => {
                      console.error("Error adding roles:", err);
                  });
              } else {
                  console.error("No valid roles to add.");
              }
          }
          
          interaction.reply({ content: "Başarıyla Rolleriniz güncellendi!", ephemeral: true });
          
          

          }
          if(interaction.customId === "byj2pon3") {

            const guild = client.guilds.cache.get(j2poncik.ServerID);
            const iliskiCfg = (j2ponm.MenuRoles && j2ponm.MenuRoles.iliski) ? j2ponm.MenuRoles.iliski : {};
            const couple = getRoleByConfigOrName(guild, iliskiCfg?.couple, "Couple");
            const alone = getRoleByConfigOrName(guild, iliskiCfg?.alone, "Alone");

              let ilişki = new Map([
                  ["couple", couple],
                  ["alone", alone],
                ])
                let iliskiroller = [couple, alone]
                for (let index = 0; index < interaction.values.length; index++) {
                  let ids = interaction.values[index]
                  let den = ilişki.get(ids)
                  var role = []
                  role.push(den);
                }
                if (interaction.values[0] === "iliskiRoleRemove") {
                  await interaction.member.roles.remove(iliskiroller.filter(Boolean)).catch(() => {})
                } else {
                  if (!interaction.values.length) {
                      await interaction.member.roles.remove(iliskiroller.filter(Boolean)).catch(() => {})
                    } else if (interaction.values.length > 1) {
                      await interaction.member.roles.add(iliskiroller.filter(Boolean)).catch(() => {})
                    } else {
                      await interaction.member.roles.remove(iliskiroller.filter(Boolean)).catch(() => {})
                      await interaction.member.roles.add(role.filter(Boolean)).catch(() => {})
                    }
                }
                  interaction.reply({ content: "Başarıyla Rolleriniz güncellendi!", ephemeral: true })
          }
          if(interaction.customId === "byj2pon4") {
            return interaction.reply({ content: "Bu menü artık kullanılmıyor. Renk rollerini Booster panelinden alabilirsiniz.", ephemeral: true });
          }
        }
      });


    },

    onCommand: async function (client, message, args, byj2ponembed) {
      const gameActionRow = new ActionRowBuilder()
      const iliskiActionRow = new ActionRowBuilder()

      const gameSelect = new StringSelectMenuBuilder()
      .setCustomId("byj2pon2")
      .setMaxValues(1)
      .setMinValues(1)
      .setPlaceholder("Oyun Rolleri");

      const iliskiSelect = new StringSelectMenuBuilder()
      .setCustomId("byj2pon3")
      .setMaxValues(1)
      .setMinValues(1)
      .setPlaceholder("İlişki Rolleri");

      const emojiBul = (emojiName) => {
        if(!emojiName) return null;
        const emoji = client.emojis.cache.find(x => x.name.includes(emojiName));
        if (emoji && emoji.id && typeof emoji.id === 'string' && emoji.id.length > 0 && /^\d+$/.test(emoji.id)) {
          return { id: emoji.id };
        }
        return null;
      }

      Ship.forEach(ship => {
        const emoji = emojiBul(ship.toLowerCase().replace("ç", "c").replace("ı", "i").replace("ö", "o").replace("ğ", "g").replace("ç", "c").replace("ü", "u").replace("ş", "s").replace("İ", "i"));
        const option = {
          label: ship,
          value: ship.toLowerCase()
        };
        if (emoji) option.emoji = emoji;
        iliskiSelect.addOptions([option]);
      });

      Games.forEach(game => {
        const emoji = emojiBul(game.toLowerCase());
        const option = {
          label: game,
          value: game.toLowerCase()
        };
        if (emoji) option.emoji = emoji;
        gameSelect.addOptions([option]);
      });
      iliskiSelect.addOptions([
        { label: "Rol İstemiyorum.", value: "iliskiRoleRemove" }
      ]);
      gameSelect.addOptions([
        {
          label: "Rol İstemiyorum.",
          value: "gameRoleRemove"
        }
      ]);

      gameActionRow.addComponents(gameSelect);
      iliskiActionRow.addComponents(iliskiSelect);

      const guildName = message.guild?.name || "Carmenta";
      const titleContent = `## Merhaba ${guildName} Üyeleri!`;
      const introContent = "Sunucuda sizleri rahatsız etmemek için @everyone veya @here kullanılmayacaktır.\n\nAşağıdaki buton ve menüler aracılığıyla ilgini çeken rollerden haberdar olabilirsiniz.";
      const bulletContent = [
        "• **Çekiliş Katılımcısı:** Sunucumuzda sıkça vereceğimiz özel ödülleri kaçırma!",
        "• **Etkinlik Katılımcısı:** Oyun, konser ve özel etkinliklerden anında haberdar ol.",
      ].join("\n");
      const footerContent = 'Aşağıdaki seçeneklerden istediğin rolleri seçebilirsin. İstersen "Rol İstemiyorum" seçeneğiyle seçimlerini sıfırlayabilirsin.';

      const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("menu_etkinlik_btn")
          .setLabel("Etkinlik Katılımcısı")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(parseEmoji(client.emoji("etkinlik"), "🍃")),
        new ButtonBuilder()
          .setCustomId("menu_cekilis_btn")
          .setLabel("Çekiliş Katılımcısı")
          .setStyle(ButtonStyle.Primary)
          .setEmoji(parseEmoji(client.emoji("cekilis"), "🎁"))
      );

      const fullContent = [titleContent, "", introContent, "", bulletContent, "", footerContent].join("\n");
      const actionRows = [buttonRow, iliskiActionRow, gameActionRow];

      if (ContainerBuilder && TextDisplayBuilder && SeparatorBuilder && SeparatorSpacingSize != null && MessageFlags?.IsComponentsV2 != null) {
        // Create a header section with thumbnail accessory so we can send Component V2 without embeds
        const container = new ContainerBuilder();
        try {
          if (SectionBuilder && ThumbnailBuilder) {
            const headerSection = new SectionBuilder()
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(titleContent),
                new TextDisplayBuilder().setContent(introContent)
              )
              .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.client.user.displayAvatarURL({ size: 256 })));
            container.addSectionComponents(headerSection);
          } else {
            container.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(titleContent),
              new TextDisplayBuilder().setContent(introContent)
            );
          }
          container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(bulletContent),
              new TextDisplayBuilder().setContent(footerContent)
            )
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true));

          if (typeof container.addActionRowComponents === "function") {
            container.addActionRowComponents(...actionRows);
            await message.channel.send({
              components: [container],
              flags: MessageFlags.IsComponentsV2,
            }).catch(async (err) => {
              console.error("Menü (Components V2) gönderilemedi, content ile deniyor:", err?.message);
              const embed = new EmbedBuilder().setDescription(fullContent + "\n\n―――――――――――――――――――\n").setThumbnail(message.client.user.displayAvatarURL({ size: 256 })).setColor(0x2F3136);
              await message.channel.send({ embeds: [embed], components: actionRows });
            });
          } else {
            await message.channel.send({
              components: [container, ...actionRows],
              flags: MessageFlags.IsComponentsV2,
            }).catch(async (err) => {
              console.error("Menü (Components V2) gönderilemedi, content ile deniyor:", err?.message);
              const embed = new EmbedBuilder().setDescription(fullContent + "\n\n―――――――――――――――――――\n").setThumbnail(message.client.user.displayAvatarURL({ size: 256 })).setColor(0x2F3136);
              await message.channel.send({ embeds: [embed], components: actionRows });
            });
          }
        } catch (err) {
          console.error("Menu container build/send error:", err);
          const embed = new EmbedBuilder().setDescription(fullContent + "\n\n―――――――――――――――――――\n").setThumbnail(message.client.user.displayAvatarURL({ size: 256 })).setColor(0x2F3136);
          await message.channel.send({ embeds: [embed], components: actionRows });
        }
      } else {
        const embed = new EmbedBuilder().setDescription(fullContent + "\n\n―――――――――――――――――――\n").setThumbnail(message.client.user.displayAvatarURL({ size: 256 })).setColor(0x2F3136);
        await message.channel.send({ embeds: [embed], components: actionRows });
      }


     },

  };