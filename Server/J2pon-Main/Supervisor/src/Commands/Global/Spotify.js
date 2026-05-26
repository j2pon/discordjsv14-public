const { ApplicationCommandOptionType,EmbedBuilder,ActivityType,PermissionsBitField } = require("discord.js");
const j2poncik = require("../../../../../../Global/Settings/System");
const kanal = require("../../../../../../Global/Settings/AyarName");
const serverSpotify  = require("../../../../../../Global/Plugins/Spotify/Spotify")

module.exports = {
    name: "spotify",
    description: "Kullanıcının hangi şarkıyı dinlediğini gösterir.",
    category: "USER",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["spo"],
      usage: ".spotify", 
    },
  
    onLoad: function (client) { },

    onCommand: async function (client, message, args, byj2ponembed) {

      let kanallar = kanal.KomutKullanımKanalİsim;
     if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && !kanallar.includes(message.channel.name)) return message.reply({ content: `${kanallar.map(x => `${client.channels.cache.find(chan => chan.name == x)}`)} kanallarında kullanabilirsiniz.`}).then((e) => setTimeout(() => { e.delete(); }, 10000)); 

     const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
     if (member && member.presence && member.presence.activities && member.presence.activities.some(j2ponlan => j2ponlan.name == "Spotify" && j2ponlan.type == ActivityType.Listening)) {
      let status = await member.presence.activities.find(j2ponlan => j2ponlan.type == ActivityType.Listening);
      
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
        
        const spotify = await new serverSpotify()
          .setOverlayOpacity(0.7)
          .setAuthor(status.state || "")
          .setAlbum(status.assets?.largeText || "")
          .setImage(spotifyImageUrl)
          .setTimestamp(new Date(Date.now()).getTime() - new Date(status.timestamps.start).getTime(), new Date(status.timestamps.end).getTime() - new Date(status.timestamps.start).getTime())
          .setTitle(status.details || "")
          .build();
       
        return message.reply({files:[{name:"j2pon.png",attachment:spotify}]}).catch(() => {});
      } catch (error) {
        console.error('Spotify görseli oluşturulamadı:', error.message);
        return message.reply({content:`Spotify görseli oluşturulurken bir hata oluştu.`}).catch(() => {});
      }
      }else{ return message.reply({content:`Kullanıcı şarkı dinlemiyor.`}).catch(() => {});}


     },

  };