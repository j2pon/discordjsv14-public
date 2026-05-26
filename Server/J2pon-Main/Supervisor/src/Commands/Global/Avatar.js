const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

module.exports = {
    name: "avatar",
    description: "Kullanıcının avatarını gösterir.",
    category: "USER",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["av"],
      usage: ".avatar",
    },
  

    onLoad: function (client) { },

    onCommand: async function (client, message, args) {
        if (!message.guild) return;

        const member = args.length > 0 ? 
            message.mentions.users.first() || 
            await client.users.fetch(args[0]).catch(() => null) || 
            message.author : 
            message.author;

        const linkButton = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("Tarayıcıda Aç")
                .setStyle(ButtonStyle.Link)
                .setURL(member.displayAvatarURL({ dynamic: true, size: 4096 }))
        );

        const embed = new EmbedBuilder()
            .setFooter({ text: `${message.author.username} tarafından istendi` })
            .setTitle(`${member.username} Kullanıcısının Profil Fotoğrafı:`)
            .setImage(member.displayAvatarURL({ dynamic: true, size: 2048 }));

        await message.channel.send({ 
            embeds: [embed], 
            components: [linkButton] 
        }); 
    },

  };