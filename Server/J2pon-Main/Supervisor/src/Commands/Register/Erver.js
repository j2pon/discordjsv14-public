const { ApplicationCommandOptionType, PermissionsBitField, EmbedBuilder } = require("discord.js");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const { red, green } = require("../../../../../../Global/Settings/Emojis.json");
const j2poncik = require("../../../../../../Global/Settings/System");
const isimler = require("../../../../../../Global/Schemas/names");
const kanal = require("../../../../../../Global/Settings/AyarName");
const userRoles = require("../../../../../../Global/Schemas/userRoles");
const otokayit = require("../../../../../../Global/Schemas/otokayit");

module.exports = {
    name: "erver",
    description: "Belirttiğiniz üyenin kayıtlı rollerini geri verir.",
    category: "REGISTER",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["erver", "rolver", "rolgeri"],
      usage: ".erver <@user/ID>",
    },
   
    onLoad: function (client) { },

    onCommand: async function (client, message, args, byj2ponembed) {
      let kanallar = kanal.KomutKullanımKanalİsim;
      if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && !kanallar.includes(message.channel.name)) {
        return message.reply({ content: `${kanallar.map(x => `${client.channels.cache.find(chan => chan.name == x)}`)} kanallarında kullanabilirsiniz.`}).then((e) => setTimeout(() => { e.delete(); }, 10000)); 
      }

      if (!j2ponm.ConfirmerRoles.some(j2ponn => message.member.roles.cache.has(j2ponn)) && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return messageReactAndReply(`${client.emoji("server_carpi")}`,`Yeterli yetkin yok!`);
      }
      
      const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
      if (!member) {
        return messageReactAndReply(`${client.emoji("server_carpi")}`,"Bir kullanıcı etiketlemelisin ya da ID'sini girmelisin.");
      }
      
      if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && member.roles.highest.position >= message.member.roles.highest.position) {
        return messageReactAndReply(`${client.emoji("server_carpi")}`,"Kendinle aynı yetkide ya da daha yetkili olan birinin rollerini geri veremezsin!");
      }
      
      if (!member.manageable) {
        return messageReactAndReply(`${client.emoji("server_carpi")}`,"Bu üyenin rollerini geri veremiyorum!");
      }

      function messageReactAndReply(emoji, content) {
        message.react(emoji);
        message.reply({ content }).then((e) => setTimeout(() => { e.delete(); }, 5000));
      }

      // Kayıtlı rolleri kontrol et
      const kayitliRoller = await userRoles.findOne({ guildID: message.guild.id, userID: member.user.id });
      
      if (!kayitliRoller || !kayitliRoller.roles || kayitliRoller.roles.length === 0) {
        return messageReactAndReply(`${client.emoji("server_carpi")}`, `${client.emoji("server_info")} ${member} üyesinin kayıtlı rolü bulunamadı!`);
      }

      try {
        // Rolleri geri ver
        const roller = [];
        const bulunamayanRoller = [];
        
        for (const roleId of kayitliRoller.roles) {
          try {
            const role = await message.guild.roles.fetch(roleId).catch(() => null);
            if (role && role.editable && !member.roles.cache.has(roleId)) {
              roller.push(role);
            } else if (!role) {
              bulunamayanRoller.push(roleId);
            }
          } catch (error) {
            bulunamayanRoller.push(roleId);
          }
        }
        
        if (roller.length === 0 && bulunamayanRoller.length > 0) {
          return messageReactAndReply(`${client.emoji("server_carpi")}`, `${client.emoji("server_info")} ${member} üyesinin kayıtlı rolleri bulunamadı veya silinmiş!`);
        }

        // Rolleri ekle (mevcut rolleri koruyarak)
        if (roller.length > 0) {
          await member.roles.add(roller).catch(() => {});
        }

        // Kayıtsız rolünü kaldır
        if (Array.isArray(j2ponm.UnRegisteredRoles) && j2ponm.UnRegisteredRoles.length) {
          await member.roles.remove(j2ponm.UnRegisteredRoles).catch(() => {});
        }

        // İsim bilgisini geri ver
        const otoreg = await otokayit.findOne({ userID: member.user.id });
        if (otoreg && otoreg.name) {
          await member.setNickname(`${j2ponm.ServerUntagged} ${otoreg.name}`).catch(() => {});
        }

        // Log kaydı
        await isimler.findOneAndUpdate(
          { guildID: message.guild.id, userID: member.user.id },
          { 
            $push: { 
              names: { 
                name: member.displayName, 
                yetkili: message.author.id, 
                rol: roller.map(x => `<@&${x.id}>`).join(", "), 
                date: Date.now(),
                sebep: "Rol Geri Verildi"
              } 
            } 
          },
          { upsert: true }
        );

        // Başarı mesajı
        message.react(`${client.emoji("server_onay")}`);
        
        const successEmbed = new EmbedBuilder()
          .setDescription(`${client.emoji("server_onay")} ${member} üyesine **${roller.length}** adet kayıtlı rol başarıyla geri verildi.`)
          .addFields(
            { name: `${client.emoji("server_info")} Geri Verilen Roller`, value: roller.length > 0 ? roller.map(x => `<@&${x.id}>`).join(", ") : "Yok", inline: false },
            { name: `${client.emoji("server_members")} İşlemi Yapan`, value: `${message.author}`, inline: true },
            { name: `${client.emoji("server_star")} Tarih`, value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
          )
          .setColor("#00ff00")
          .setFooter({ text: j2poncik.SubTitle });

        if (bulunamayanRoller.length > 0) {
          successEmbed.addFields({
            name: `${client.emoji("server_carpi")} Bulunamayan Roller`, 
            value: `${bulunamayanRoller.length} adet rol bulunamadı veya silinmiş.`,
            inline: false
          });
        }

        message.channel.send({ embeds: [successEmbed] }).then((e) => setTimeout(() => { e.delete(); }, 10000));

        // Kayıtlı rolleri sil (geri verildi)
        await userRoles.findOneAndDelete({ guildID: message.guild.id, userID: member.user.id });

      } catch (error) {
        console.error('Rol geri verme hatası:', error);
        return messageReactAndReply(`${client.emoji("server_carpi")}`, `Rol geri verme işlemi sırasında bir hata oluştu: ${error.message}`);
      }
    },
};

