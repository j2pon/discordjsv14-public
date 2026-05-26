const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionsBitField, ActivityType, AttachmentBuilder } = require("discord.js");
const axios = require('axios');
const cezapuan = require("../../../../../../Global/Schemas/cezapuan");
const moment = require("moment");
const { profileImage } = require('discord-arts');
const kanal = require("../../../../../../Global/Settings/AyarName");
const serverSpotify = require("../../../../../../Global/Plugins/Spotify/Spotify");
const emojis = require("../../../../../../Global/Settings/Emojis.json");

require("moment-duration-format")
moment.locale("tr")
module.exports = {
    name: "me",
    description: "Kullanıcının discord verilerini gösterir.",
    category: "USER",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["me","kb","info","bilgi","kullanıcıbilgi"],
      usage: ".profil",
    },

    onLoad: function (client) { },

    onCommand: async function (client, message, args, byj2ponembed) {

    

    let üye = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
    if (üye.user.bot) return;

    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('profil')
          .setPlaceholder(`${üye.user.username} isimli kullanıcının detaylarını görüntüle!`)
          .addOptions([
            { label: "Genel İstatistikler", description: `${üye.user.username} üyesinin sunucu içerisinde aktifliğini gösterir.`, emoji: emojis.server_loading, value: "stat" },
            { label: "Ceza Geçmişi", description: `${üye.user.username} üyesinin ceza geçmişini listelenir.`, emoji: emojis.server_carpi, value: "cezalarim" },
            { label: "Ses Geçmişi", description: `${üye.user.username} üyesinin ses kayıtlarını gösterir.`, emoji: emojis.server_members, value: "sesgecmisim" },
            // Ekonomi sistemi kaldırıldı
            { label: 'Profil Fotoğrafı', description: `${üye.user.username} üyesinin profil resmini büyütür.`, emoji: emojis.server_nitro, value: 'avatar' },
            { label: 'Profil Kapağı', description: `${üye.user.username} üyesinin profil arkaplanını büyütür.`, emoji: emojis.server_star2, value: 'banner' },
          ]),
      );

    let platform = { web: '`İnternet Tarayıcısı` `🌍`', desktop: '`PC (App)` `💻`', mobile: '`Mobil` `📱`' }
    let bilgi;
    if(üye.presence && üye.presence.status !== 'offline' && üye.presence.clientStatus && Object.keys(üye.presence.clientStatus).length > 0) { 
        bilgi = `\` • \` Bağlandığı Cihaz: ${platform[Object.keys(üye.presence.clientStatus)[0]] || '`Bilinmiyor`'}` 
    } else { 
        bilgi = '\` • \` Bağlandığı Cihaz: `Çevrimdışı` `🔻`' 
    }
    let cezapuanData = await cezapuan.findOne({ userID: üye.user.id });
