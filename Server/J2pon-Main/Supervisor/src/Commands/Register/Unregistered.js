const { ApplicationCommandOptionType,PermissionsBitField, EmbedBuilder } = require("discord.js");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const { red, green } = require("../../../../../../Global/Settings/Emojis.json");
const j2poncik = require("../../../../../../Global/Settings/System");
const isimler = require("../../../../../../Global/Schemas/names");
const kanal = require("../../../../../../Global/Settings/AyarName");

module.exports = {
    name: "unregister",
    description: "belirttiğiniz üyeyi kayıtsıza atar.",
    category: "REGISTER",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["ks","kayıtsız","kayitsiz"],
      usage: ".kayıtsız <user/ID>",
    },
   

    onLoad: function (client) { },

    onCommand: async function (client, message, args) {

      let kanallar = kanal.KomutKullanımKanalİsim;
      if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && !kanallar.includes(message.channel.name)) return message.reply({ content: `${kanallar.map(x => `${client.channels.cache.find(chan => chan.name == x)}`)} kanallarında kullanabilirsiniz.`}).then((e) => setTimeout(() => { e.delete(); }, 10000)); 

      if (!j2ponm.ConfirmerRoles.some(j2ponn => message.member.roles.cache.has(j2ponn)) && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return messageReactAndReply(`${client.emoji("server_carpi")}`,`Yeterli yetkin yok!`);
      }
      
      const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
      if (!member) {
        return messageReactAndReply(`${client.emoji("server_carpi")}`,"Bir kullanıcı etiketlemelisin ya da ID'sini girmelisin.");
      }
      
      if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && member.roles.highest.position >= message.member.roles.highest.position) {
        return messageReactAndReply(`${client.emoji("server_carpi")}`,"Kendinle aynı yetkide ya da daha yetkili olan birini kayıtsıza atamazsın!");
      }
      
      if (!member.manageable) {
        return messageReactAndReply(`${client.emoji("server_carpi")}`,"Bu üyeyi kayıtsıza atamıyorum!");
      }

      function messageReactAndReply(emoji, content) {
        message.react(emoji);
        message.reply({ content }).then((e) => setTimeout(() => { e.delete(); }, 5000));
      }
      
        message.react(`${client.emoji("server_onay")}`)
        member.roles.set(j2ponm.UnRegisteredRoles);
        member.setNickname(`${j2ponm.ServerUntagged} Kayıtsız`)
        message.channel.send({ embeds: [ new EmbedBuilder().setFooter({text: j2poncik.SubTitle}).setDescription(`${client.emoji("server_onay")} ${member} üyesi başarıyla ${message.author} tarafından kayıtsıza atıldı.`)]}).then((e) => setTimeout(() => { e.delete(); }, 5000));
        await isimler.findOneAndUpdate({ guildID: message.guild.id, userID: member.user.id }, { $push: { names: { name: member.displayName, yetkili: message.author.id,  rol: "Kayıtsıza Atıldı", date: Date.now() } } }, { upsert: true });
     },
  };

 