const { PermissionsBitField } = require("discord.js");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const kanal = require("../../../../../../Global/Settings/AyarName");

module.exports = {
    name: "zengin",
    description: "İsminizi değiştirirsiniz.",
    category: "USER",
    cooldown: 300,
    command: {
      enabled: true,
      aliases: ["b","booster"],
      usage: ".booster [isim]",
    },

    onLoad: function (client) { },

    onCommand: async function (client, message, args) { 

      let kanallar = kanal.KomutKullanımKanalİsim;
       if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && !kanallar.includes(message.channel.name)) return message.reply({ content: `${kanallar.map(x => `${client.channels.cache.find(chan => chan.name == x)}`)} kanallarında kullanabilirsiniz.`}).then((e) => setTimeout(() => { e.delete(); }, 10000)); 
       
       let booster = j2ponm.BoosterRole || undefined;
        if(!booster) 
        {
        message.reply({ content:"Booster Rolu Bulunamadı!"}).then((e) => setTimeout(() => { e.delete(); }, 5000)); 
        return }
        if(!message.member.roles.cache.has(booster)) 
        {
        message.react(`${client.emoji("server_carpi")}`)
        message.reply({ content:"Bu Komutu Kullanabilmek İçin Booster Rolüne Sahip Olmalısın!"}).then((e) => setTimeout(() => { e.delete(); }, 5000)); 
        return }
        let member = message.guild.members.cache.get(message.author.id);
        let isim = args.filter(arg => isNaN(arg)).map(arg => arg.charAt(0).replace('i', "İ").toUpperCase()+arg.slice(1)).join(" ");
        let ozelharf = /([^a-zA-ZIıİiÜüĞğŞşÖöÇç0-9 ]+)/gi;
        if (isim.match(ozelharf)) return message.channel.send({content:"Belirttiğin kullanıcı adında özel harfler bulunmaması gerekir lütfen tekrar dene!"});
        if(!isim) 
        {
        message.reply({ content:"Geçerli bir isim belirtmelisin!"}).then((e) => setTimeout(() => { e.delete(); }, 5000)); 
        return }
        const prefix = j2ponm.ServerUntagged || "";
        let j2poncik = `${prefix} ${isim}`.trim();
        message.react(`${client.emoji("server_onay")}`)
        member.setNickname(`${j2poncik}`).catch() 
        message.reply({ content:`Başarıyla ismin \`${j2poncik}\` olarak değiştirildi!`})
    },

  };