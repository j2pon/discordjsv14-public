const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const moment = require("moment");
const ceza = require("../../../../../../Global/Schemas/ceza");
const cezapuan = require("../../../../../../Global/Schemas/cezapuan");
const setup = require("../../../../../../Global/Settings/Setup.json");
const system = require("../../../../../../Global/Settings/System");
const kanal = require("../../../../../../Global/Settings/AyarName");

const banLimit = new Map();
moment.locale("tr");

module.exports = {
    name: "ban",
    description: "Belirttiğinz Üyeyi Banlar",
    category: "STAFF",
    cooldown: 0,
    command: {
      enabled: true,
      aliases: ["yargı","siktir","sg","uza"],
      usage: ".ban <@user/ID>",
    },
  

    onLoad: function (client) { },

    onCommand: async function (client, message, args) {
        // Yetki kontrolü
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers) && 
            !setup.BanHammer.some(x => message.member.roles.cache.has(x)) &&
            !setup.SponsorRoles.some(x => message.member.roles.cache.has(x))) {
            message.react(`${client.emoji("server_carpi")}`);
            return message.channel.send({ content: "Yeterli yetkin yok!" })
                .then((e) => setTimeout(() => { e.delete(); }, 5000));
        }

        // Kullanıcı kontrolü
        if (!args[0]) {
            message.react(`${client.emoji("server_carpi")}`);
            return message.channel.send({ content: "Banlanılacak üyeyi belirtmeyi unuttun!" })
                .then((e) => setTimeout(() => { e.delete(); }, 5000));
        }

        const user = message.mentions.users.first() || message.guild.members.cache.get(args[0]);
        if (!user) {
            message.react(`${client.emoji("server_carpi")}`);
            return message.channel.send({ content: "Böyle bir kullanıcı bulamadım!" })
                .then((e) => setTimeout(() => { e.delete(); }, 5000));
        }

        const reason = args.slice(1).join(" ") || "Belirtilmedi!";
        const member = message.guild.members.cache.get(user.id);

        // Güvenlik kontrolleri
        if (message.guild.members.cache.has(user.id) && 
            message.guild.members.cache.get(user.id).permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
            return message.channel.send({ content: "Üst yetkiye sahip kişileri yasaklayamazsın!" })
                .then((e) => setTimeout(() => { e.delete(); }, 5000));
        }

        if (message.guild.members.cache.has(user.id) && 
            message.member.roles.highest.position <= message.guild.members.cache.get(user.id).roles.highest.position) {
            return message.channel.send({ content: "Belirttiğin kişinin yetkisi ya senden yüksek ya da aynı yetkidesiniz!" })
                .then((e) => setTimeout(() => { e.delete(); }, 5000));
        }

        if (member && !member.bannable) {
            return message.channel.send({ content: "Bu üyeyi banlayamıyorum!" })
                .then((e) => setTimeout(() => { e.delete(); }, 5000));
        }

        // Ban limit kontrolü
        if (system.Mainframe.banlimit > 0 && 
            banLimit.has(message.author.id) && 
            banLimit.get(message.author.id) >= system.Mainframe.banlimit) {
            return message.channel.send({ content: "Saatlik ban sınırına ulaştın!" })
                .then((e) => setTimeout(() => { e.delete(); }, 5000));
        }

        // Log kanalı kontrolü
        const logChannel = client.channels.cache.find(x => x.name === "ban_log");
        if (!logChannel) {
            console.error("BAN LOG KANALI AYARLANMAMIŞ! LÜTFEN SETUPTAN KURULUMU YAPINIZ!");
        }

        // DM gönder
        if (system.Mainframe.dmMessages) {
            user.send({ 
                content: `**${message.guild.name}** sunucusundan, **${message.author.tag}** tarafından, **${reason}** sebebiyle banlandın!` 
            }).catch(() => {});
        }

        // Ban işlemi
        try {
            await message.guild.members.ban(user.id, { 
                reason: `${reason} | Yetkili: ${message.author.tag}`, 
                days: 1 
            });
        } catch (error) {
            console.error("Ban işlemi başarısız:", error);
        }

        // Ceza kaydı
        const penal = await client.penalize(message.guild.id, user.id, "Ban", true, message.author.id, reason);

        message.react(`${client.emoji("server_onay")}`);
        message.reply({ 
            content: `${user.id} ID'li kullanıcı başarıyla sunucudan yasaklandı! Ceza Numarası: (\`#${penal.id}\`)` 
        });

        // Log embed
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setDescription(`**${user.username}** adlı kullanıcıya **${message.author.username}** tarafından ban atıldı.`)
                .addFields(
                    { name: "Banlanan", value: `${member ? member.toString() : user.username}`, inline: true },
                    { name: "Banlayan", value: `${message.author}`, inline: true },
                    { name: "Sebep", value: `${reason}`, inline: true }
                )
                .setFooter({ text: `${moment(Date.now()).format("LLL")}` });
            
            logChannel.send({ embeds: [logEmbed] });
        }

        // Veritabanı güncellemeleri
        await Promise.all([
            ceza.findOneAndUpdate(
                { guildID: message.guild.id, userID: user.id }, 
                { $push: { ceza: 1 }, $inc: { top: 1 } }, 
                { upsert: true }
            ),
            ceza.findOneAndUpdate(
                { guildID: message.guild.id, userID: message.author.id }, 
                { $inc: { BanAmount: 1 } }, 
                { upsert: true }
            ),
            cezapuan.findOneAndUpdate(
                { guildID: message.guild.id, userID: user.id }, 
                { $inc: { cezapuan: 100 } }, 
                { upsert: true }
            )
        ]);

        // Ceza puanı log
        const cezapuanData = await cezapuan.findOne({ guildID: message.guild.id, userID: user.id });
        const punishmentLogChannel = client.channels.cache.find(x => x.name === "cezapuan-log");
        
        if (punishmentLogChannel) {
            punishmentLogChannel.send({ 
                content: `\`${user.username}\` üyesi ban cezası alarak toplam \`${cezapuanData ? cezapuanData.cezapuan : 0} ceza puanına\` ulaştı!` 
            });
        }

        // Ban limit güncelleme
        if (system.Mainframe.banlimit > 0) {
            if (!banLimit.has(message.author.id)) {
                banLimit.set(message.author.id, 1);
            } else {
                banLimit.set(message.author.id, banLimit.get(message.author.id) + 1);
            }
            
            setTimeout(() => {
                if (banLimit.has(message.author.id)) {
                    banLimit.delete(message.author.id);
                }
            }, 1000 * 60 * 60);
        }
    },

  };