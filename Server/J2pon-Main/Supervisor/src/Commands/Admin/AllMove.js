const { PermissionsBitField, ChannelType } = require("discord.js");
const setup = require("../../../../../../Global/Settings/Setup.json");

module.exports = {
    name: "toplutaşı",
    description: "",
    category: "ADMIN",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["toplutası","toplutasi","allmove"],
      usage: ".toplutaşı <taşıyacağınız-kanal>", 
    },

    onLoad: function (client) { },

    onCommand: async function (client, message, args, byj2ponembed) { 
        // Yetki kontrolü
        if (!setup.OwnerRoles.some(role => message.member.roles.cache.has(role)) && 
            !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) { 
            message.react(`${client.emoji("server_carpi")}`);
            return message.reply({ content: "Yeterli yetkin yok!" })
                .then((e) => setTimeout(() => { e.delete(); }, 5000)); 
        }

        const currentChannel = message.member.voice.channel;
        const targetChannel = message.guild.channels.cache.find((channel) => 
            channel.type === ChannelType.GuildVoice && channel.id === args[0]
        );

        if (!currentChannel) {
            return message.reply({ content: "Toplu taşıma işlemi uygulamadan önce bir ses kanalına bağlı olmalısın!" });  
        }
        
        if (!targetChannel) {
            return message.reply({ content: "Üyeleri hangi kanala taşımak istiyorsunuz?" });
        }

        // Toplu taşıma işlemi
        try {
            for (const member of currentChannel.members.values()) {
                await member.voice.setChannel(targetChannel);
            }

            message.react(`${client.emoji("server_onay")}`);
            await message.reply({ content: `Mevcut kanaldaki üyeler **${targetChannel.name}** kanalına taşındı` });
        } catch (error) {
            console.error("Toplu taşıma hatası:", error);
            message.reply({ content: "Toplu taşıma işlemi sırasında bir hata oluştu!" });
        }
    },

  };