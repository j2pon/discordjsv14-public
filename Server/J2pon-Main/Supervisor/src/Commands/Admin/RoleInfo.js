const { ApplicationCommandOptionType, EmbedBuilder,PermissionsBitField } = require("discord.js");
const { nokta,star } = require("../../../../../../Global/Settings/Emojis.json")
const j2ponm = require("../../../../../../Global/Settings/Setup.json");

module.exports = {
    name: "rb",
    description: "Belirttiğiniz rolün bilgilerini alırsınız.",
    category: "ADMIN",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["rolbilgi","rolinfo","rol-bilgi"],
      usage: ".rolbilgi @Role", 
    },

    onLoad: function (client) { },

    onCommand: async function (client, message, args) {
      if(!j2ponm.OwnerRoles.some(j2ponlan => message.member.roles.cache.has(j2ponlan)) && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) 
      { 
      message.react(`${client.emoji("server_carpi")}`)
      message.reply({ content:`Yeterli yetkin yok!`}).then((e) => setTimeout(() => { e.delete(); }, 5000)); 
      return }

    let role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0])
    
    if (!args[0]) return message.reply({ content:"Bir rol etiketle!"})
    let members = role.members.map(byj2pon => `${client.emoji("server_nokta")} <@${byj2pon.id}> (\`${byj2pon.id}\`) `)
    let number = role.members.size
    if (number > 200) return message.reply({ content:`${role} rolünde toplam ${number} kişi olduğundan dolayı rol bilgisini yollayamıyorum.`})
    const byj2pon = new EmbedBuilder()
    .setThumbnail(message.guild.iconURL({ dynamic: true, size: 2048 }))
    .setDescription(`
    ${client.emoji("server_star")} __**${role.name} | Rol Bilgileri:**__
    ${client.emoji("server_nokta")} \`Rol Rengi             :\` ${role.hexColor}
    ${client.emoji("server_nokta")} \`Rol ID                :\` ${role.id}
    ${client.emoji("server_nokta")} \`Rol Kişi Sayısı       :\` ${number}

    ${client.emoji("server_star")} __**${role.name} | Roldeki Kişiler:**__
    ${members.join("\n") || "\` Rolde Kimse bulunmuyor. \`"}
    `)

    message.channel.send({embeds: [byj2pon]})
        
     },

  };