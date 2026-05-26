const { PermissionsBitField } = require("discord.js");
const setup = require("../../../../../../Global/Settings/Setup.json");
const system = require("../../../../../../Global/Settings/System");
const kanal = require("../../../../../../Global/Settings/AyarName");

module.exports = {
    name: "yetkibitir",
    description: "Kişinin yetkisini çekersiniz.",
    category: "STAT",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: [],
      usage: ".yetkibitir", 
    },
  

    onLoad: function (client) { },

    onCommand: async function (client, message, args) {
        if (!setup.OwnerRoles.some(role => message.member.roles.cache.has(role)) && 
            !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            message.react(`${client.emoji("server_carpi")}`);
            return message.reply({ content: "Yeterli yetkin yok!" })
                .then((e) => setTimeout(() => { e.delete(); }, 5000)); 
        }

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) {
            return message.channel.send({ content: "Bir üye belirtmeyi unuttun!" })
                .then((e) => setTimeout(() => { e.delete(); }, 5000)); 
        }

        const allowedRoles = [...setup.ManRoles, ...setup.GirlRoles, setup.BoosterRole];
        const rolesToKeep = member.roles.cache.filter(role => 
            role.id !== message.guild.id && allowedRoles.includes(role.id)
        );

        try {
            await member.roles.set(rolesToKeep);
            message.reply({ content: `${member} Kullanıcısının yetkileri başarı ile alındı` });
        } catch (error) {
            console.error("Yetki alma işlemi başarısız:", error);
            message.reply({ content: "Yetki alma işlemi başarısız oldu!" });
        }
    },

  };