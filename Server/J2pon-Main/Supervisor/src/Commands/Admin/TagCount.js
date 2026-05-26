const { ApplicationCommandOptionType,PermissionsBitField,EmbedBuilder } = require("discord.js");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const j2poncik = require("../../../../../../Global/Settings/System");
const GuildTagService = require("../../../../../../Global/Services/GuildTagService");

module.exports = {
    name: "tagsay",
    description: "Tagdaki üyeleri listeler.",
    category: "ADMIN",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: [],
      usage: ".tagsay",
    },

    onLoad: function (client) { },

    onCommand: async function (client, message, args) {
        if(!j2ponm.OwnerRoles.some(j2ponlan => message.member.roles.cache.has(j2ponlan)) && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) 
        { 
        message.react(`${client.emoji("server_carpi")}`)
        message.reply({ content:`Yeterli yetkin yok!`}).then((e) => setTimeout(() => { e.delete(); }, 5000)); 
        return }
  
        const ServerTag = args.slice(0).join(" ") || (Array.isArray(j2ponm.ServerTag) ? j2ponm.ServerTag[0] : j2ponm.ServerTag);
        let page = 1;
        const taggedIds = await GuildTagService.getTaggedUserIds(message.guild.id);
        const memberss = message.guild.members.cache.filter((m) => taggedIds.includes(m.id) && !m.user.bot);
        let liste = memberss.map((member) => `${member} - \`${member.id}\``) || `**${ServerTag}** taglı kullanıcı yok`;
        var msg = await message.channel.send({ embeds: [new EmbedBuilder().setFooter({text: j2poncik.SubTitle}).setDescription(`Kullanıcı adında **${ServerTag}** tagı olan **${memberss.size}** kişi bulunuyor:\n\n ${liste.slice(page == 1 ? 0 : page * 40 - 40, page * 40).join('\n')}`)] });
        if (liste.length > 40) {
            await msg.react(`⬅️`);
            await msg.react(`➡️`);
            let collector = msg.createReactionCollector((react, user) => ["⬅️", "➡️"].some(e => e == react.emoji.name) && user.id == message.member.id, { time: 200000 });
            collector.on("collect", (react) => {
                if (react.emoji.name == "➡️") {
                    if (liste.slice((page + 1) * 40 - 40, (page + 1) * 40).length <= 0) return;
                    page += 1;
                    let tagsay = liste.slice(page == 1 ? 0 : page * 40 - 40, page * 40).join("\n");
                    msg.edit({ embeds: [new EmbedBuilder().setDescription(`Kullanıcı adında **${ServerTag}** tagı olan **${memberss.size}** kişi bulunuyor:\n\n${tagsay}`)] });
                    react.users.remove(message.author.id)
                }
                if (react.emoji.name == "⬅️") {
                    if (liste.slice((page - 1) * 40 - 40, (page - 1) * 40).length <= 0) return;
                    page -= 1;
                    let tagsay = liste.slice(page == 1 ? 0 : page * 40 - 40, page * 40).join("\n");
                    msg.edit({ embeds: [new EmbedBuilder().setDescription(`Kullanıcı adında **${ServerTag}** tagı olan **${memberss.size}** kişi bulunuyor:\n\n${tagsay}`)] });
                    react.users.remove(message.author.id)
                }
            })
        }

     },

  };