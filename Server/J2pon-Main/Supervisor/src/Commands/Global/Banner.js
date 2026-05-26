const {
  ApplicationCommandOptionType,
  ButtonStyle,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  PermissionsBitField
} = require("discord.js");
const axios = require('axios');
const kanal = require("../../../../../../Global/Settings/AyarName");

module.exports = {
  name: "banner",
  description: "Kullanıcının bannerini gösterir",
  category: "USER",
  cooldown: 0,
  command: {
    enabled: true,
    aliases: [],
    usage: ".banner",
  },

  onLoad: function (client) { },

  onCommand: async function (client, message, args) {
    const member = args.length > 0
      ? message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null)
      : message.author;

    if (!member) {
      return message.channel.send({ content: "Kullanıcı bulunamadı." });
    }

    let banner = await byj2ponBanner(member.id, client);

    try {
      // Geçerli bir URL olup olmadığını kontrol et
      new URL(banner);

      let Link = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Tarayıcıda Aç")
          .setStyle(ButtonStyle.Link)
          .setURL(banner)
      );

      await message.channel.send({ content: `${banner}`, components: [Link] });

    } catch {
      // Geçerli URL değilse düz mesaj gönder
      await message.channel.send({ content: banner });
    }
  },
};

// Kullanıcının bannerını çeken fonksiyon
async function byj2ponBanner(user, client) {
  try {
    const response = await axios.get(`https://discord.com/api/v9/users/${user}`, {
      headers: {
        'Authorization': `Bot ${client.token}`
      }
    });

    if (!response.data.banner) return "Kullanıcının bannerini bulunmamaktadır!";
    
    const format = response.data.banner.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/banners/${response.data.id}/${response.data.banner}.${format}?size=512`;

  } catch (err) {
    console.error("Banner alma hatası:", err);
    return "Banner bilgisi alınırken bir hata oluştu.";
  }
}