const roles = Array.from(üye.roles.cache.filter(role => role.name !== "@everyone").values()).map(role => "<@&" + role.id + ">");
const roleList = üye.roles.cache.size <= 5
  ? roles.join(", ")
  : "Listelenemedi!";

    message.react(`${client.emoji("server_onay")}`)
    let embed = new EmbedBuilder()
      .setImage('attachment://j2pon.png')
      .setThumbnail(üye.user.displayAvatarURL({ dynamic: true, size: 2048 }))
      .addFields(
        {
          name: `${client.emoji("server_star2")} **Kullanıcı Bilgisi**`,
          value: `
\` • \` Profil: ${üye}
\` • \` ID: \`${üye.id}\`
\` • \` Oluşturulma Tarihi: <t:${Math.floor(üye.user.createdTimestamp / 1000)}:R>
${bilgi}
       `, inline: false
        },
        {
          name: `${client.emoji("server_info")} **Sunucu Bilgisi**`,
          value: `
\` • \` Sunucu İsmi: \`${üye.displayName}\`
\` • \` Ceza Puanı: \`${cezapuanData ? cezapuanData.cezapuan : 0}\`
\` • \` Katılma Tarihi: <t:${Math.floor(üye.joinedAt / 1000)}:R>
\` • \` Katılım Sırası: \`${(message.guild.members.cache.filter(a => a.joinedTimestamp <= üye.joinedTimestamp).size).toLocaleString()}/${(message.guild.memberCount).toLocaleString()}\`
\` • \` Rolleri: (\`${üye.roles.cache.size - 1 >= 0 ? üye.roles.cache.size - 1 : 0}\`): ${roleList}
       `, inline: false
        },
      );

      // Ekonomi/evlilik bilgileri kaldırıldı

      let obje;
      if (üye && üye.presence && üye.presence.activities && üye.presence.activities.some(x => x.name == "Spotify" && x.type == ActivityType.Listening)) {
        let status = üye.presence.activities.find(x => x.name == "Spotify");
        if (status && status.assets && status.timestamps) {
          try {
            // Spotify görsel ID'sini al (spotify:xxxxx formatından xxxxx kısmını al)
            let spotifyImageId = null;
            if (status.assets?.largeImage) {
              const largeImage = status.assets.largeImage;
              // spotify:xxxxx formatından ID'yi çıkar
              if (largeImage.startsWith('spotify:')) {
                spotifyImageId = largeImage.slice(8); // "spotify:" kısmını kes (8 karakter)
              } else if (largeImage.startsWith('https://')) {
                // Eğer zaten tam URL ise direkt kullan
                spotifyImageId = largeImage;
              } else {
                // Direkt ID ise
                spotifyImageId = largeImage;
              }
            }
            
            const spotifyImageUrl = spotifyImageId && !spotifyImageId.startsWith('https://') 
              ? `https://i.scdn.co/image/${spotifyImageId}` 
              : spotifyImageId;
            
            if (spotifyImageUrl) {
              const spotify = await new serverSpotify()
              .setOverlayOpacity(0.7)
              .setAuthor(status.state || "")
              .setAlbum(status.assets.largeText || "")
              .setImage(spotifyImageUrl)
              .setTimestamp(new Date(Date.now()).getTime() - new Date(status.timestamps.start).getTime(), new Date(status.timestamps.end).getTime() - new Date(status.timestamps.start).getTime())
              .setTitle(status.details || "")
              .build();
              embed.setImage("attachment://spotify.png");
              obje = { content: ``, embeds: [embed], components: [row], files:[{name:"spotify.png",attachment:spotify}]}
            } else {
              obje = { content: ``, embeds: [embed], components: [row]}
            }
          } catch (error) {
            console.error('Spotify görseli oluşturulamadı:', error.message);
            obje = { content: ``, embeds: [embed], components: [row]}
          }
        } else {
          obje = { content: ``, embeds: [embed], components: [row]}
        }
       } else {
        obje = { content: ``, embeds: [embed], components: [row]}
       }

    let byj2pon = await message.reply({ content: `${client.emoji("server_loading")} | **${üye.user.username}** isimli üyenin detaylı bilgileri yükleniyor...` })
    byj2pon.edit(obje)
    var filter = (menu) => menu.user.id === message.author.id;
    const collector = byj2pon.createMessageComponentCollector({ filter, time: 60000 })

    collector.on("collect", async (menu) => {
      if (menu.values[0] === "avatar") {
        menu.reply({ content: `${üye.displayAvatarURL({ dynamic: true, size: 4096 })}`, ephemeral: true })
      }

      if (menu.values[0] === "banner") {
        let banner = await byj2ponBanner(üye.id, client)
        menu.reply({ content: `${banner}`, ephemeral: true })
      }

      if (menu.values[0] === "cezalarim") {
        let kom = client.commands.find(x => x.name == "sicil")
        if (kom) kom.onCommand(client, message, args, byj2ponembed)
        byj2pon.delete().catch(err => { })
        menu.deferUpdate().catch(err => { })
      }

      if (menu.values[0] === "sesgecmisim") {
        let kom = client.commands.find(x => x.name == "kanallog")
        if (kom) kom.onCommand(client, message, args, byj2ponembed)
        byj2pon.delete().catch(err => { })
        menu.deferUpdate().catch(err => { })
      }

      if (menu.values[0] === "stat") {
        let kom = client.commands.find(x => x.name == "stat" || x.name == "profil")
        if (kom) {
          menu.deferUpdate().catch(err => { })
          byj2pon.delete().catch(err => { })
          const statArgs = [üye.id]
          kom.onCommand(client, message, statArgs, byj2ponembed)
        } else {
          menu.reply({ content: "İstatistik komutu bulunamadı!", ephemeral: true })
        }
      }

    })
    collector.on("end", () => {
      byj2pon.delete().catch(err => { })
    })
  },
};

async function byj2ponBanner(user, client) {
  const response = await axios.get(`https://discord.com/api/v9/users/${user}`, { headers: { 'Authorization': `Bot ${client.token}` } });
  if(!response.data.banner) return `Kişinin banneri yok!`
  if(response.data.banner.startsWith('a_')) return `https://cdn.discordapp.com/banners/${response.data.id}/${response.data.banner}.gif?size=512`
  else return(`https://cdn.discordapp.com/banners/${response.data.id}/${response.data.banner}.png?size=512`)
}