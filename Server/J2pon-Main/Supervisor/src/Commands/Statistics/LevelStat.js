const { ApplicationCommandOptionType,PermissionsBitField } = require("discord.js");
const levels = require("../../../../../../Global/Schemas/level");
const canvafy = require("canvafy");
const { profileImage } = require('discord-arts');
const kanal = require("../../../../../../Global/Settings/AyarName");

module.exports = {
    name: "level",
    description: "Levelinizi gösterir",
    category: "STAT",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["levelim"],
      usage: ".level", 
    },
  

    onLoad: function (client) { },

    onCommand: async function (client, message, args, byj2ponembed) {

    let kanallar = kanal.KomutKullanımKanalİsim;
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && !kanallar.includes(message.channel.name)) return message.reply({ content: `${kanallar.map(x => `${client.channels.cache.find(chan => chan.name == x)}`)} kanallarında kullanabilirsiniz.`}).then((e) => setTimeout(() => { e.delete(); }, 10000)); 
    let status;

    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
    const byj2pon = await levels.findOne({ guildID: message.guild.id, userID: member.user.id })
    if(member.presence && member.presence.status === "dnd") status = "#ff0000"
    if(member.presence && member.presence.status === "idle") status = "#ffff00"
    if(member.presence && member.presence.status === "online") status = "#00ff00"
    if(member.presence && member.presence.status === "offline") status = "#808080"

    const buffer = await profileImage(member.id, {
    borderColor: '#087996',
    presenceStatus: member.presence ? member.presence.status : 'offline',
    badgesFrame: true,
    rankData: {
      currentXp: byj2pon ? byj2pon.xp : 1,
      requiredXp: byj2pon ? byj2pon.gerekli : 500,
      level: byj2pon ? byj2pon.level : 1,
      barColor: '0b7b95'
}
})

return message.reply({files: [{name: "j2pon.png", attachment: buffer}]}).delete(15)



     },

  };