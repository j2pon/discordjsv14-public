const { ApplicationCommandOptionType,PermissionsBitField } = require("discord.js");
const CategoryChannels = require("../../../../../J2pon-Guard/Schemas/Backup/Guild.Category.Channels");
const TextChannels = require("../../../../../J2pon-Guard/Schemas/Backup/Guild.Text.Channels");
const VoiceChannels = require("../../../../../J2pon-Guard/Schemas/Backup/Guild.Voice.Channels");
module.exports = {
    name: "kategorikur",
    description: "Silinen kategori kanallarını kurmak için.",
    category: "OWNER",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["kategoriKur","kategorikur","kk"],
      usage: ".kategoriKur @Kanal/ID",
    },
  

    onLoad: function (client) { },

    onCommand: async function (client, message, args, byj2ponembed) {
        try {
            if (!args[0] || isNaN(args[0])) return message.reply({embeds:[byj2ponembed.setDescription(`Bir Kategori **\`ID\`**'sini yazın.`)]}).then((e) => setTimeout(() => { e.delete(); }, 5000)); 
            
            CategoryChannels.findOne({ channelID: args[0] }, async (err, data) => {
                if (err) {
                    console.error("CategoryChannels findOne error:", err);
                    return message.reply({embeds:[byj2ponembed.setDescription(`Veri tabanında hata oluştu.`)]}).then((e) => setTimeout(() => { e.delete(); }, 5000));
                }
                
                if (!data) return message.reply({embeds:[byj2ponembed.setDescription(`Veri bulunamadı.`)]}).then((e) => setTimeout(() => { e.delete(); }, 5000)); 
                
                const newChannel = await message.guild.channels.create({
                    name: data.name,
                    type: 4,
                    position: data.position > 0 ? data.position : 0,
                });
                
                let comp = await message.channel.send({ embeds: [byj2ponembed.setDescription(`**${newChannel.name}** isimli kategori yedeği kuruluyor...`)] });
                
                const textChannels = await TextChannels.find({ parentID: args[0] });
                await TextChannels.updateMany({ parentID: args[0] }, { parentID: newChannel.id });
                textChannels.forEach(c => {
                    const textChannel = message.guild.channels.cache.get(c.channelID);
                    if (textChannel) textChannel.setParent(newChannel, { lockPermissions: false });
                });
                
                const voiceChannels = await VoiceChannels.find({ parentID: args[0] });
                await VoiceChannels.updateMany({ parentID: args[0] }, { parentID: newChannel.id });
                voiceChannels.forEach(c => {
                    const voiceChannel = message.guild.channels.cache.get(c.channelID);
                    if (voiceChannel) voiceChannel.setParent(newChannel, { lockPermissions: false });
                });
                
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
                    await global.dataCheck(args[0], newChannel.id, "category");
                }
                
                comp.edit({embeds:[byj2ponembed.setDescription(`**${newChannel.name}** Kategorisi kuruldu ve ayarları yapıldı!`)]});
            });
        } catch (error) {
            console.error("CategoryCreate command error:", error);
            message.reply({embeds:[byj2ponembed.setDescription(`Kategori kurulurken bir hata oluştu: ${error.message}`)]}).then((e) => setTimeout(() => { e.delete(); }, 5000));
        }
     },

  };