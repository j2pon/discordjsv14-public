const { ApplicationCommandOptionType, EmbedBuilder, PermissionsBitField } = require("discord.js");
const { red, green } = require("../../../../../../Global/Settings/Emojis.json");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const moment = require("moment");
const j2poncik = require("../../../../../../Global/Settings/System");

module.exports = {
    name: "nerede",
    description: "Belirttiğiniz kullanıcının hangi ses kanalında olduğu hakkında bilgi verir.",
    category: "ADMIN",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["seskontrol","n"],
        usage: ".nerede [@kullanıcı/ID]", 
    },

    onLoad: function (client) { },

    onCommand: async function (client, message, args) { 

        if(!j2ponm.ConfirmerRoles.some(j2ponlan => message.member.roles.cache.has(j2ponlan))) {
            return message.react(client.emoji("server_carpi"));
        }

        if (!args[0]) {
            return message.reply("Bir kullanıcı belirtmelisiniz! Örnek: `.nerede @Kullanıcı`");
        }

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) {
            return message.reply("Geçerli bir kullanıcı belirtmelisiniz!");
        }

        if (!member.voice.channel) {
            return message.reply(`${member.toString()} şu anda herhangi bir ses kanalında değil!`);
        }

        try {
            const voiceChannel = member.voice.channel;
            let sestekiler = voiceChannel.members.size >= 20 
                ? "Kanalda 20'den fazla kullanıcı var!" 
                : voiceChannel.members.map(x => x.user.toString()).join(", ");

            const invite = await voiceChannel.createInvite({ maxAge: 300 }); 
            const embed = new EmbedBuilder()
                .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
                .setDescription(
                    `**${member.toString()} kullanıcısı <#${voiceChannel.id}> kanalında!**\n` +
                    `**Mikrofon:** ${member.voice.mute ? 'Kapalı 🔴' : 'Açık 🟢'}\n` +
                    `**Kulaklık:** ${member.voice.deaf ? 'Kapalı 🔴' : 'Açık 🟢'}\n` +
                    `**Sesteki Kullanıcılar:**\n${sestekiler}\n\n` +
                    `[Kanala gitmek için tıkla!](https://discord.gg/${invite.code})`
                )
                .setFooter({ text: `${moment().format("LLL")} | ${j2poncik.SubTitle}` })
                .setColor("#2b2d31");

            message.reply({ embeds: [embed] });
            message.react(client.emoji("server_onay"));

        } catch (error) {
            console.error("Hata oluştu:", error);
            message.reply("Bir hata oluştu, lütfen daha sonra tekrar deneyin!");
        }
    }
};