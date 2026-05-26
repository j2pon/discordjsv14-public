const afk = require("../../../../../../Global/Schemas/afk");
const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
    name: "afk",
    description: "Afk Bırakırsınız",
    category: "USER",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: [],
      usage: ".afk",
    },


    onLoad: function (client) {

        client.on("messageCreate", async (message) => { 
          if (message.author.bot || !message.guild || message.content.toLowerCase().startsWith(".afk")) return;
          const data = await afk.findOne({ guildID: message.guild.id, userID: message.author.id });
          const embed = new EmbedBuilder().setAuthor({ name: message.member.displayName});
          if (data) {
            const afkData = await afk.findOne({ guildID: message.guild.id, userID: message.author.id });
            await afk.deleteOne({ guildID: message.guild.id, userID: message.author.id });
            if (message.member.displayName.includes("[AFK]") && message.member.manageable) await message.member.setNickname(message.member.displayName.replace("[AFK]", ""));
            message.reply({ content:`Merhaba **${message.author.username}** Tekrardan Hoş Geldin.`}).then((e) => setTimeout(() => { e.delete(); }, 5000)); 
          }
          
          const member = message.mentions.members.first();
          if (!member) return;
          const afkData = await afk.findOne({ guildID: message.guild.id, userID: member.user.id });
          if (!afkData) return;
          embed.setDescription(`${member.toString()} kullanıcısı, \`${afkData.reason}\` sebebiyle, <t:${Math.floor(afkData.date / 1000)}:R> afk oldu!`);
          message.channel.send({ embeds: [embed]}).then((e) => setTimeout(() => { e.delete(); }, 10000)); 
        })
 },

    onCommand: async function (client, message, args) {
        if (message.member.displayName.includes("[AFK]")) return;

        const reason = args.join(" ") || "Belirtilmedi";
        
        try {
            await afk.findOneAndUpdate(
                { guildID: message.guild.id, userID: message.author.id }, 
                { $set: { reason, date: Date.now() } }, 
                { upsert: true }
            );
            
            message.react(`${client.emoji("server_onay")}`);
            message.reply({ content: "Başarıyla [AFK] moduna girdiniz!" })
                .then((e) => setTimeout(() => { e.delete(); }, 10000)); 
            
            if (message.member.manageable) {
                let newNick = `[AFK] ${message.member.displayName}`;
                if (newNick.length > 32) newNick = newNick.substring(0, 32);
                await message.member.setNickname(newNick);
            }
        } catch (error) {
            console.error("AFK komutunda hata:", error);
            message.reply({ content: "AFK moduna geçerken bir hata oluştu!" });
        }
    },

  };