const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const penals = require("../../../../../../Global/Schemas/penals");
const setup = require("../../../../../../Global/Settings/Setup.json");
const system = require("../../../../../../Global/Settings/System");
const kanal = require("../../../../../../Global/Settings/AyarName");

module.exports = {
    name: "unban",
    description: "Yasaklı kullanıcının yasağını kaldırırsınız.",
    category: "STAFF",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["un-ban"],
      usage: ".unban <ID>",
    },
 

    onLoad: function (client) {

          

     },

    onCommand: async function (client, message, args) {

        const allowedChannels = kanal.KomutKullanımKanalİsim;
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && 
            !allowedChannels.includes(message.channel.name)) {
            return message.reply({ 
                content: `${allowedChannels.map(x => `${client.channels.cache.find(chan => chan.name == x)}`)} kanallarında kullanabilirsiniz.`
            }).then((e) => setTimeout(() => { e.delete(); }, 10000)); 
        }

        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers) && 
            !setup.BanHammer.some(x => message.member.roles.cache.has(x)) &&
            !setup.SponsorRoles.some(x => message.member.roles.cache.has(x))) {
            message.react(`${client.emoji("server_carpi")}`);
            return message.channel.send({ content: "Yeterli yetkin bulunmuyor!" })
                .then((e) => setTimeout(() => { e.delete(); }, 5000)); 
        }
        if (!args[0]) {
            message.react(`${client.emoji("server_carpi")}`);
            return message.channel.send({ content: "Bir üye belirtmelisin!" })
                .then((e) => setTimeout(() => { e.delete(); }, 5000)); 
        }
        const ban = await client.fetchBan(message.guild, args[0]);
        if (!ban) {
            message.react(`${client.emoji("server_carpi")}`);
            return message.channel.send({ content: "Bu üye banlı değil!" })
                .then((e) => setTimeout(() => { e.delete(); }, 5000));
        }

        const logChannel = client.channels.cache.find(x => x.name === "ban_log");
        if (!logChannel) {
            console.error("BAN LOG KANALI AYARLANMAMIŞ! LÜTFEN SETUPTAN KURULUMU YAPINIZ!");
        }

        try {
            await message.guild.members.unban(args[0], `${message.author.username} tarafından kaldırıldı!`);
        } catch (error) {
            console.error("Unban işlemi başarısız:", error);
        }

        message.react(`${client.emoji("server_onay")}`);
        message.reply({ 
            content: `${client.emoji("server_onay")} \`(${ban.user.username.replace(/\`/g, "")} - ${ban.user.id})\` adlı üyenin banı ${message.author} tarafından kaldırıldı!`
        }).then((e) => setTimeout(() => { e.delete(); }, 50000));

        if (system.Mainframe.dmMessages) {
            ban.user.send({ 
                content: `**${message.guild.name}** sunucusunda, **${message.author.tag}** tarafından banınız kaldırıldı!`
            }).catch(() => {});
        }
    
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setDescription(`${ban.user.username.replace(/\`/g, "")} adlı kullanıcının ${message.author} tarafından ban cezası kaldırıldı.`)
                .addFields(
                    { name: "Affedilen", value: `${ban.user.username.replace(/\`/g, "")}`, inline: true },
                    { name: "Affeden", value: `${message.author}`, inline: true },
                    { name: "Ceza Bitiş:", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                );
            
            logChannel.send({ embeds: [logEmbed] });
        }
    },

  };