const { ApplicationCommandOptionType, EmbedBuilder, PermissionsBitField } = require("discord.js");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const j2poncik = require("../../../../../../Global/Settings/System");

module.exports = {
    name: "bağlantıkes",
    description: "Belirttiğiniz kullanıcıyı ses kanalından atarsınız.",
    category: "REGISTER",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["kes", "voicekick", "voice-kick", "at", "bağlantıkes"],
        usage: ".bağlantıkes",
    },

    onLoad: function (client) { },

    onCommand: async function (client, message, args, byj2ponembed) {

        if (!j2ponm.OwnerRoles.some(roleId => message.member.roles.cache.has(roleId)) &&
            !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            message.reply({ content: `Yeterli yetkin yok!` }).then((e) => setTimeout(() => { e.delete(); }, 5000));
            return;
        }

        let targetMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!targetMember) {
            return message.channel.send({
                content: "Bağlantısını kesmek istediğin kullanıcıyı belirtmelisin!",
            });
        }
        if (!targetMember.voice?.channel) {
            return message.channel.send({
                content: "Bağlantısını kesmek istediğiniz kullanıcı sesli odalarda bulunmuyor.",
            });
        }

        if (targetMember.voice.channel.parent?.id !== String(j2ponm.RegisterRoomCategory)) {
            return message.channel.send({
                content: `Yalnızca Kayıt Odalarından birinde bulunan kullanıcıların bağlantısını kesebilirsiniz! Bu kullanıcı şu an "${targetMember.voice.channel.name}" kanalında bulunmakta.`,
            });
        }
        

        if (message.member.roles.highest.rawPosition < targetMember.roles.highest.rawPosition) {
            return message.channel.send({
                content: "Rolleri senden yüksek birinin ses kanallarında ki bağlantısını kesemezsin.",
            });
        }

        const byj2pon = new EmbedBuilder()
            .setColor("Random")
            .setAuthor({
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ dynamic: true })
            })
            .setDescription(`<@${targetMember.id}> üyesi **${targetMember.voice.channel.name}** ses kanalından çıkarıldı.`);

        targetMember.voice.disconnect();
        message.react(`${client.emoji("server_onay")}`);
        message.channel.send({ embeds: [byj2pon] }).then((msg) => {
            setTimeout(() => {
                msg.delete();
            }, 5000);
        });
    },
};
