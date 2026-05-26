const { ApplicationCommandOptionType, PermissionsBitField,EmbedBuilder } = require("discord.js");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const { green, red, erkek, kadin, star , ok } = require("../../../../../../Global/Settings/Emojis.json");
const regstats = require("../../../../../../Global/Schemas/registerStats");
const kanal = require("../../../../../../Global/Settings/AyarName");

module.exports = {
    name: "kayitstat",
    description: "Kayıt verilerinizi gösterir.",
    category: "REGISTER",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["kayıtstat"],
      usage: ".kayıtstat", 
    },
 
    onLoad: function (client) { },

    onCommand: async function (client, message, args, byj2ponembed) {

    let kanallar = kanal.KomutKullanımKanalİsim;
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && !kanallar.includes(message.channel.name)) return message.reply({ content: `${kanallar.map(x => `${client.channels.cache.find(chan => chan.name == x)}`)} kanallarında kullanabilirsiniz.`}).then((e) => setTimeout(() => { e.delete(); }, 10000)); 

    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member || message.author;

    if(!j2ponm.ConfirmerRoles.some(j2ponn => message.member.roles.cache.has(j2ponn)) && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const data = await regstats.findOne({ guildID: message.guild.id, userID: member.id });
    if (!data) return message.channel.send({ embeds: [new EmbedBuilder().setDescription(`${member} kullanıcısının hiç kayıt bilgisi bulunmamaktadır.`)]});
    message.react(`${client.emoji("server_onay")}`)
    
    // Kayıt listesini oluştur (Discord embed description limit: 4096 karakter)
    let kayitlarListesi = "";
    if (data.kayitlar && Array.isArray(data.kayitlar) && data.kayitlar.length > 0) {
        const kayitlarMention = data.kayitlar.map((x) => `<@${x}>`).join(", ");
        const baseDescription = `
    ${client.emoji("server_star")} Toplam \`${data ? data.top : 0}\` kayıdın mevcut. 
    ${client.emoji("server_erkek")} Toplam \`${data ? data.erkek : 0}\` **erkek** kayıdın mevcut. 
    ${client.emoji("server_kadin")} Toplam \`${data ? data.kız : 0}\` **kız** kayıdın mevcut.

   **❯ Kaydettiği tüm kişiler;**
   `;
        
        // Eğer toplam uzunluk 4096 karakteri aşarsa, ilk N kişiyi göster
        const maxLength = 4096 - baseDescription.length - 50; // 50 karakter güvenlik payı
        if (kayitlarMention.length > maxLength) {
            // İlk N kişiyi göster, geri kalanını sayı olarak belirt
            let truncated = "";
            let count = 0;
            const kayitlarArray = data.kayitlar.map((x) => `<@${x}>`);
            for (const mention of kayitlarArray) {
                if ((truncated + mention + ", ").length > maxLength - 30) { // 30 karakter "ve X kişi daha" için
                    break;
                }
                truncated += mention + ", ";
                count++;
            }
            kayitlarListesi = truncated + `ve **${data.kayitlar.length - count}** kişi daha...`;
        } else {
            kayitlarListesi = kayitlarMention;
        }
    } else {
        kayitlarListesi = "Kayıt edilen kişi bulunmamaktadır.";
    }
    
    const description = `
    ${client.emoji("server_star")} Toplam \`${data ? data.top : 0}\` kayıdın mevcut. 
    ${client.emoji("server_erkek")} Toplam \`${data ? data.erkek : 0}\` **erkek** kayıdın mevcut. 
    ${client.emoji("server_kadin")} Toplam \`${data ? data.kız : 0}\` **kız** kayıdın mevcut.

   **❯ Kaydettiği tüm kişiler;**
   ${kayitlarListesi}
  `;
    
    message.channel.send({ embeds: [byj2ponembed.setThumbnail(message.author.avatarURL({ dynamic: true, size: 2048 })).setDescription(description)] });
// ${data.kayitlar.map(x=> `${x}`).join(", ")}
     },

  };