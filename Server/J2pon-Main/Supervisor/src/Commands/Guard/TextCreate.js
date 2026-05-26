const { ApplicationCommandOptionType,PermissionsBitField } = require("discord.js");
const TextChannels = require("../../../../../J2pon-Guard/Schemas/Backup/Guild.Text.Channels");

module.exports = {
    name: "metinkur",
    description: "Silinen metin kanallarını kurmak için.",
    category: "OWNER",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["metinKur", "mk", "metinkur"],
      usage: ".metinkur @Kanal/ID", 
    },
  

    onLoad: function (client) { },

    onCommand: async function (client, message, args, byj2ponembed) {
        try {
            if (!args[0] || isNaN(args[0])) return message.reply({embeds:[byj2ponembed.setDescription(`Bir Kanal **\`ID\`**'sini yazın.`)]}).then((e) => setTimeout(() => { e.delete(); }, 5000)); 
            
            TextChannels.findOne({ channelID: args[0] }, async (err, data) => {
                if (err) {
                    console.error("TextChannels findOne error:", err);
                    return message.reply({embeds:[byj2ponembed.setDescription(`Veri tabanında hata oluştu.`)]}).then((e) => setTimeout(() => { e.delete(); }, 5000));
                }
                
                if (!data) return message.reply({embeds:[byj2ponembed.setDescription(`Veri bulunamadı.`)]}).then((e) => setTimeout(() => { e.delete(); }, 5000)); 
                
                const newChannel = await message.guild.channels.create({
                    name: data.name,
                    type: data.type,
                    nsfw: data.nsfw,
                    position: data.position + 1,
                    rateLimit: data.rateLimit,
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
                
                comp.edit({embeds:[byj2ponembed.setDescription(`**${newChannel.name}** Kanal kuruldu ve ayarları yapıldı!`)]});
            });
        } catch (error) {
            console.error("TextCreate command error:", error);
            message.reply({embeds:[byj2ponembed.setDescription(`Kanal kurulurken bir hata oluştu: ${error.message}`)]}).then((e) => setTimeout(() => { e.delete(); }, 5000));
        }
     },

  };