const {
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

const setup = require("../../../../../../Global/Settings/Setup.json");
const system = require("../../../../../../Global/Settings/System");
const kanal = require("../../../../../../Global/Settings/AyarName");
const yetkis = require("../../../../../../Global/Schemas/yetkialdir");

module.exports = {
  name: "yetkililerim",
  description: "Yetkililerinizi görüntüleyebilirsiniz",
  category: "STAT",
  cooldown: 0,
  command: {
    enabled: true,
    aliases: [],
    usage: ".yetkililerim"
  },

  onLoad: function (client) {},

  onCommand: async function (client, message, args, byj2ponembed) {
    if (!setup.ConfirmerRoles.some(role => message.member.roles.cache.has(role)) &&
        !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      message.react(`${client.emoji("server_carpi")}`);
      return message
        .reply({ content: "Yeterli yetkin yok!" })
        .then(e => setTimeout(() => e.delete(), 5000));
    }

    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
    const yetkililerim = await yetkis.findOne({ guildID: message.guild.id, userID: member.id });

    // ❗ Hata Kontrolü
    if (!yetkililerim || !yetkililerim.users || yetkililerim.users.length === 0) {
      return message.reply({ content: `${member} kullanıcısının davet ettiği yetkili bulunmamaktadır.` });
    }

    let currentPage = 1;
    let taglılar = [];

    for (let index = 0; index < yetkililerim.users.length; index++) {
      const info = yetkililerim.users[index];
      taglılar.push({ UserID: info.memberId, Date: info.date });
    }

    const pages = taglılar.chunk(10);
    const geri = new ButtonBuilder().setCustomId("geri").setEmoji("⏮️").setLabel("Önceki Sayfa").setStyle(ButtonStyle.Secondary);
    const carpi = new ButtonBuilder().setCustomId("cancel").setEmoji("❌").setLabel("Sayfaları Kapat").setStyle(ButtonStyle.Danger);
    const ileri = new ButtonBuilder().setCustomId("ileri").setEmoji("⏭️").setLabel("Sonraki Sayfa").setStyle(ButtonStyle.Secondary);

    if (pages.length <= 1) {
      geri.setDisabled(true);
      ileri.setDisabled(true);
    }

    message.channel
      .send({
        content: `**[${currentPage}/${pages.length}]**`,
        components: [new ActionRowBuilder().addComponents(geri, carpi, ileri)],
        embeds: [
          byj2ponembed
            .setDescription(`${member}, toplamda **${yetkililerim.count}** kişiyi yetkiye davet etmişsin.`)
            .addFields({
              name: "Yetkililerin:",
              value: `${pages[currentPage - 1]
                .map((x, index) => `${index + 1}. <@${x.UserID}> - <t:${(x.Date / 1000).toFixed()}> (<t:${(x.Date / 1000).toFixed()}:R>)`)
                .join("\n")}`
            })
        ]
      })
      .then(async msg => {
        const filter = button => button.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

        collector.on("collect", async button => {
          await button.deferUpdate();

          if (button.customId === "ileri") {
            if (currentPage === pages.length) return;
            currentPage++;
          }

          if (button.customId === "geri") {
            if (currentPage === 1) return;
            currentPage--;
          }

          if (button.customId === "cancel") {
            if (msg) msg.delete().catch(() => {});
            if (message) message.delete().catch(() => {});
            return;
          }

          try {
            await msg.edit({
              content: `**[${currentPage}/${pages.length}]**`,
              components: [new ActionRowBuilder().addComponents(geri, carpi, ileri)],
              embeds: [
                byj2ponembed
                  .setDescription(`${member}, toplamda **${yetkililerim.count}** kişiyi yetkiye davet etmişsin.`)
                  .addFields({
                    name: "Yetkililerin:",
                    value: `${pages[currentPage - 1]
                      .map((x, index) => `${index + 1}. <@${x.UserID}> - <t:${(x.Date / 1000).toFixed()}> (<t:${(x.Date / 1000).toFixed()}:R>)`)
                      .join("\n")}`
                  })
              ]
            });
          } catch (error) {
            console.error("Sayfa güncelleme hatası:", error);
          }
        });
      });
  }
};

// Chunk fonksiyonu
Array.prototype.chunk = function (chunk_size) {
  let myArray = Array.from(this);
  let tempArray = [];
  for (let index = 0; index < myArray.length; index += chunk_size) {
    let chunk = myArray.slice(index, index + chunk_size);
    tempArray.push(chunk);
  }
  return tempArray;
};
