const { ApplicationCommandOptionType,PermissionsBitField } = require("discord.js");
const VoiceChannels = require("../../../../../J2pon-Guard/Schemas/Backup/Guild.Voice.Channels");

module.exports = {
    name: "seskur",
    description: "Silinen ses kanallarını kurmak için.",
    category: "OWNER",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["sesKur","sk","seskur"],
      usage: ".seskur @Kanal/ID",
    },
  

    onLoad: function (client) { },

    onCommand: async function (client, message, args, byj2ponembed) {
        try {
            if (!args[0] || isNaN(args[0])) return message.reply({embeds:[byj2ponembed.setDescription(`Bir Kanal **\`ID\`**'sini yazın.`)]}).then((e) => setTimeout(() => { e.delete(); }, 5000)); 
            
            VoiceChannels.findOne({ channelID: args[0] }, async (err, data) => {
                if (err) {
                    console.error("VoiceChannels findOne error:", err);
                    return message.reply({embeds:[byj2ponembed.setDescription(`Veri tabanında hata oluştu.`)]}).then((e) => setTimeout(() => { e.delete(); }, 5000));
                }
                
                if (!data) return message.reply({embeds:[byj2ponembed.setDescription(`Veri bulunamadı.`)]}).then((e) => setTimeout(() => { e.delete(); }, 5000)); 
                
                const newChannel = await message.guild.channels.create({
                    name: data.name,
                    type: 2,
                    bitrate: data.bitrate,
                    parentID: data.parentID,
                    position: data.position + 1,
                });
                
                await newChannel.setParent(data.parentID).catch(x => undefined);
                let comp = await message.channel.send({ embeds: [byj2ponembed.setDescription(`**${newChannel.name}** isimli kanal yedeği kuruluyor...`)] });
                
                const newOverwrite = [];
                for (let index = 0; index < data.overwrites.length; index++) {
                    const veri = data.overwrites[index];
                    newOverwrite.push({
                        id: veri.id,
                        allow: new PermissionsBitField(veri.allow).toArray(),
                        deny: new PermissionsBitField(veri.deny).toArray()
                    });
                }
                
                await newChannel.permissionOverwrites.set(newOverwrite);
                data.channelID = newChannel.id;
                data.save();
                
                // dataCheck fonksiyonu varsa çağır
                if (typeof global.dataCheck === 'function') {
                    await global.dataCheck(args[0], newChannel.id, "channel");
                }
                
                comp.edit({embeds:[byj2ponembed.setDescription(`**${newChannel.name}** Kanalı kuruldu ve ayarları yapıldı!`)]});
            });
        } catch (error) {
            console.error("VoiceCreate command error:", error);
            message.reply({embeds:[byj2ponembed.setDescription(`Ses kanalı kurulurken bir hata oluştu: ${error.message}`)]}).then((e) => setTimeout(() => { e.delete(); }, 5000));
        }
     },

  };